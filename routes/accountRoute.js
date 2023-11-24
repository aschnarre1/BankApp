const express = require('express');
const router = express.Router();
const accounts = require('../controllers/accountRoute');
const catchAsync = require('../utils/catchAsync');
const { accountSchema } = require('../schemas.js');
const { isLoggedIn, isHolder, validateAccount, isAdmin } = require('../middleware');

const ExpressError = require('../utils/ExpressError');
const Account = require('../models/accounts');




router.route("/")
    .get(catchAsync(accounts.index))
    .post(isLoggedIn, validateAccount, catchAsync(accounts.createAccount))

router.get('/newAccount', isLoggedIn, accounts.renderNewForm)
router.get('/myAccounts', isLoggedIn, catchAsync(accounts.myAccounts));
router.get('/transfer', isLoggedIn, catchAsync(accounts.transfer));
router.get('/requestStatus', isLoggedIn, catchAsync(accounts.renderUserRequests));


router.post('/send-message', accounts.sendMessage);


router.post('/processTransfer', isLoggedIn, accounts.processTransfer);
router.post('/processTransferWithin', isLoggedIn, accounts.processTransferWithin);
router.post('/payOffBalance', isLoggedIn, accounts.payOffBalance);

router.route('/:id')
    .get(isLoggedIn, catchAsync(accounts.showAccount))
    .delete(isLoggedIn, isHolder, catchAsync(accounts.deleteAccount))

router.get('/:id/editAccount', isLoggedIn, isHolder, catchAsync(accounts.renderEditForm))

router.post('/:id/Freeze', isLoggedIn, isAdmin, catchAsync(accounts.freezeAccount));
router.post('/:id/Unfreeze', isLoggedIn, isAdmin, catchAsync(accounts.unfreezeAccount));

router.post('/:id/Lock', isLoggedIn, catchAsync(accounts.lockAccount));
router.post('/:id/Unlock', isLoggedIn, catchAsync(accounts.unlockAccount));

router.post('/accountViews/:id/requestDeposit', isLoggedIn, catchAsync(accounts.updateAccountWithDeposit));



module.exports = router;



