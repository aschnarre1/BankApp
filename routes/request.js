const express = require('express');
const router = express.Router({ mergeParams: true });
const { isLoggedIn, isRequestOwner, isAdmin } = require('../middleware');
const User = require("../models/user")
const Account = require("../models/accounts")
const Request = require("../models/userRequest")
const requests = require("../controllers/request")
const ExpressError = require('../utils/ExpressError');
const catchAsync = require('../utils/catchAsync');

const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({ storage });



router.post('/', isLoggedIn, upload.fields([{ name: 'frontImage' }, { name: 'backImage' }]), catchAsync(requests.createRequest));


router.post('/creditCardRequests', isLoggedIn, catchAsync(requests.creditCardRequests));
router.post('/loanRequests', isLoggedIn, catchAsync(requests.loanRequests));

router.post('/:requestId/cardApproved', isLoggedIn, isAdmin, catchAsync(requests.cardApproved));

router.post('/:requestId/loanApproved', isLoggedIn, isAdmin, catchAsync(requests.loanApproved));

router.post('/:requestId/approve', isLoggedIn, isAdmin, catchAsync(requests.approveRequest));

router.post('/:requestId/deny', isLoggedIn, isAdmin, catchAsync(requests.denyRequest));



router.delete('/:requestId', isLoggedIn, isRequestOwner, catchAsync(requests.deleteRequest));




module.exports = router;