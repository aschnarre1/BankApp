const User = require("../models/user")
const { Account } = require('../models/accounts');
const UserRequest = require("../models/userRequest");
const { v4: uuidv4 } = require('uuid');



module.exports.createRequest = async (req, res) => {
    try {
        const { deposit, accountFrom: accountId } = req.body.account;

        const account = await Account.findById(accountId);
        if (!account) {
            req.flash('error', 'Account not found');
            return res.redirect('/accountViews/myAccounts');
        }

        const accountType = account.accountType;

        const depositInCents = Math.round(req.body.account.deposit * 100);

        const request = new UserRequest({
            amountInCents: depositInCents,
            user: req.user._id,
            accountFrom: {
                id: accountId,
                accountType: accountType
            }
        });
        request.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
        await request.save();
        req.flash('success', 'Request sent to admin for approval');
        res.redirect('/accountViews/myAccounts');
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while creating the request');
        res.redirect('/accountViews/myAccounts');
    }
};



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

        req.flash('success', 'Request approved');
        res.redirect('/accountViews/adminRequests');
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while approving the request');
        res.redirect('/accountViews/adminRequests');
    }
};

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

        req.flash('success', 'Request denied');
        res.redirect('/accountViews/adminRequests');
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while denying the request');
        res.redirect('/accountViews/adminRequests');
    }
};



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







module.exports.cardApproved = async (req, res) => {
    try {
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
        account.accountId = uuidv4();
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
        req.flash('success', 'Successfully made a new Account!');
        res.redirect(`/accountViews/adminRequests`)

    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while approving the Card');
        res.redirect('/accountViews/adminRequests');
    }
}





module.exports.loanApproved = async (req, res) => {
    try {
        const { requestId } = req.params;
        const request = await UserRequest.findById(requestId);

        if (!request || !request.loanInfo) {
            req.flash('error', 'Loan request not found or invalid');
            return res.redirect('/accountViews/adminRequests');
        }

        // Find the bank's account by its custom account ID
        const bankAccountId = 'BANK-001'; // Bank's custom account ID
        const bankAccount = await Account.findOne({ accountId: bankAccountId });

        if (!bankAccount || bankAccount.totalInCents < request.amountInCents) {
            req.flash('error', 'Bank does not have sufficient funds to approve this loan');
            return res.redirect('/accountViews/adminRequests');
        }

        // Deduct the loan amount from the bank's account
        bankAccount.totalInCents -= request.amountInCents;
        await bankAccount.save();

        // Create a new loan account for the user
        const userLoanAccount = new Account({
            holder: request.user._id,
            accountId: uuidv4(),
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
            amountInCents: -request.amountInCents, // Negative because it's a withdrawal
            type: 'Withdrawal',
            date: new Date() // Automatically set to current date
        };
        bankAccount.transactions.push(bankTransaction);
        await bankAccount.save();

        // Update the user's account information
        const user = await User.findById(request.user._id);
        user.numOfAccounts += 1;
        user.accountIds.push(userLoanAccount._id);
        await user.save();

        // Mark the request as approved
        request.approved = true;
        await request.save();

        req.flash('success', 'Successfully approved the loan request!');
        res.redirect(`/accountViews/adminRequests`);

    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while approving the loan');
        res.redirect('/accountViews/adminRequests');
    }
};




module.exports.deleteRequest = async (req, res) => {
    try {
        const { id } = req.params;
        await Request.findByIdAndDelete(id);
        req.flash('success', 'Request deleted');
        res.redirect('/requests');
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while deleting the request');
        res.redirect('/accountViews/adminRequests');
    }
};



function calculateNextPaymentDate() {
    let today = new Date();
    let nextPaymentDate = new Date(today.getFullYear(), today.getMonth() + 1, 1); // Sets the date to the 1st of next month
    return nextPaymentDate;
}