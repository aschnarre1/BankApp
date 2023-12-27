if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const { accountSchema } = require('./schemas.js');
const catchAsync = require('./utils/catchAsync');
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');
const { v4: uuidv4 } = require('uuid');

const passport = require('passport');
const LocalStrategy = require('passport-local');
const helmet = require('helmet');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const mongoSanitize = require('express-mongo-sanitize');




const { Account } = require('./models/accounts');
const User = require('./models/user');
const userController = require('./controllers/users');
const userRoutes = require('./routes/users');
const accountRoutes = require('./routes/accountRoute');
const requestRoutes = require('./routes/request');

const MongoStore = require('connect-mongo');



const dbUrl = process.env.DB_URL || "mongodb://127.0.0.1/BankApp";
mongoose.connect(dbUrl, {});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", async () => {
    console.log("Database connected");
    await initializeBankAccount();
});


const app = express();

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))


app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')))
app.use(mongoSanitize({
    replaceWith: '_'
}))



const secret = process.env.SECRET || 'squirrel!';

const store = MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 60 * 60,
    crypto: {
        secret: secret
    }
});

store.on("error", function (e) {
    console.log("SESSION STORE ERROR", e)
})



const sessionConfig = {
    store,
    name: "__uulp",
    secret,
    resave: false,
    saveUninitialized: true,
    rolling: true,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: Date.now() + 1000 * 60 * 15,
        maxAge: 1000 * 60 * 15
    }
}
app.use(session(sessionConfig))
app.use(flash());
app.use(helmet({ contentSecurityPolicy: false }));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})


async function initializeBankAccount() {
    try {
        const bankAccountExists = await Account.findOne({ accountType: 'Bank' });
        if (!bankAccountExists) {
            let adminUser = await User.findOne({ username: 'admin' });
            if (!adminUser) {
                const adminDetails = {
                    firstName: 'Admin',
                    lastName: 'User',
                    email: 'admin@admin.com',
                    username: 'admin',
                    password: 'admin',
                    grossIncome: '0',
                    ssn: '000-00-0000',
                    address: {
                        line1: '123 Finance Street',
                        line2: '',
                        city: 'Money City',
                        state: 'MC',
                        zip: '12345',
                        country: 'USA'
                    },
                    phoneNumber: '000-000-0000',
                    validId: {
                        url: 'path/to/dummy/image.jpg',
                        filename: 'dummy_image.jpg'
                    }
                };

                adminUser = new User({
                    email: adminDetails.email,
                    username: adminDetails.username,
                    firstName: adminDetails.firstName,
                    lastName: adminDetails.lastName,
                    grossIncome: adminDetails.grossIncome,
                    ssn: adminDetails.ssn,
                    address: adminDetails.address,
                    phoneNumber: adminDetails.phoneNumber,
                    validId: adminDetails.validId,
                    isAdmin: true,
                });

                const registeredAdmin = await User.register(adminUser, adminDetails.password);
                adminUser.isAdmin = true;
                await adminUser.save();
            }

            const bankAccount = new Account({
                accountType: 'Bank',
                totalInCents: 1000000000,
                accountId: 'BANK-001',
                holder: adminUser ? adminUser._id : registeredAdmin._id,
                transactions: []
            });
            await bankAccount.save();
            console.log('Bank account initialized');
        }
    } catch (error) {
        console.error('Failed to initialize bank account:', error);
    }
}



app.use('/', userRoutes);
app.use('/accountViews', accountRoutes);
app.use('/accountViews/:accountId/requests', requestRoutes);



app.get("/", (req, res) => {
    res.render("home")
})



app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
})

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!'
    res.status(statusCode).render('error', { err })
})

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Serving on port ${port}`)
})