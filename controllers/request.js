// Import necessary modules and models
const User = require("../models/user")
const { Account } = require('../models/accounts');
const UserRequest = require("../models/userRequest");
const { v4: uuidv4 } = require('uuid');


//Controller for creating a request
module.exports.createRequest = async (req, res) => {
    try {
        const { deposit, accountFrom: accountId } = req.body.account;
        const account = await Account.findById(accountId);
        if (!account) {
            req.flash('error', 'Account not found');
            return res.redirect('/accountViews/myAccounts');
        }

        const accountType = account.accountType;
        const depositInCents = Math.round(deposit * 100);

        const frontImage = req.files.frontImage ? {
            url: req.files.frontImage[0].path,
            filename: req.files.frontImage[0].filename
        } : null;

        console.log("FrontImage URL " + frontImage.url);

        const backImage = req.files.backImage ? {
            url: req.files.backImage[0].path,
            filename: req.files.backImage[0].filename
        } : null;


        const request = new UserRequest({
            amountInCents: depositInCents,
            user: req.user._id,
            accountFrom: {
                id: accountId,
                accountType: accountType
            },
            images: {
                frontImage: frontImage,
                backImage: backImage
            }
        });

        await request.save();
        req.flash('success', 'Request sent to admin for approval');
        res.redirect('/accountViews/myAccounts');
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while creating the request');
        res.redirect('/accountViews/myAccounts');
    }
};

//Controller for an admin when they approve a users request
module.exports.approveRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const request = await UserRequest.findById(requestId);

        if (!request) {
            req.flash('error', 'Request not found');
            return res.redirect('/accountViews/adminRequests');
        }

        request.approved = true;
        await request.save();

        const accountId = request.accountFrom.id;

        const account = await Account.findById(accountId);
        if (account) {

            const toTransaction = {
                amountInCents: request.amountInCents,
                type: "Deposit",
                date: new Date()
            };
            account.totalInCents += request.amountInCents;
            account.transactions.push(toTransaction);
            await account.save();
        } else {
            console.error('Account not found');
            req.flash('error', 'Account not found');
            return res.redirect('/accountViews/adminRequests');
        }

        res.redirect('/accountViews/adminRequests');
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while approving the request');
        res.redirect('/accountViews/adminRequests');
    }
};

//Controller for an admin to deny a users request
module.exports.denyRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const request = await UserRequest.findById(requestId);

        if (!request) {
            req.flash('error', 'Request not found');
            return res.redirect('/accountViews/adminRequests');
        }

        request.approved = false;
        await request.save();

        res.redirect('/accountViews/adminRequests');
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while denying the request');
        res.redirect('/accountViews/adminRequests');
    }
};

//Controller for a user when they request a credit card
module.exports.creditCardRequests = async (req, res) => {
    try {
        const { accountFrom: accountId, account: { cardType: creditCardType, employmentStatus, grossIncome } } = req.body;


        const account = await Account.findById(accountId);
        if (!account) {
            req.flash('error', 'Account not found');
            return res.redirect('/accountViews/myAccounts');
        }

        const accountType = account.accountType;

        const request = new UserRequest({
            user: req.user._id,
            accountFrom: {
                id: accountId,
                accountType: accountType
            },
            creditCardInfo: {
                creditCardType: creditCardType,
                employmentStatus: employmentStatus,
                grossIncome: grossIncome
            }

        });

        await request.save();
        req.flash('success', 'Request sent to admin for approval');
        res.redirect('/accountViews/myAccounts');
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while requesting the credit card');
        res.redirect('/accountViews/myAccounts');
    }
}

//Controller for a user when they request a loan
module.exports.loanRequests = async (req, res) => {
    try {
        const { accountFrom: accountId, account: { loanAmount, loanType, loanTerm, minimumMonthly } } = req.body;

        const account = await Account.findById(accountId);
        if (!account) {
            req.flash('error', 'Account not found');
            return res.redirect('/accountViews/myAccounts');
        }

        const loanAmountInCents = parseFloat(loanAmount) * 100;

        const accountType = account.accountType;

        const monthlyMinimumInCents = parseFloat(minimumMonthly) * 100;

        const request = new UserRequest({
            user: req.user._id,
            amountInCents: loanAmountInCents,
            accountFrom: {
                id: accountId,
                accountType: accountType
            },
            loanInfo: {
                loanType: loanType,
                loanTerm: loanTerm,
                monthlyMinimumInCents: monthlyMinimumInCents
            }
        });
        await request.save();
        req.flash('success', 'Request sent to admin for approval');
        res.redirect('/accountViews/myAccounts');
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while requesting the loan');
        res.redirect('/accountViews/myAccounts');
    }
}

//Controller for an admin when they approve a users card request
module.exports.cardApproved = async (req, res) => {
    try {
        const uniqueId = await generateUniqueId();
        const { requestId } = req.params;
        const request = await UserRequest.findById(requestId);

        if (!request) {
            req.flash('error', 'Request not found');
            return res.redirect('/accountViews/adminRequests');
        }

        request.approved = true;
        await request.save();

        const account = new Account(req.body.account);
        account.holder = request.user._id;
        account._id = uniqueId;
        account.totalInCents = request.totalInCents;
        account.accountType = "Credit";
        account.creditCardName = request.creditCardInfo.creditCardType;
        account.nextPaymentDueDate = calculateNextPaymentDate();
        account.paymentOverdue = false;

        if (account.creditCardName === "Saphire") {
            account.creditLimit = 2500;
            account.interestRate = .03;
        } else if (account.creditCardName === "Ruby") {
            account.creditLimit = 5000;
            account.interestRate = .02;
        } else if (account.creditCardName === "Emerald") {
            account.creditLimit = 50000;
            account.interestRate = .01;
        } else {
            console.log("No match found for credit card type");
        }

        await account.save();
        const user = await User.findById(request.user._id);
        user.numOfAccounts += 1;
        user.accountIds.push(account._id);
        await user.save();
        res.redirect(`/accountViews/adminRequests`)

    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while approving the Card');
        res.redirect('/accountViews/adminRequests');
    }
}

//Controller when an admin approves a loan request from a user
module.exports.loanApproved = async (req, res) => {
    try {
        const uniqueId = await generateUniqueId();
        const { requestId } = req.params;
        const request = await UserRequest.findById(requestId);

        if (!request || !request.loanInfo) {
            req.flash('error', 'Loan request not found or invalid');
            return res.redirect('/accountViews/adminRequests');
        }


        const bankAccountId = 'BANK-001';
        const bankAccount = await Account.findOne({ accountId: bankAccountId });

        if (!bankAccount || bankAccount.totalInCents < request.amountInCents) {
            req.flash('error', 'Bank does not have sufficient funds to approve this loan');
            return res.redirect('/accountViews/adminRequests');
        }


        bankAccount.totalInCents -= request.amountInCents;
        await bankAccount.save();


        const userLoanAccount = new Account({
            holder: request.user._id,
            _id: uniqueId,
            totalInCents: request.amountInCents,
            accountType: "Loan",
            loanInfo: {
                loanType: request.loanInfo.loanType,
                loanTerm: request.loanInfo.loanTerm,
                monthlyMinimumInCents: request.loanInfo.monthlyMinimumInCents
            },
            nextPaymentDueDate: calculateNextPaymentDate(),
            paymentOverdue: false
        });
        await userLoanAccount.save();

        const bankTransaction = {
            amountInCents: -request.amountInCents,
            type: 'Withdrawal',
            date: new Date()
        };
        bankAccount.transactions.push(bankTransaction);
        await bankAccount.save();

        const user = await User.findById(request.user._id);
        user.numOfAccounts += 1;
        user.accountIds.push(userLoanAccount._id);
        await user.save();


        request.approved = true;
        await request.save();

        res.redirect(`/accountViews/adminRequests`);

    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while approving the loan');
        res.redirect('/accountViews/adminRequests');
    }
};

//Controller for when a certain request is to get deleted by an admin
module.exports.deleteRequest = async (req, res) => {
    try {
        const { id } = req.params;
        await Request.findByIdAndDelete(id);
        res.redirect('/requests');
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while deleting the request');
        res.redirect('/accountViews/adminRequests');
    }
};

//Controller to get a next month for due dates for loans
function calculateNextPaymentDate() {
    let today = new Date();
    let nextPaymentDate = new Date(today.getFullYear(), today.getMonth() + 1, 1); // Sets the date to the 1st of next month
    return nextPaymentDate;
}

//Generates a random ID for each account
function generateRandomId() {
    const min = Math.pow(10, 11);
    const max = Math.pow(10, 12) - 1;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//Ensures that each ID is unique or else it re-rolls
async function generateUniqueId() {
    let uniqueId;
    let userExists = true;
    while (userExists) {
        uniqueId = generateRandomId();
        userExists = await User.exists({ _id: uniqueId });
    }
    return uniqueId;
}
