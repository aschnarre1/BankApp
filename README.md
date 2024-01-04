## Introduction:
I made a  full-stack banking web application that mimics the functionality that you would have in a banking application modeled after chase.com using HTML, CSS, JavaScript, Express, Node.js, and MongoDB. Its features include credit card and loan requests, money transfers, variable interest rates, and a secure, encrypted database. It can flex to any size screen ranging from small smartphones to large computer screens and still retain the visual style to scale appropriately utilizing Bootstrap’s libraries. 

## Application Structure:
The overall structure of my program are as follows:

**Cloudinary:** This folder housed all of the setups for the software that I used to upload pictures of checks and IDs to the cloud. Here I set up all the routes, API keys, passwords, allowed formats, and where in the cloud it was supposed to store the data.

**Controllers:** In the controllers tab three files matched with the three files in both the models folder and the routes folder, in this case, the account route controllers, requests controllers, and the user controllers all of which housed the functions that acted as the “controllers” for every aspect of the application, sending, receiving, modifying, encrypting, error handling, etc. were all done in these controller files.

**Models:** The model's files (associated with the 3 file “types” I mentioned) set up the schemas for the types of data and how it would be organized for the MongoDB database as well as default values, if they were required or not, etc.

**Node_modules:** Houses all of the node add-ons I used such as the node-cloudinary package as well as their dependencies.

**Public:** I had three things in these files, those being the images I used for the BankApp logo for instance, a form validator to ensure that each form submitted was valid, and then all of the CSS files that I used to modify all of the different pages in the project. 

**Routes:** The three files in here organize the path that all links within the application take to either use a controller or load up a specific page. It also handles asynchronous requests as well as imposes certain middlewares I made to ensure that something is true before the page or controller is loaded. For instance, if someone tried to transfer money it would first validate that they are logged in as well as they are the holder of the account that they are trying to transfer from which helps mitigate postman attacks. 

**Utils:** This file just has a couple of niche functions that I use to handle asynchronous requests as printing message codes a certain way for debugging purposes. 

**Views:** This file and subfolder hold every bit of frontend visual code and are under different files for the sake of organization. 

**Account views:** These are all of the different pages that you can go to in the whole application consisting of EJS files if you are logged in. 

**Layouts:** This folder houses what I call the boilerplate which includes the head of every EJS file to reduce redundancy as well as the navbar, flash partial, footer, and scripts that every EJS page will require.  

**Partials:** The idea behind this was repetitive things that are going to be on every page, which ended up being the code for the footer as well as the EJS for the navbar with all of its basic logic to hide whatever tab you are currently on.

**Users:** This folder consists similarly to the account views folder but only houses the pages that can be displayed when someone is not logged in such as contact us, log in, register, etc.

**Error page:** This page simply prints the error message to the screen whenever one is triggered in a certain format that way I could debug it more easily.

**Home page:** This is the main home page, and is here because it would only require a “/” route to get here without anything coming after it making routing easy.

**ENV file:** This houses all of the hidden passwords and secrets that are not made available to the public in production. 

**Gitignore:** This specifies which files are ignored by git when tracking changes to the databases. 

**App.js:** This is what is essentially the controller for the entire project as it requires all other npm packages and sets them up for use as well as all models, controllers, and routes. It also sets up all of the encryption and flash errors and even makes the initial “bank” account. It acts as the central hub for the project and everything traces back to here.

**Middleware.js:** HAs the functions that I use, that I call middleware that are called whenever there is a route call and they validate that something is true prior to the route being followed. For example, one is logged in which validates that a user is logged in before doing an action to prevent postman attacks even if they knew what route to take and the IDs of someone else. 

**Package-lock.json:** Houses npm packages as well as their dependencies in a JSON format to be used

**Package.json:** Has the versions of all NPM packages that are used in this project

**Schemas.js:** This file is where I set up my JOI validation as well as a custom extension to not only sanitize HTML to prevent SQL injections but also set up certain validations to ensure that all data entered matches a certain constraint and format such as passwords requiring an uppercase letter, lowercase letter, number and special character to increase security for every user.



