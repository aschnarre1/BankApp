const { accountSchema, userSchema, messageSchema, loanReqSchema, creditCardReqSchema, requestSchema } = require('./schemas.js');
const ExpressError = require('./utils/ExpressError');
const { Account } = require('./models/accounts');
const User = require("./models/user.js")



//Middleware to check if the user is logged in 
module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl;
        req.flash('error', 'You must be signed in first!');
        return res.redirect('/login');
    }
    next();
}

//Middleware to validate account data against a Joi schema
module.exports.validateAccount = (req, res, next) => {
    const { error } = accountSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

// Middleware to validate user data, including handling file uploads for valid IDs
module.exports.validateUser = (req, res, next) => {
    if (req.file) {
        req.body.validId = req.file.path;
    }
    const { error } = userSchema.validate(req.body);
    if (error) {
        error.details.forEach(err => {
            switch (err.context.key) {
                case 'username':
                    req.flash('error', 'Invalid username, username must be 8-15 characters and not be a repeating letter');
                    break;
                default:
                    req.flash('error', 'Invalid input: ');
            }
        })
        return res.redirect('/register');
    } else {
        next();
    }
}

//Middleware to checked if the user that is logged in holds a certain account
module.exports.isHolder = async (req, res, next) => {
    const { id } = req.params;
    const account = await Account.findById(id);

    if (!account.holder.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/accountViews/${id}`);
    }
    next();
}


//Middleware to check if the user that is logged in is the is the same user that is requesting to do an action
module.exports.isUser = async (req, res, next) => {
    const { id } = req.params;
    if (!req.isAuthenticated()) {
        req.flash('error', 'You must be signed in to perform this action!');
        return res.redirect('/login');
    }
    const user = await User.findById(id);

    if (!user._id.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect('/accountViews/myAccounts');
    }

    next();
}

//Middleware to check if the user that is logged in making a request
module.exports.isRequestOwner = async (req, res, next) => {
    const { id } = req.params;
    const request = await Request.findById(id);
    if (!request.user.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that');
        return res.redirect(`/requests/${id}`);
    }
    next();
}

//Middlware that checks to see if the user that is logged in is the admin 
module.exports.isAdmin = async (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        return next();
    }
    req.flash('error', 'Permission denied');
    res.redirect('/');
}

//Middleware that ensures that the message follows the Joi constraints
module.exports.validateMessage = (req, res, next) => {
    const { error } = messageSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        req.flash('error', "Must have a valid name and not exceed a 500 letter message");
        return res.redirect('/contactUs');
    }
    next();
};