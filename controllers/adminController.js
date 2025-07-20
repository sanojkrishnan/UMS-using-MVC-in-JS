// Import required modules
const User = require("../models/userModel"); // User model schema
const bcrypt = require("bcrypt"); // Library for hashing passwords
const randomString = require("randomstring"); // Generates random strings (tokens/passwords)
const config = require("../config/config"); // App configuration (email, etc.)
const nodemailer = require("nodemailer"); // Node.js module to send emails

// Hash the password securely using bcrypt
const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10); // Hashing password with salt round 10
    return passwordHash; // Return hashed password
  } catch (error) {
    console.log(error.message); // Log error if hashing fails
  }
};

// Send email to user after being added by admin
const addUserMail = async (name, email, password, user_id) => {
  try {
    // Create transporter using Gmail SMTP
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: config.emailUser, // Sender email
        pass: config.emailPassword, // Sender password
      },
    });

    // Email content with verification link and login credentials
    const mailOptions = {
      from: config.emailUser,
      to: email,
      subject: "user verification from the admin side",
      html: `<p>Hi ${name}, please click here to <a href="http://localhost:3000/verify?id=${user_id}">verify</a></p><br><br>
      <p>Your username and password is<b> ${password} </b> </p>`,
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error); // Log if error in sending
      } else {
        console.log("Email has been sent", info.response); // Log success
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

// Send password reset email with token link
const sendResetPasswordMail = async (name, email, token) => {
  try {
    // Configure email transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: config.emailUser,
        pass: config.emailPassword,
      },
    });

    // Compose email with reset password link
    const mailOptions = {
      from: config.emailUser,
      to: email,
      subject: "For Account Recovery",
      html: `<p>Hi ${name}, please click here to <a href="http://localhost:3000/admin/reset-password?token=${token}">recover your account</a></p>`,
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log("Email has been sent", info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

// Render login page for admin
const loadLogin = async (req, res) => {
  try {
    res.render("Admin/login"); // Render login view
  } catch (error) {
    console.log(error.message);
  }
};

// Verify admin credentials and login
const adminVerify = async (req, res) => {
  try {
    const givenEmail = req.body.email;
    const givenPassword = req.body.password;

    const userData = await User.findOne({ email: givenEmail }); // Find user by email

    if (userData) {
      const checkPassword = await bcrypt.compare(
        givenPassword,
        userData.password
      ); // Compare passwords
      if (checkPassword) {
        if (userData.is_admin == 0) {
          // Not an admin
          res.render("Admin/login", {
            message: `sorry.. the email or password is wrong`,
          });
        } else {
          req.session.admin_id = userData._id; // Set admin session
          res.redirect("/admin/home");
        }
      } else {
        // Password mismatch
        res.render("Admin/login", {
          message: `sorry.. the email or password is wrong`,
        });
      }
    } else {
      // No user found
      res.render("Admin/login", {
        message: `sorry.. the email or password is wrong`,
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// Load admin home dashboard
const loadDashboard = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.admin_id }); // Get admin details by session
    res.render("Admin/home", { admin: userData });
  } catch (error) {
    console.log(error.message);
    S; // Typo, unused
  }
};

// Logout admin and destroy session
const logoutAdmin = async (req, res) => {
  try {
    //  Only logs out admin, keeps user session
    delete req.session.admin_id; // Destroy admin session
    res.redirect("/admin"); // Redirect to login
  } catch (error) {
    console.log(error.message);
  }
};

// Render forget password page
const forgetAdminPass = async (req, res) => {
  try {
    res.render("Admin/forget-password");
  } catch (error) {
    console.log(error.message);
  }
};

// Process forget password request and send reset link
const forgetPassVerify = async (req, res) => {
  try {
    const givenEmail = req.body.email;
    const userData = await User.findOne({ email: givenEmail }); // Find user by email

    if (userData) {
      if (userData.is_admin == 0) {
        // Not admin
        res.render("Admin/forget-password", { message: "Email is incorrect" });
      } else {
        const randomStr = randomString.generate(); // Generate reset token
        const updatedData = await User.updateOne(
          { email: givenEmail },
          { $set: { token: randomStr } } // Save token to user
        );
        sendResetPasswordMail(userData.name, userData.email, randomStr); // Send email

        res.render("Admin/forget-password", {
          message: "please check your email",
        });
      }
    } else {
      // Email not found
      res.render("Admin/forget-password", { message: "Email is incorrect" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// Load reset password form using token
const forgetPassLoad = async (req, res) => {
  try {
    const token = req.query.token;
    const userData = await User.findOne({ token: token }); // Validate token
    if (userData) {
      res.render("Admin/reset-password", { admin_id: userData._id }); // Show reset form
    } else {
      res.render("Admin/404", { message: "Invalid" }); // Invalid token
    }
  } catch (error) {
    console.log(error.message);
  }
};

// Save new password in database
const resetPassword = async (req, res) => {
  try {
    const newPassword = req.body.password;
    const adminId = req.body.admin_id;

    const securePass = await securePassword(newPassword); // Hash new password

    const updatedData = await User.findByIdAndUpdate(
      { _id: adminId },
      { $set: { password: securePass, token: "" } } // Save new password and remove token
    );

    return res.redirect("/admin"); // Redirect to login
  } catch (error) {
    console.log(error.message);
  }
};

// Render admin dashboard and handle search functionality
const adminDashboard = async (req, res) => {
  try {
    const searchQuery = req.query.search; // Get search query from URL
    const verification = parseInt(req.query.verify); //Get verification status from the
    let users = [];

    if (searchQuery) {
      // If search is performed
      console.log("Search query:", searchQuery);

      if (verification == 1) {
        console.log("verification:", verification);
        users = await User.find({
          $or: [
            { name: { $regex: searchQuery, $options: "i" } }, // Case-insensitive search by name
            { email: { $regex: searchQuery, $options: "i" } }, // or by email
          ],
          is_admin: 0, // Only normal users
          is_verified: 1, //only verified
        });
      } else if (verification == 0) {
        console.log("verification:", verification);
        users = await User.find({
          $or: [
            { name: { $regex: searchQuery, $options: "i" } }, // Case-insensitive search by name
            { email: { $regex: searchQuery, $options: "i" } }, // or by email
          ],
          is_admin: 0, // Only normal users
          is_verified: 0, // not verified only
        });
      } else if (verification == 3) {
        console.log("verification:", verification);
        users = await User.find({
          $or: [
            { name: { $regex: searchQuery, $options: "i" } }, // Case-insensitive search by name
            { email: { $regex: searchQuery, $options: "i" } }, // or by email
          ],
          is_admin: 0, // Only normal users
        }); //both
      } else if (isNaN(verification)) {
        console.log("verification:", verification);
        users = await User.find({
          $or: [
            { name: { $regex: searchQuery, $options: "i" } }, // Case-insensitive search by name
            { email: { $regex: searchQuery, $options: "i" } }, // or by email
          ],
          is_admin: 0, // Only normal users
        }); //both
      }

      return res.render("Admin/dashboard", {
        users,verification,
        message:
          users.length > 0 ? "Search results:" : "No user matched your search",
      });
    } else if (!searchQuery && !isNaN(verification)) {
      if (verification === 0) {
        users = await User.find({ is_verified: 0 });
      } else if (verification === 1) {
        users = await User.find({ is_verified: 1 });
      } else if (verification === 3) {
        users = await User.find();
      }

      return res.render("Admin/dashboard", {
        users,verification,
        message:
          users.length > 0 ? "Search results:" : "No user matched your search",
      });
    } else {
      // No search, list all users
      users = await User.find({ is_admin: 0 });

      return res.render("Admin/dashboard", {
        users,
      });
    }
  } catch (error) {
    console.log(error.message);
    res.render("Admin/dashboard", {
      users: [],
      message: "Something went wrong",
    });
  }
};

// Render form to add new user
const newUser = async (req, res) => {
  try {
    res.render("Admin/newUser");
  } catch (error) {
    console.log(error.message);
  }
};

// Save new user in database and send welcome email
const addNewUser = async (req, res) => {
  try {
    const name = req.body.name;
    const email = req.body.email;
    const mobile = req.body.mno;
    const image = req.file.filename; // Uploaded file name
    const password = randomString.generate(8); // Auto-generate password

    const sPassword = await securePassword(password); // Hash it

    const user = new User({
      name: name,
      email: email,
      mobile: mobile,
      image: image,
      password: sPassword,
      is_admin: 0,
    });

    const userData = await user.save();

    if (userData) {
      addUserMail(name, email, password, userData._id); // Send email to new user
      res.redirect("/admin/dashboard");
    } else {
      res.render("/admin/new-user", { message: "Something Went wrong" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// Load form to edit an existing user
const editUserLoad = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.findById({ _id: id }); // Find user by ID
    if (userData) {
      res.render("Admin/editUser", { user: userData }); // Show edit form
    } else {
      res.redirect("/admin/dashboard");
    }
  } catch (error) {
    console.log(error.message);
  }
};

// Update user info in database
const updateUserValue = async (req, res) => {
  try {
    const userData = await User.findByIdAndUpdate(
      { _id: req.body.id },
      {
        $set: {
          name: req.body.name,
          email: req.body.email,
          mobile: req.body.mno,
          is_verified: req.body.verify, // Update verification status
        },
      }
    );
    res.redirect("/admin/dashboard");
  } catch (error) {
    console.log(error.message);
  }
};

// Delete a user and reload dashboard
const deleteUserData = async (req, res) => {
  try {
    const id = req.query.id;
    const userDelete = await User.deleteOne({ _id: id }); // Delete user by ID
    const users = await User.find(); // Reload all users
    return res.render("Admin/dashboard", { users, message: `User Deleted` });
  } catch (error) {
    console.log(error.message);
  }
};

// Export all admin controller functions
module.exports = {
  loadLogin, //92
  adminVerify, //101
  loadDashboard, //138
  logoutAdmin, //149
  forgetAdminPass, //160
  forgetPassVerify, //169
  forgetPassLoad, //200
  resetPassword, //215
  adminDashboard, //234
  newUser, //271
  addNewUser, //280
  editUserLoad, //313
  updateUserValue, //328
  deleteUserData, //348
};
