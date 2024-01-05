//Import the necessary modules
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define the schema for the images being uploaded to cloudinary
const ImageSchema = new Schema({
    url: String,
    filename: String
});

// Define the schema for the creditCardRequests model
const creditCardReq = new Schema({
    creditCardType: {
        type: String,
        default: null
    },
    employmentStatus: {
        type: String,
        default: null
    },
    grossIncome: {
        type: Number,
        default: null
    }
});

// Define the schema for the loanRequests model
const loanRequest = new Schema({
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

})


// Modifies the image URL to fetch a thumbnail version to size it correctly
ImageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/w_200');
});

// Define options for the schema, to include virtuals when converting documents to JSON
const opts = { toJSON: { virtuals: true } };



// Define the schema for the request model
const requestSchema = new Schema({
    creditCardInfo: creditCardReq,
    loanInfo: loanRequest,
    images: {
        frontImage: ImageSchema,
        backImage: ImageSchema
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amountInCents: {
        type: Number,
        default: null
    },
    accountFrom: {
        id: {
            type: String,
            required: true
        },
        accountType: {
            type: String,
            required: true
        }
    },
    approved: {
        type: Boolean,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Apply the passportLocalMongoose plugin to UserSchema

const UserRequest = mongoose.model("UserRequest", requestSchema);

//Export the request model
module.exports = UserRequest;