const { accountSchema } = require('./schemas.js');
const { userSchema } = require('./schemas.js');
const ExpressError = require('./utils/ExpressError');
const { Account } = require('./models/accounts');
const User = require("./models/user.js")




module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl;
        req.flash('error', 'You must be signed in first!');
        return res.redirect('/login');
    }
    next();
}


module.exports.validateAccount = (req, res, next) => {
    const { error } = accountSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}


module.exports.validateUser = (req, res, next) => {
    if (req.file) {
        req.body.validId = req.file.path;
    }
    const { error } = userSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}



module.exports.isHolder = async (req, res, next) => {
    const { id } = req.params;
    const account = await Account.findById(id);

    if (!account.holder.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/accountViews/${id}`);
    }
    next();
}


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

    next(); // User is the holder, proceed with the request
}



module.exports.isRequestOwner = async (req, res, next) => {
    const { id } = req.params;
    const request = await Request.findById(id);
    if (!request.user.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that');
        return res.redirect(`/requests/${id}`);
    }
    next();
}


module.exports.isAdmin = async (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        return next();
    }
    req.flash('error', 'Permission denied');
    res.redirect('/');
}
