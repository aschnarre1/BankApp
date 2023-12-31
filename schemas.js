// Import the base Joi library for validation and the sanitize-html library for sanitization
const BaseJoi = require('joi');
const sanitizeHtml = require('sanitize-html');

// Define a custom extension for the Joi library to sanitize HTML from strings
const extension = (joi) => ({
    type: 'string',
    base: joi.string(),
    messages: {
        'string.escapeHTML': '{{#label}} must not include HTML!'
    },
    rules: {
        escapeHTML: {
            validate(value, helpers) {
                const clean = sanitizeHtml(value, {
                    allowedTags: [],
                    allowedAttributes: {},
                });
                if (clean !== value) return helpers.error('string.escapeHTML', { value })
                return clean;
            }
        }
    }

});

// Extend the Joi library with the custom HTML sanitization rule
const Joi = BaseJoi.extend(extension)


// Define a validation schema for messages
module.exports.messageSchema = Joi.object({
    email: Joi.string().email().required().escapeHTML(),
    name: Joi.string().required().pattern(/^[A-Za-z\s]+$/).min(3).max(45).escapeHTML(),
    message: Joi.string().required().max(500).escapeHTML(),
    isRead: Joi.boolean().allow(null)
});

// Define a validation schema for loan requests
module.exports.loanReqSchema = Joi.object({
    loanType: Joi.string().allow(null, ''),
    loanTerm: Joi.string().allow(null, ''),
    monthlyMinimumInCents: Joi.number().integer().allow(null).min(0)
});

// Define a validation schema for credit card requests
module.exports.creditCardReqSchema = Joi.object({
    creditCardType: Joi.string().allow(null, ''),
    employmentStatus: Joi.string().allow(null, ''),
    grossIncome: Joi.number().integer().allow(null).min(0)
});

// Define a validation schema for general requests that others add onto
module.exports.requestSchema = Joi.object({
    creditCardInfo: module.exports.creditCardReqSchema.optional(),
    loanInfo: module.exports.loanReqSchema.optional(),
    user: Joi.string().required(),
    amountInCents: Joi.number().integer().allow(null).min(1),
    accountFrom: Joi.object({
        id: Joi.string().required(),
        accountType: Joi.string().required()
    }).required(),
    approved: Joi.boolean().allow(null),
    createdAt: Joi.date().default(() => new Date()),
    frontImage: Joi.object({
        url: Joi.string().required(),
        filename: Joi.string().required()
    }).optional(),
    backImage: Joi.object({
        url: Joi.string().required(),
        filename: Joi.string().required()
    }).optional()
});

// Define a validation schema for accounts
module.exports.accountSchema = Joi.object({
    account: Joi.object({
        accountType: Joi.string().trim().required().escapeHTML().valid('Savings', 'Checkings', 'Credit', 'Bank').max(12),
        totalInCents: Joi.number().integer().min(0).max(100000000).default(0),
        depositInCents: Joi.number().integer().min(0).max(100000000).optional(),
        isLocked: Joi.boolean(),
        isFrozen: Joi.boolean(),
        holder: Joi.string().optional(),              //required?
        loanInfo: module.exports.loanReqSchema.optional(),
        creditLimit: Joi.number().integer().allow(null).min(0),
        interestRate: Joi.number().allow(null).min(0),
        creditCardName: Joi.string().allow(null, ''),
        minimumPaymentInCents: Joi.number().integer().allow(null).min(0),
        nextPaymentDueDate: Joi.date().allow(null),
        accountId: Joi.string().optional(),        //required?


    }).required().unknown(false)
});

// Define a validation schema for users
module.exports.userSchema = Joi.object({
    firstName: Joi.string().pattern(/^[A-Za-z]+$/).required().min(3).max(25).escapeHTML(),
    lastName: Joi.string().pattern(/^[A-Za-z]+$/).required().min(3).max(25).escapeHTML(),
    username: Joi.string().pattern(/^[A-Za-z][A-Za-z0-9_]{7,14}$/).required().escapeHTML(),
    email: Joi.string().email().required().escapeHTML(),
    password: Joi.string().pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,30})')).required().escapeHTML(),
    grossIncome: Joi.string().required(),
    ssn: Joi.string().pattern(new RegExp('^[0-9]{3}-[0-9]{2}-[0-9]{4}$')).required(),
    address: Joi.object({
        line1: Joi.string().required().escapeHTML(),
        line2: Joi.string().allow('', null).escapeHTML(),
        city: Joi.string().required().escapeHTML(),
        state: Joi.string().required().escapeHTML(),
        zip: Joi.string().pattern(/^[0-9]{5}$/).required().escapeHTML(),
        country: Joi.string().required().escapeHTML()
    }).required(),
    phoneNumber: Joi.string().pattern(/^[0-9]{3}-[0-9]{3}-[0-9]{4}$/).required().escapeHTML(),
    validId: Joi.string().required()
}).required();



