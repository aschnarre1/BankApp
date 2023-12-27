const express = require('express');
const router = express.Router();
const passport = require('passport');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/user');
const users = require('../controllers/users');
const { isLoggedIn, isAdmin, validateUser, isUser } = require('../middleware');


const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({ storage });

router.route('/register')
    .get(users.renderRegister)
    .post(upload.single('validId'), validateUser, catchAsync(users.register));

router.route('/login')
    .get(users.renderLogin)
    .post(passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), users.login)

router.get('/creditCardInfo', users.renderCreditInfo);
router.get('/loanInfo', users.renderLoanInfo);
router.get('/aboutUs', users.renderAboutUs);
router.get('/contactUs', users.renderContactUs);

router.get('/getRequestCount', isLoggedIn, isAdmin, catchAsync(users.getRequestCount))
router.get('/getMessageCount', isLoggedIn, isAdmin, catchAsync(users.getMessageCount))

router.get('/logout', users.logout)

router.delete('/users/:id', isLoggedIn, isUser, users.deleteUser);

router.get('/accountViews/adminView', isLoggedIn, isAdmin, users.renderAdminView);

router.get('/accountViews/adminUsers', isLoggedIn, isAdmin, users.renderAdminUsers);
router.get('/accountViews/userDetails/:userId', isLoggedIn, isAdmin, users.renderUserDetails);


router.get('/accountViews/adminMessages', isLoggedIn, isAdmin, users.renderAdminMessages);
router.post('/accountViews/adminMessageRead/:messageId', isLoggedIn, isAdmin, users.adminMessageRead);


router.get('/accountViews/adminRequests', isLoggedIn, isAdmin, users.renderAdminRequests);
router.get('/accountViews/requestDetails/:requestId', isLoggedIn, isAdmin, users.renderRequestDetails);

module.exports = router; 