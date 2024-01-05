// Import necessary modules and models
const { v4: uuidv4 } = require('uuid');
const { Account } = require('../models/accounts');
const User = require('../models/user');
const UserRequest = require('../models/userRequest');
const { Message } = require('../models/accounts');

// Controller for displaying all accounts
module.exports.index = async (req, res) => {
    try {
        const accounts = await Account.find({});
        res.render("/accountViews/myAccounts", { accounts });
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while loading the index');
        res.redirect('/');
    }
}

// Controller for displaying user's accounts
module.exports.myAccounts = async (req, res) => {
    try {
        const accounts = await Account.find({});
        res.render("accountViews/myAccounts", { accounts });
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error while loading your accounts');
        res.redirect('/');
    }
}

// Controller for rendering the account creation page
module.exports.renderCreateAccount = async (req, res) => {
    try {
        const accounts = await Account.find({ holder: req.user._id });
        res.render('accountViews/createAccount', { accounts, userId: req.user._id });
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while rendering the createAccount page');
        res.redirect('/');
    }
};

// Controller for creating a new account
module.exports.createAccount = async (req, res) => {
    try {
        const uniqueId = await generateUniqueId();
        const account = new Account(req.body.account);
        account.holder = req.user._id;
        account._id = uniqueId;
        account.totalInCents = 0;
        await account.save();
        const user = await User.findById(req.user._id);
        user.numOfAccounts += 1;
        user.accountIds.push(account._id);
        await user.save();
        res.redirect(`/accountViews/${account._id}`)
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while creating an account');
        res.redirect('/accountViews/myAccounts');
    }
}

// Controller for rendering the request card page
module.exports.renderRequestCard = async (req, res) => {
    try {
        const accounts = await Account.find({ holder: req.user._id });
        res.render('accountViews/requestCard', { accounts });
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while rendering the RequestCard page');
        res.redirect('/');
    }
};

// Controller for rendering the request loan page
module.exports.renderRequestLoan = async (req, res) => {
    try {
        const accounts = await Account.find({ holder: req.user._id });
        res.render('accountViews/requestLoan', { accounts });
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while rendering the RequestLoan page');
        res.redirect('/');
    }
};

// Controller for rendering the transfer to a friend page
module.exports.renderTransferFriend = async (req, res) => {
    try {
        const accounts = await Account.find({ holder: req.user._id });
        res.render('accountViews/transferFriend', { accounts });
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while rendering the RequestLoan page');
        res.redirect('/');
    }
};

// Controller for rendering the transfer between account page
module.exports.renderTransferAccount = async (req, res) => {
    try {
        const accounts = await Account.find({ holder: req.user._id });
        res.render('accountViews/transferAccount', { accounts });
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while rendering the RequestLoan page');
        res.redirect('/');
    }
};

// Controller for rendering the pay off loan page
module.exports.renderPayOffLoan = async (req, res) => {
    try {
        const accounts = await Account.find({ holder: req.user._id });
        res.render('accountViews/payOffLoan', { accounts });
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while rendering the RequestLoan page');
        res.redirect('/');
    }
};

// Controller for rendering the choosing to transfer page
module.exports.transfer = async (req, res) => {
    try {
        const accounts = await Account.find({ holder: req.user._id });
        res.render("accountViews/transfer", { accounts });
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while rendering the transfer page');
        res.redirect('/accountViews/myAccounts');
    }
}

// Controller for sending messages
module.exports.sendMessage = async (req, res) => {
    try {
        const { email, name, message } = req.body;

        const tempName = capitalizeFirstLetter(name).trim();
        const tempEmail = email.toLowerCase().trim();
        const tempMessage = capitalizeFirstLetter(message).trim();
        const newMessage = new Message({
            email: tempEmail,
            name: tempName,
            message: tempMessage
        });

        await newMessage.save();
        req.flash('success', 'Your message has been sent successfully.');
        res.redirect('/contactUs');
    } catch (e) {
        console.error("Error:", e);
        req.flash('error', 'An error occurred while sending your message.');
        res.redirect('/contactUs');
    }
}

// Utility function for capitalizing the first letter of a string
function capitalizeFirstLetter(string) {
    return string.toLowerCase().replace(/\b(\w)/g, function (s) {
        return s.toUpperCase();
    });
}

// Controller for displaying user requests
module.exports.renderUserRequests = async (req, res) => {
    try {
        const userId = req.user._id;

        const requests = await UserRequest.find({ user: userId })
            .populate({
                path: 'accountFrom.id',
                model: 'Account'
            });

        if (requests.length === 0) {
            return res.render("accountViews/requestStatus", { requests, account: null });
        }

        const account = requests[0].accountFrom.id;

        if (!account) {
            return res.status(404).send('Account not found');
        }

        res.render("accountViews/requestStatus", { requests, account });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}

// Controller for processing a transfer
module.exports.processTransfer = async (req, res) => {
    try {
        const fromAccountId = req.body.transferFromAccount;
        const toUsername = req.body.transferToAccount;
        if (fromAccountId) {
            const transferAmount = Math.round(req.body.account.totalInCents * 100);

            const fromAccount = await Account.findById(fromAccountId);
            const toUser = await User.findOne({ username: toUsername });

            if (!toUser) {
                req.flash('error', 'User not found!');
                return res.redirect('/accountViews/transfer');
            }

            const toAccountId = toUser.accountIds[0];
            if (!toAccountId) {
                req.flash('error', 'Account not found for the specified user!');
                return res.redirect('/accountViews/transfer');
            }

            const toAccount = await Account.findById(toAccountId);

            if (toAccount.accountType === 'Loan') {
                req.flash('error', 'Cannot transfer to a Loan account!');
                return res.redirect('/accountViews/transfer');
            }

            if (fromAccountId !== toAccountId.toString()) {
                if (fromAccount.accountType === 'Credit') {
                    const potentialNewBalance = fromAccount.totalInCents - transferAmount;
                    if (potentialNewBalance < -fromAccount.creditLimit) {
                        req.flash('error', 'Credit limit exceeded!');
                        return res.redirect('/accountViews/transfer');
                    }
                } else {
                    if (fromAccount.totalInCents < transferAmount) {
                        req.flash('error', 'Insufficient funds!');
                        return res.redirect('/accountViews/transfer');
                    }
                }

                const fromTransactionAmount = fromAccount.accountType === 'Credit' ? transferAmount : -transferAmount;
                const toTransactionAmount = toAccount.accountType === 'Credit' ? -transferAmount : transferAmount;

                const fromTransaction = {
                    amountInCents: fromTransactionAmount,
                    type: "Withdrawal",
                    date: new Date()
                };

                const toTransaction = {
                    amountInCents: toTransactionAmount,
                    type: "Deposit",
                    date: new Date()
                };

                fromAccount.transactions.push(fromTransaction);
                toAccount.transactions.push(toTransaction);

                fromAccount.totalInCents += fromTransactionAmount;
                toAccount.totalInCents += toTransactionAmount;

                await fromAccount.save();
                await toAccount.save();

                req.flash('success', 'Transfer successful!');
                res.redirect('/accountViews/myAccounts');
            } else {
                req.flash('error', 'Cannot transfer to the same account');
                res.redirect('/accountViews/myAccounts');
            }
        } else {
            req.flash('error', 'Invalid account ID');
            res.redirect('/accountViews/myAccounts');
        }
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while trying to transfer');
        res.redirect('/accountViews/myAccounts');
    }
};

// Controller for processing a transfer within the same user's accounts
module.exports.processTransferWithin = async (req, res) => {
    try {
        const fromAccountId = req.body.transferFromAccount;
        const toAccountId = req.body.transferToAccount;

        if (fromAccountId != toAccountId) {
            const transferAmount = Math.round(req.body.account.total * 100);
            const fromAccount = await Account.findById(fromAccountId);
            const toAccount = await Account.findById(toAccountId);

            if (toAccount.accountType === 'Loan') {
                req.flash('error', 'Cannot transfer to a Loan account!');
                return res.redirect('/accountViews/transfer');
            }

            if (fromAccount.accountType === 'Credit') {
                const potentialNewBalance = fromAccount.totalInCents - transferAmount;
                if (potentialNewBalance < -fromAccount.creditLimit * 100) {
                    req.flash('error', 'Credit limit exceeded!');
                    return res.redirect('/accountViews/transfer');
                }
            } else {
                if (fromAccount.totalInCents < transferAmount) {
                    req.flash('error', 'Insufficient funds!');
                    return res.redirect('/accountViews/transfer');
                }
            }

            const fromTransactionAmount = fromAccount.accountType === 'Credit' ? transferAmount : -transferAmount;
            const toTransactionAmount = toAccount.accountType === 'Credit' ? -transferAmount : transferAmount;

            const fromTransaction = {
                amountInCents: fromTransactionAmount,
                type: "Withdrawal",
                date: new Date()
            };

            const toTransaction = {
                amountInCents: toTransactionAmount,
                type: "Deposit",
                date: new Date()
            };

            fromAccount.transactions.push(fromTransaction);
            toAccount.transactions.push(toTransaction);

            fromAccount.totalInCents += fromTransactionAmount;
            toAccount.totalInCents += toTransactionAmount;

            await fromAccount.save();
            await toAccount.save();

            req.flash('success', 'Transfer successful!');
            res.redirect('/accountViews/myAccounts');
        } else {
            req.flash('error', 'Cannot transfer to the same account');
            res.redirect('/accountViews/myAccounts');
        }
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while trying to transfer');
        res.redirect('/accountViews/myAccounts');
    }
};

// Controller for making a payment to pay off a balance
module.exports.payOffBalance = async (req, res) => {
    try {
        const fromAccountId = req.body.transferFromAccount;
        const payingOffAccountId = req.body.payingOffAccount;
        const paymentAmountInCents = Math.round(req.body.account.totalInCents * 100);
        const fromAccount = await Account.findById(fromAccountId);
        const payingOffAccount = await Account.findById(payingOffAccountId);
        const bankAccount = await Account.findOne({ accountId: "BANK-001" });

        const minimumPaymentInCents = payingOffAccount.accountType === 'Credit' ?
            payingOffAccount.minimumPaymentInCents :
            payingOffAccount.loanInfo.monthlyMinimumInCents;

        if (paymentAmountInCents < minimumPaymentInCents) {
            req.flash('error', 'The amount paid is less than the minimum required payment.');
            return res.redirect('/accountViews/transfer');
        }

        if (fromAccount.totalInCents < paymentAmountInCents) {
            req.flash('error', 'Insufficient funds for this transaction.');
            return res.redirect('/accountViews/transfer');
        }

        fromAccount.totalInCents -= paymentAmountInCents;
        payingOffAccount.totalInCents -= paymentAmountInCents;
        bankAccount.totalInCents += paymentAmountInCents;


        fromAccount.transactions.push({
            amountInCents: -paymentAmountInCents,
            type: "Payment",
            date: new Date()
        });

        payingOffAccount.transactions.push({
            amountInCents: paymentAmountInCents,
            type: "Payment Received",
            date: new Date()
        });

        bankAccount.transactions.push({
            amountInCents: paymentAmountInCents,
            type: "Deposit",
            date: new Date()
        });

        if (payingOffAccount.accountType === 'Loan' && new Date() < payingOffAccount.nextPaymentDueDate) {
            payingOffAccount.nextPaymentDueDate = getNextMonthFirstDay(payingOffAccount.nextPaymentDueDate);
        }

        if (payingOffAccount.paymentOverdue) {
            payingOffAccount.paymentOverdue = false;
            payingOffAccount.isFrozen = false;
        }

        await fromAccount.save();
        await payingOffAccount.save();
        await bankAccount.save();

        req.flash('success', 'Payment successful!');
        res.redirect('/accountViews/transfer');
    } catch (error) {
        console.error('Error:', error);
        req.flash('error', 'An error occurred during the transaction.');
        res.redirect('/accountViews/transfer');
    }
};

// Controller for rendering the form to create a new account
module.exports.renderNewForm = async (req, res) => {
    try {
        const userId = req.user._id;
        const accounts = await Account.find({ holder: userId });
        res.render("accountViews/newAccount", { accounts, userId });
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while loading the form');
        res.redirect("accountViews/myAccounts");
    }
}

// Controller for showing account details
module.exports.showAccount = async (req, res, next) => {
    try {

        const account = await Account.findById(req.params.id).populate('holder');

        if (account.accountType.trim().toLowerCase() === 'credit') {
            const minimumPayment = calculateMinimumPayment(account.totalInCents / 100, account.interestRate);
            account.minimumPaymentInCents = minimumPayment * 100;
            await account.save();
        }


        if (!account) {
            req.flash('error', 'Cannot find that account!');
            return res.redirect('/accountViews/myAccounts');
        }
        res.render("accountViews/show", { account });
    } catch (e) {
        if (e.name === 'CastError') {
            req.flash('error', 'Cannot find that account');
            return res.redirect('/accountViews/myAccounts');
        }
        next(e);
    }
}

// Utility function for calculating minimum payment
function calculateMinimumPayment(balance, interestRate) {
    const rate = interestRate;
    let minimumPayment = balance * rate;

    const minimumAmount = 25;
    if (minimumPayment < minimumAmount) {
        minimumPayment = minimumAmount;
    }

    return minimumPayment;
}

// Controller for rendering the account edit form
module.exports.renderEditForm = async (req, res) => {
    try {
        const { id } = req.params;
        const account = await Account.findById(id);
        const userId = req.user._id;
        const accounts = await Account.find({ holder: userId });

        if (!account) {
            req.flash('error', 'Cannot find that account!');
            return res.redirect('/accountViews/myAccounts');
        }
        res.render("accountViews/editAccount", { account, accounts });
    } catch (e) {
        if (e.name === 'CastError') {
            req.flash('error', 'Cannot find that account');
            return res.redirect('/accountViews/myAccounts');
        }
        next(e);
    }
}

// Controller for updating an account with a deposit
module.exports.updateAccountWithDeposit = async (req, res) => {
    try {
        const { id } = req.params;
        const depositAmount = parseFloat(req.body.account.deposit);

        const request = new Request({
            user: req.user._id,
            amountInCents: depositAmount,
            accountFrom: id,
            status: 'pending'
        });

        await request.save();
        res.redirect(`/accountViews/${id}`);
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while updating the account');
        res.redirect('/accountViews/myAccounts');
    }
};

//Controller for an admin to freeze an account
module.exports.freezeAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const account = await Account.findById(id);
        if (!account) {
            req.flash('error', 'Account not found');
            return res.redirect('/accountViews/adminView');
        }
        account.isFrozen = true;
        await account.save();
        res.redirect('/accountViews/adminView');
    } catch (error) {
        console.error('Error:', error);
        req.flash('error', 'An error occurred while freezing the account');
        res.redirect('/accountViews/adminView');
    }
};

//Controller for an admin to unfreeze an account
module.exports.unfreezeAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const account = await Account.findById(id);
        if (!account) {
            req.flash('error', 'Account not found');
            return res.redirect('/accountViews/adminView');
        }
        account.isFrozen = false;
        await account.save();
        res.redirect('/accountViews/adminView');
    } catch (error) {
        console.error('Error:', error);
        req.flash('error', 'An error occurred while unfreezing the account');
        res.redirect('/accountViews/adminView');
    }
};

//Controller for a user to lock an account
module.exports.lockAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const account = await Account.findById(id);
        if (!account) {
            req.flash('error', 'Account not found');
            return res.redirect('/accountViews/myAccounts');
        }
        account.isLocked = true;
        await account.save();
        res.redirect('/accountViews/myAccounts');
    } catch (error) {
        console.error('Error:', error);
        req.flash('error', 'An error occurred while locking the account');
        res.redirect('/accountViews/myAccounts');
    }
};

//Controller for a user to unlock an account
module.exports.unlockAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const account = await Account.findById(id);
        if (!account) {
            req.flash('error', 'Account not found');
            return res.redirect('/accountViews/myAccounts');
        }
        account.isLocked = false;
        await account.save();
        res.redirect('/accountViews/myAccounts');
    } catch (error) {
        console.error('Error:', error);
        req.flash('error', 'An error occurred while unlocking the account');
        res.redirect('/accountViews/myAccounts');
    }
};

//Controller for a user to delete an account
module.exports.deleteAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(req.user._id);
        const account = await Account.findById(id);
        if (user.numOfAccounts > 1 && account.totalInCents === 0) {
            await Account.findByIdAndDelete(id);
            user.numOfAccounts -= 1;
            user.accountIds = user.accountIds.filter(accountId => !accountId.equals(account._id));
            await user.save();
            res.redirect("/accountViews/myAccounts")
        }
        else {
            req.flash('error', 'Must have one account and account must be empty');
            res.redirect("/accountViews/myAccounts")
        }
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while deleting the account');
        res.redirect('/accountViews/myAccounts');
    }
}



//Controller to get a next month for due dates for loans
function getNextMonthFirstDay(currentDueDate) {
    let dueDate = new Date(currentDueDate);
    dueDate.setMonth(dueDate.getMonth() + 1);
    dueDate.setDate(1);
    return dueDate;
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
