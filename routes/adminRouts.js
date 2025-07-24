// Import required modules
const express = require("express");
const adminRout = express.Router(); // Create a new router instance for admin

const session = require("express-session"); // Session middleware for managing sessions
// Configure and use express-session
adminRout.use(session({
  secret: "yourSecretKey",         // required
  resave: false,                   // don't save session if unmodified
  saveUninitialized: false         // don't create session until something stored
}));

const bodyParser = require("body-parser"); // Middleware for parsing incoming request bodies

// Parse JSON and form-urlencoded data
adminRout.use(bodyParser.json()); // Parse JSON data
adminRout.use(bodyParser.urlencoded({ extended: true })); // Parse form data

const multer = require("multer"); // Middleware for handling file uploads
const path = require("path"); // Node.js module for handling file paths

// Configure Multer storage for uploaded images
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public/userImages")); // Destination folder to save images
  },
  filename: (req, file, cb) => {
    const name = Date.now() + "-" + file.originalname; // Unique filename using timestamp
    cb(null, name); // Pass filename to callback
  }
});

// Initialize multer with defined storage
const upload = multer({ storage: imageStorage }); // Set storage configuration

// Make the "public" folder accessible for static assets (like images)
adminRout.use(express.static("public"));

// Import controller and middleware
const adminController = require("../controllers/adminController"); // Admin logic
const auth = require("../middleware/adminAuth"); // Admin authentication middleware

// Routes

// GET /admin => Render login page if not logged in
adminRout.get("/", auth.isLogout, adminController.loadLogin);

// POST /admin => Handle login form submission
adminRout.post("/", adminController.adminVerify);

// GET /admin/home => Load admin dashboard (protected route)
adminRout.get("/home", auth.isLogin, adminController.loadDashboard);

// GET /admin/logout => Log out admin (destroy session)
adminRout.get("/logout", auth.isLogin, adminController.logoutAdmin);

// GET /admin/forget => Render forget password page
adminRout.get("/forget", auth.isLogout, adminController.forgetAdminPass);

// POST /admin/forget => Process forget password form and send reset email
adminRout.post("/forget", adminController.forgetPassVerify);

// GET /admin/reset-password => Load reset password page using token (if not logged in)
adminRout.get("/reset-password", auth.isLogout, adminController.forgetPassLoad);

// POST /admin/reset-password => Handle reset password form
adminRout.post("/reset-password", auth.isLogout, adminController.resetPassword);

// GET /admin/dashboard => Show user management dashboard
adminRout.get("/dashboard", auth.isLogin, adminController.adminDashboard);

// GET /admin/new-user => Show form to add a new user
adminRout.get("/new-user", auth.isLogin, adminController.newUser);

// POST /admin/new-user => Handle new user creation (with image upload)
adminRout.post("/new-user", upload.single("image"), adminController.addNewUser);

// GET /admin/edit-user => Load edit user form
adminRout.get("/edit-user", auth.isLogin, adminController.editUserLoad);

// POST /admin/edit-user => Submit edited user details
adminRout.post("/edit-user", adminController.updateUserValue);

// GET /admin/delete-user => Delete a user (by query param id)
adminRout.get("/delete-user", adminController.deleteUserData);

// Fallback: redirect any unmatched route to /admin
adminRout.get(/.*/, (req, res) => {
  res.redirect('/admin'); // Redirect all unknown admin paths to login
});

// Export admin routes to be used in app.js
module.exports = adminRout;
