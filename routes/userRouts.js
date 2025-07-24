// Import required modules
const express = require("express");
const session = require("express-session");
const userRout = express.Router(); // Create a new router instance for user-related routes

// Set up session middleware to handle login sessions
userRout.use(session({
  secret: "yourSecretKey",         // required
  resave: false,                   // don't save session if unmodified
  saveUninitialized: false         // don't create session until something stored
}));

// Import custom auth middleware for login/logout checks
const auth = require("../middleware/auth");

// Body parser for handling form data
const bodyParser = require("body-parser");
userRout.use(bodyParser.json());
userRout.use(bodyParser.urlencoded({ extended: true }));

// Set up Multer for handling image uploads
const multer = require("multer");
const path = require("path");

// Configure Multer storage location and filename
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public/userImages")); // Folder where images are saved
  },
  filename: (req, file, cb) => {
    const name = Date.now() + "-" + file.originalname; // Unique filename
    cb(null, name);
  }
});

const upload = multer({ storage: imageStorage }); // Use the storage config

// Import user controller that handles logic
const userController = require("../controllers/userController");



// ------------------ 🔐 AUTH & USER ROUTES ------------------ //

// Load registration page (only if user is not logged in)
userRout.get("/register", auth.isLogout, userController.loadRegister);

// Handle registration form submission with image upload
userRout.post("/register", upload.single("image"), userController.insertUser);

// Verify user email (link clicked from email)
userRout.get("/verify", userController.verifyMail);

//Verification path through login page(verification through login "Verification") feature
userRout.get("/verification", userController.verificationLoad);

//post for verify email through login
userRout.post("/verification", userController.sendVerification);

// Load login page (for GET "/")
userRout.get("/", auth.isLogout, userController.loginLoad);

// Also support explicit "/login" path
userRout.get("/login", auth.isLogout, userController.loginLoad);

// Handle login form submission
userRout.post("/login", userController.verifyLogin);

// Load home page (only accessible if logged in)
userRout.get("/home", auth.isLogin, userController.loadHome);

// Load login page if tapped on logout
userRout.get("/logout", userController.userLogout)










// ------------------ 🔐 FORGOT PASSWORD FLOW ------------------ //

// Load forget password page
userRout.get("/forget", auth.isLogout, userController.forgetLoad);

// Handle forget password form submission (sends reset link)
userRout.post("/forget", userController.forgetLink);

// Load reset password page via token
userRout.get("/forget-password", auth.isLogout, userController.forgetPasswordLoad);

// Handle new password submission
userRout.post("/forget-password", userController.resetPassword);








// ------------------ Edit profile feature ------------------ //

//get edit page when clint clicks to edit button

userRout.get("/edit-profile", auth.isLogin, userController.editLoad);

//updating edited values in DB

userRout.post("/edit-profile",upload.single("image"),userController.updateProfile);



// Export the router to be used in server.js
module.exports = userRout;
