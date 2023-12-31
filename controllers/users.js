// Import necessary modules and models
const { v4: uuidv4 } = require('uuid');
const User = require('../models/user');
const { Account } = require('../models/accounts');
const UserRequest = require('../models/userRequest');
const { Message } = require('../models/accounts');
const crypto = require('crypto');
require('dotenv').config();

// Controller to render the registration page
module.exports.renderRegister = (req, res) => {
    try {
        res.render('users/register');
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while rendering the register page');
        res.redirect('/');
    }
}

// Controller to render the credit card information page
module.exports.renderCreditInfo = async (req, res) => {
    try {
        res.render("users/creditCardInfo");
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while rendering the Credit Info page');
        res.redirect('/');
    }
}

// Controller to render the loan information page
module.exports.renderLoanInfo = async (req, res) => {
    try {
        res.render("users/loanInfo");
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while rendering the Loan Info page');
        res.redirect('/');
    }
}

// Controller to render the About Us page
module.exports.renderAboutUs = async (req, res) => {
    try {
        res.render("users/aboutUs");
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while rendering the About Us page');
        res.redirect('/');
    }
}

// Controller to render the Contact Us page
module.exports.renderContactUs = async (req, res) => {
    try {
        res.render("users/contactUs");
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while rendering the Contact Us page');
        res.redirect('/');
    }
}

// Encryption key and initialization vector length for crypto
const ENCRYPTION_KEY = process.env.ENCRYPTION_SECRET;
const IV_LENGTH = 16;

// Function to encrypt text using AES-256-CBC
function encrypt(text) {
    let iv = crypto.randomBytes(IV_LENGTH);
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// Function to decrypt text using AES-256-CBC
function decrypt(text) {
    let textParts = text.split(':');
    let iv = Buffer.from(textParts.shift(), 'hex');
    let encryptedText = Buffer.from(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

//Controller to handle user registration
module.exports.register = async (req, res, next) => {
    try {
        const { firstName, lastName, email, username, password, grossIncome, ssn, address, phoneNumber } = req.body;
        const uniqueId = await generateUniqueId();
        const passwordRegex = /(?=.*[A-Z])(?=.*[!@#$&*])/;
        if (!passwordRegex.test(password)) {
            req.flash('error', 'Password must contain at least one uppercase letter and one special character.');
            return res.redirect('/register');
        }
        const formattedUsername = username.trim();
        const existingUsername = await User.findOne({ username: formattedUsername });
        if (existingUsername) {
            req.flash('error', 'Username already exists.');
            return res.redirect('/register');
        }
        const tempSSN = ssn.trim();
        const encryptedSSN = encrypt(tempSSN);
        const existingSSN = await User.findOne({ ssn: encryptedSSN });
        if (existingSSN) {
            req.flash('error', 'An account with this information already exists. Please contact support for assistance.');
            return res.redirect('/register');
        }


        const validIdImage = req.file;

        const encryptedGrossIncome = encrypt(grossIncome.toString().trim());

        const encryptedAddress = {
            line1: encrypt(capitalizeFirstLetter(address.line1).trim()),
            line2: address.line2 ? encrypt(capitalizeFirstLetter(address.line2).trim()) : '',
            city: encrypt(capitalizeFirstLetter(address.city).trim()),
            state: encrypt(capitalizeFirstLetter(address.state).trim()),
            zip: encrypt(address.zip).trim(),
            country: encrypt(capitalizeFirstLetter(address.country).trim())
        };


        const tempNumber = phoneNumber.trim();
        const encryptedPhoneNumber = encrypt(tempNumber);

        const tempEmail = email.toLowerCase().trim();
        const encryptedemail = encrypt(tempEmail);

        const tempFirstName = capitalizeFirstLetter(firstName).trim();
        const encryptedFirstName = encrypt(tempFirstName);

        const tempLastName = capitalizeFirstLetter(lastName).trim();
        const encryptedLastName = encrypt(tempLastName);

        let encryptedValidIdUrl = '';
        let encryptedValidIdFilename = '';
        if (validIdImage) {
            encryptedValidIdUrl = encrypt(validIdImage.path);
            encryptedValidIdFilename = encrypt(validIdImage.filename);
        }

        const user = new User({
            username: username.toLowerCase().trim(),
            firstName: encryptedFirstName,
            lastName: encryptedLastName,
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
                res.redirect('/accountViews/adminUsers');
            });
        } else {

            const starterAccount = new Account({
                _id: uniqueId,
                holder: registeredUser._id,
                accountType: "Checkings",
                totalInCents: 0,
            });
            await starterAccount.save();


            registeredUser.accountIds.push(starterAccount._id);
            registeredUser.numOfAccounts += 1;
            await registeredUser.save();

            req.login(registeredUser, err => {
                if (err) return next(err);
                res.redirect('/accountViews/myAccounts');
            });
        }
    } catch (error) {
        console.error(error);
        req.flash('error', error.message);
        res.redirect('/register');
    }
};

//Controller to capitilize the first letter of a string for consistant formatting
function capitalizeFirstLetter(string) {
    return string.toLowerCase().replace(/\b(\w)/g, function (s) {
        return s.toUpperCase();
    });
}

//Controller to render the user login page
module.exports.renderLogin = (req, res) => {
    try {
        res.render('users/login');
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while rendering the login');
        res.redirect('/');
    }
}

//controller to render the admin view page
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

//controller to render the admin request page
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

//Controller to render the admin page to see all users
module.exports.renderAdminUsers = async (req, res) => {
    try {
        const users = await User.find({});

        res.render('accountViews/adminUsers', { users });
    } catch (error) {
        console.error(error);
        res.redirect('/');
    }
}

//Controller to render all user details
module.exports.renderUserDetails = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId)
            .populate('accountIds');

        if (!user) {
            console.error('User not found');
            return res.redirect('/accountViews/adminUsers');
        }

        user.firstName = decrypt(user.firstName);
        user.lastName = decrypt(user.lastName);
        user.ssn = decrypt(user.ssn);
        user.grossIncome = decrypt(user.grossIncome);
        user.email = decrypt(user.email);
        user.phoneNumber = decrypt(user.phoneNumber);
        user.validId.url = decrypt(user.validId.url);
        user.validId.filename = decrypt(user.validId.filename);

        user.address.line1 = decrypt(user.address.line1);
        user.address.line2 = user.address.line2 ? decrypt(user.address.line2) : '';
        user.address.city = decrypt(user.address.city);
        user.address.state = decrypt(user.address.state);
        user.address.zip = decrypt(user.address.zip);
        user.address.country = decrypt(user.address.country);


        res.render('accountViews/userDetails', { user: user.toObject() });
    } catch (error) {
        console.error(error);
        res.redirect('/');
    }
};

//Controller to render the request details page
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

//Controller to render all user messages for the admin
module.exports.renderAdminMessages = async (req, res) => {
    try {
        const messages = await Message.find({});
        res.render('accountViews/adminMessages', { messages });
    } catch (error) {
        console.error(error);
        res.redirect('/');
    }
}

//Controller to mark a message as read for the admin
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

//Controller to allow a user to login
module.exports.login = async (req, res) => {
    try {
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

// Controller to get the count of pending request and send as a JSON response
module.exports.getRequestCount = async (req, res) => {
    try {
        const pendingRequestCount = await UserRequest.countDocuments({ approved: null });
        res.json({ pendingRequestCount }); // Send the count as a JSON response
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while getting the request count' });
    }
};


// Controller to get the count of pending messages and send as a JSON response
module.exports.getMessageCount = async (req, res) => {
    try {
        const pendingMessageCount = await Message.countDocuments({ isRead: null });
        res.json({ pendingMessageCount }); // Send the count as a JSON response
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while getting the message count' });
    }
};


//Controller for a user to logout of their account
module.exports.logout = (req, res) => {
    try {
        req.logout(() => {
            res.redirect('/login');
        });
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while attempting to logout');
        res.redirect('/accountViews/myAccounts');
    }
}

//Controller to delete a user and all of their data
module.exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await Account.deleteMany({ holder: id });
        await User.findByIdAndDelete(id);
        res.redirect("/register")
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while attempting to delete a user');
        res.redirect('/register');
    }
}

//function that checks to see if a loan has not payed thier monthly payment
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
