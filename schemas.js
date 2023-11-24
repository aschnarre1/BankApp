const BaseJoi = require('joi');
const sanitizeHtml = require('sanitize-html');

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

const Joi = BaseJoi.extend(extension)







module.exports.messageSchema = Joi.object({
    email: Joi.string().email().required(),
    name: Joi.string().required(),
    message: Joi.string().required(),
    isRead: Joi.boolean().allow(null)
});


module.exports.loanReqSchema = Joi.object({
    loanType: Joi.string().allow(null, ''),
    loanTerm: Joi.string().allow(null, ''),
    monthlyMinimumInCents: Joi.number().integer().allow(null).min(0)
});


module.exports.creditCardReqSchema = Joi.object({
    creditCardType: Joi.string().allow(null, ''),
    employmentStatus: Joi.string().allow(null, ''),
    grossIncome: Joi.number().integer().allow(null).min(0)
});


module.exports.requestSchema = Joi.object({
    creditCardInfo: module.exports.creditCardReqSchema.optional(),
    loanInfo: module.exports.loanReqSchema.optional(),
    user: Joi.string().required(),
    amountInCents: Joi.number().integer().allow(null).min(0),
    accountFrom: Joi.object({
        id: Joi.string().required(),
        accountType: Joi.string().required()
    }).required(),
    approved: Joi.boolean().allow(null),
    createdAt: Joi.date().default(() => new Date())
});



module.exports.accountSchema = Joi.object({
    account: Joi.object({
        accountType: Joi.string().trim().required().escapeHTML().valid('Savings', 'Checkings', 'Credit', 'Bank').max(12),
        totalInCents: Joi.number().integer().min(0).max(100000000).default(0),
        depositInCents: Joi.number().integer().min(0).max(100000000).optional(),
        isLocked: Joi.boolean(),
        isFrozen: Joi.boolean(),
        holder: Joi.string().required(),
        loanInfo: module.exports.loanReqSchema.optional(),
        creditLimit: Joi.number().integer().allow(null).min(0),
        interestRate: Joi.number().allow(null).min(0),
        creditCardName: Joi.string().allow(null, ''),
        minimumPaymentInCents: Joi.number().integer().allow(null).min(0),
        nextPaymentDueDate: Joi.date().allow(null),
        accountId: Joi.string().required(),


    }).required().unknown(false)
});


module.exports.userSchema = Joi.object({
    username: Joi.string().required().escapeHTML(),
    email: Joi.string().email().required().escapeHTML(),
    password: Joi.string().required().escapeHTML(),
    grossIncome: Joi.string().required(),
    ssn: Joi.string().pattern(new RegExp('^[0-9]{3}-[0-9]{2}-[0-9]{4}$')).required(),
    address: Joi.string().required().escapeHTML(),
    phoneNumber: Joi.string().required().escapeHTML(),
    validId: Joi.string().required()
}).required();

