//Import cloudinary modules used for storing images via multer
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

//configs the cloudinary module with the account details that hosts the images 
//These details are retrieved from the ENV file for security
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
});

//Creates a new instance of cloudinarystorage and configures what is allowed
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'BankApp',
        allowedFormats: ['jpeg', 'png', 'jpg']
    }
});

//Exports the instance and object to use them in the application
module.exports = {
    cloudinary,
    storage
}