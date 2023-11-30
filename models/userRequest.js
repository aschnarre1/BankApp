const mongoose = require("mongoose");
const Schema = mongoose.Schema;



const ImageSchema = new Schema({
    url: String,
    filename: String
});

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



ImageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/w_200');
});

const opts = { toJSON: { virtuals: true } };


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




const UserRequest = mongoose.model("UserRequest", requestSchema);

module.exports = UserRequest;