const { number } = require('joi');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    grossIncome: {
        type: String,
        required: true
    },
    numOfAccounts: {
        type: Number,
        default: 0
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    accountIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account'
    }],
    ssn: {
        type: String,
        required: true,
        unique: true
    },
    address: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    validId: {
        url: {
            type: String,
            required: true
        },
        filename: {
            type: String,
            required: true
        }
    }

});





UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);
