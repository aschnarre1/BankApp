const { v4: uuidv4 } = require('uuid');
const User = require('../models/user');
const { Account } = require('../models/accounts');
const UserRequest = require('../models/userRequest');
const { Message } = require('../models/accounts');
const crypto = require('crypto');
require('dotenv').config();




module.exports.renderRegister = (req, res) => {
    try {
        res.render('users/register');
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while rendering the register page');
        res.redirect('/');
    }
}



module.exports.renderCreditInfo = async (req, res) => {
    try {
        res.render("users/creditCardInfo");
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while rendering the Credit Info page');
        res.redirect('/');
    }
}
module.exports.renderLoanInfo = async (req, res) => {
    try {
        res.render("users/loanInfo");
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while rendering the Loan Info page');
        res.redirect('/');
    }
}
module.exports.renderAboutUs = async (req, res) => {
    try {
        res.render("users/aboutUs");
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while rendering the About Us page');
        res.redirect('/');
    }
}
module.exports.renderContactUs = async (req, res) => {
    try {
        res.render("users/contactUs");
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while rendering the Contact Us page');
        res.redirect('/');
    }
}





const ENCRYPTION_KEY = process.env.ENCRYPTION_SECRET;
const IV_LENGTH = 16;

function encrypt(text) {
    let iv = crypto.randomBytes(IV_LENGTH);
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
    let textParts = text.split(':');
    let iv = Buffer.from(textParts.shift(), 'hex');
    let encryptedText = Buffer.from(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

module.exports.register = async (req, res, next) => {
    try {
        const { email, username, password, grossIncome, ssn, address, phoneNumber } = req.body;
        const validIdImage = req.file;

        const encryptedSSN = encrypt(ssn);
        const encryptedGrossIncome = encrypt(grossIncome.toString());
        const encryptedAddress = encrypt(address);
        const encryptedPhoneNumber = encrypt(phoneNumber);
        const encryptedemail = encrypt(email);

        let encryptedValidIdUrl = '';
        let encryptedValidIdFilename = '';
        if (validIdImage) {
            encryptedValidIdUrl = encrypt(validIdImage.path);
            encryptedValidIdFilename = encrypt(validIdImage.filename);
        }

        const user = new User({
            username,
            email: encryptedemail,
            grossIncome: encryptedGrossIncome,
            ssn: encryptedSSN,
            address: encryptedAddress,
            phoneNumber: encryptedPhoneNumber,
            validId: {
                url: encryptedValidIdUrl,
                filename: encryptedValidIdFilename
            }
        });

        const registeredUser = await User.register(user, password);

        if (registeredUser.username === "admin") {
            registeredUser.isAdmin = true;
            await registeredUser.save();
            req.login(registeredUser, err => {
                if (err) return next(err);
                req.flash('success', 'Welcome Admin!');
                res.redirect('/accountViews/adminUsers');
            });
        } else {

            const starterAccount = new Account({
                holder: registeredUser._id,
                accountType: "Checkings",
                totalInCents: 0,
                accountId: uuidv4()
            });
            await starterAccount.save();


            registeredUser.accountIds.push(starterAccount._id);
            registeredUser.numOfAccounts += 1;
            await registeredUser.save();

            req.login(registeredUser, err => {
                if (err) return next(err);
                req.flash('success', 'Welcome to BankApp!');
                res.redirect('/accountViews/myAccounts');
            });
        }
    } catch (error) {
        console.error(error);
        req.flash('error', error.message);
        res.redirect('/register');
    }
};





module.exports.renderLogin = (req, res) => {
    try {
        res.render('users/login');
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while rendering the login');
        res.redirect('/');
    }
}


module.exports.renderAdminView = async (req, res) => {
    try {
        const accounts = await Account.find({})
            .populate({
                path: 'holder',
                model: 'User'
            });

        res.render('accountViews/adminView', { accounts });
    } catch (error) {
        console.error(error);
        res.redirect('/');
    }
}


module.exports.renderAdminRequests = async (req, res) => {
    try {
        const requests = await UserRequest.find({})
            .populate({
                path: 'accountFrom.id',
                model: 'Account',
                populate: {
                    path: 'holder',
                    model: 'User'
                }
            });
        res.render('accountViews/adminRequests', { requests });
    } catch (error) {
        console.error(error);
        res.redirect('/');
    }
}



module.exports.renderAdminUsers = async (req, res) => {
    try {
        const users = await User.find({});

        res.render('accountViews/adminUsers', { users });
    } catch (error) {
        console.error(error);
        res.redirect('/');
    }
}






module.exports.renderUserDetails = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId)
            .populate('accountIds');

        if (!user) {
            console.error('User not found');
            return res.redirect('/accountViews/adminUsers');
        }


        user.ssn = decrypt(user.ssn);
        user.grossIncome = decrypt(user.grossIncome);
        user.address = decrypt(user.address);
        user.email = decrypt(user.email);
        user.phoneNumber = decrypt(user.phoneNumber);
        user.validId.url = decrypt(user.validId.url);
        user.validId.filename = decrypt(user.validId.filename);


        res.render('accountViews/userDetails', { user: user.toObject() });
    } catch (error) {
        console.error(error);
        res.redirect('/');
    }
};






module.exports.renderRequestDetails = async (req, res) => {
    try {

        const requestId = req.params.requestId;
        const request = await UserRequest.findById(requestId)
            .populate({
                path: 'accountFrom.id',
                model: 'Account',
                populate: {
                    path: 'holder',
                    model: 'User'
                }
            });
        if (!request) {
            console.error('Request not found');
            return res.redirect('/');
        }

        res.render('accountViews/requestDetails', { request });
    } catch (error) {
        console.error(error);
        res.redirect('/');
    }
}






module.exports.renderAdminMessages = async (req, res) => {
    try {
        const messages = await Message.find({});
        res.render('accountViews/adminMessages', { messages });
    } catch (error) {
        console.error(error);
        res.redirect('/');
    }
}



module.exports.adminMessageRead = async (req, res) => {
    try {
        const { messageId } = req.params;
        await Message.findByIdAndUpdate(messageId, { isRead: true });

        res.redirect('/accountViews/adminMessages');
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while updating the message status.');
        res.redirect('/accountViews/adminMessages');
    }
}




module.exports.login = async (req, res) => {
    try {
        req.flash('success', 'welcome back!');
        if (!req.user) {
            res.redirect('/login');
            return;
        }

        const userId = req.user._id;
        const user = await User.findOne({ _id: userId });

        if (!user) {
            req.flash('error', 'User not found');
            res.redirect('/login');
            return;
        }

        await checkForUserOverduePayments(userId);


        if (user.username === "admin") {
            const redirectUrl = req.session.returnTo || '/accountViews/adminUsers';
            delete req.session.returnTo;
            res.redirect(redirectUrl);
        } else {
            const redirectUrl = req.session.returnTo || '/accountViews/myAccounts';
            delete req.session.returnTo;
            res.redirect(redirectUrl);
        }
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while attempting to login');
        res.redirect('/login');
    }
}


module.exports.getRequestCount = async (req, res) => {
    try {
        const pendingRequestCount = await UserRequest.countDocuments({ approved: null });
        res.json({ pendingRequestCount }); // Send the count as a JSON response
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while getting the request count' });
    }
};








module.exports.getMessageCount = async (req, res) => {
    try {
        const pendingMessageCount = await Message.countDocuments({ isRead: null });
        res.json({ pendingMessageCount }); // Send the count as a JSON response
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while getting the message count' });
    }
};







module.exports.logout = (req, res) => {
    try {
        req.logout(() => {
            req.flash('success', "Goodbye!");
            res.redirect('/login');
        });
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while attempting to logout');
        res.redirect('/accountViews/myAccounts');
    }
}


module.exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await Account.deleteMany({ holder: id });
        await User.findByIdAndDelete(id);
        req.flash('success', 'Successfully Deleted User!');
        res.redirect("/register")
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while attempting to delete a user');
        res.redirect('/register');
    }
}


async function checkForUserOverduePayments(userId) {
    const today = new Date();
    const userAccounts = await Account.find({ holder: userId, accountType: "Loan" || "Credit" });

    userAccounts.forEach(async (account) => {
        if (account.nextPaymentDueDate < today && !account.paymentOverdue) {
            account.paymentOverdue = true;
            account.isFrozen = true;
            await account.save();
        }
    });
}