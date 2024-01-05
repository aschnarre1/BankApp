//Import necessary modules
const { number } = require('joi');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

// Define the schema for the User model
const UserSchema = new Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
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
        line1: { type: String, required: true },
        line2: { type: String },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zip: { type: String, required: true },
        country: { type: String, required: true }
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




// Apply the passportLocalMongoose plugin to UserSchema
UserSchema.plugin(passportLocalMongoose);

//Export the user model
module.exports = mongoose.model('User', UserSchema);
