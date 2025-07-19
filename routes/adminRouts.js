const express = require("express");
const adminRout = express.Router();

const session = require("express-session");
const config = require("../config/config");
adminRout.use(session({secret:config.sessionSec}))

const bodyParser = require("body-parser");
adminRout.use(bodyParser.json());
adminRout.use(bodyParser.urlencoded({extended:true}));


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

//show image in home page
adminRout.use(express.static("public"));


const adminController = require("../controllers/adminController");

const auth = require("../middleware/adminAuth");

adminRout.get("/",auth.isLogout, adminController.loadLogin);

adminRout.post("/",adminController.adminVerify);

adminRout.get("/home", auth.isLogin, adminController.loadDashboard);

adminRout.get("/logout",auth.isLogin,adminController.logoutAdmin)

adminRout.get("/forget" , auth.isLogout, adminController.forgetAdminPass);

adminRout.post("/forget" , adminController.forgetPassVerify);

adminRout.get("/reset-password",auth.isLogout, adminController.forgetPassLoad);

adminRout.post("/reset-password", auth.isLogout,adminController.resetPassword);

adminRout.get("/dashboard",auth.isLogin, adminController.adminDashboard)

adminRout.get("/new-user", auth.isLogin,adminController.newUser);

adminRout.post("/new-user",upload.single("image"),adminController.addNewUser);

adminRout.get("/edit-user",auth.isLogin,adminController.editUserLoad);

adminRout.post("/edit-user",adminController.updateUserValue);

adminRout.get("/delete-user", adminController.deleteUserData);


adminRout.get(/.*/, (req, res) => {
  res.redirect('/admin');
});
module.exports = adminRout;