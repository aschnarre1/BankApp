// Import Mongoose and create a Schema object
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define a schema for transactions, including date, amount, and type
const TransactionSchema = new Schema({
    date: {
        type: Date,
        default: Date.now
    },
    amountInCents: {
        type: Number,
        required: true
    },
    type: String,
});

// Define a schema for messages, including email, name, message content, and read status
const MessageSchema = new Schema({
    email: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
        default: null
    },
    message: {
        type: String,
        required: true,
        default: null
    },
    isRead: {
        type: Boolean,
        default: null
    }

});

// Define a schema for loan details, including type, term, and monthly minimum payment
const loanSchema = new Schema({
    loanType: {
        type: String,
        default: null
    },
    loanTerm: {
        type: String,
        default: null
    },
    monthlyMinimumInCents: {
        type: Number,
        default: null
    }

});

// Define a comprehensive schema for accounts, including various account details and references
const AccountSchema = new Schema({
    accountType: String,
    loanInfo: loanSchema,
    creditLimit: {
        type: Number,
        default: null
    },
    creditCardName: {
        type: String,
        default: null
    },
    interestRate: {
        type: Number,
        default: null
    },
    totalInCents: {
        type: Number,
        default: null
    },
    minimumPaymentInCents: {
        type: Number,
        default: null
    },
    nextPaymentDueDate: {
        type: Date,
        default: null
    },
    paymentOverdue: {
        type: Boolean,
        default: false
    },
    isLocked: {
        type: Boolean,
        default: false
    },
    isFrozen: {
        type: Boolean,
        default: false
    },
    holder: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    accountId: String,
    transactions: [TransactionSchema]

});

// Export the schemas as models to be used in other parts of the application
module.exports.Message = mongoose.model('Message', MessageSchema);
module.exports.Account = mongoose.model("Account", AccountSchema);
