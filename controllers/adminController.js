// Import required modules
const User = require("../models/userModel"); // User model schema
const randomString = require("randomstring"); // Generates random strings (tokens/passwords)
const bcrypt = require("bcrypt"); // Library for hashing passwords
const sPassword = require("../security/security");
const securePassword = sPassword.securePassword;
const emailHandler = require("../mail handler/mailer"); //email handle

// Render login page for admin
const loadLogin = async (req, res) => {
  try {
    res.render("Admin/login"); // Render login view
  } catch (error) {
    console.error(error.message);
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
    console.error(error.message);
  }
};

// Load admin home dashboard
const loadDashboard = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.admin_id }); // Get admin details by session
    res.render("Admin/home", { admin: userData });
  } catch (error) {
    console.error(error.message);
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
    console.error(error.message);
  }
};

// Render forget password page
const forgetAdminPass = async (req, res) => {
  try {
    res.render("Admin/forget-password");
  } catch (error) {
    console.error(error.message);
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
        const mailContent = `<p>Hi ${userData.name}, please click here to <a href="${process.env.BASE_URL}/admin/reset-password?token=${randomStr}">recover your account</a></p>`;

        emailHandler.sendVerifyMail(userData.email, mailContent); // Send email

        res.render("Admin/forget-password", {
          message: "please check your email",
        });
      }
    } else {
      // Email not found
      res.render("Admin/forget-password", { message: "Email is incorrect" });
    }
  } catch (error) {
    console.error(error.message);
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
    console.error(error.message);
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
    console.error(error.message);
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
          $and: [
            { is_admin: 0 },{is_verified:1},
            {
              $or: [
                { name: { $regex: searchQuery, $options: "i" } },
                { email: { $regex: searchQuery, $options: "i" } },
              ],
            },
          ],
        });
      } else if (verification == 0) {
        console.log("verification:", verification);
       users = await User.find({
          $and: [
            { is_admin: 0 },{is_verified:0},
            {
              $or: [
                { name: { $regex: searchQuery, $options: "i" } },
                { email: { $regex: searchQuery, $options: "i" } },
              ],
            },
          ],
        });
      } else if (verification == 3) {
        console.log("verification:", verification);
        users = await User.find({
          $and: [
            { is_admin: 0 },
            {
              $or: [
                { name: { $regex: searchQuery, $options: "i" } },
                { email: { $regex: searchQuery, $options: "i" } },
              ],
            },
          ],
        }); //both
      } else if (isNaN(verification)) {
        console.log("verification:", verification);
        users = await User.find({
          $and: [
            { is_admin: 0 },
            {
              $or: [
                { name: { $regex: searchQuery, $options: "i" } },
                { email: { $regex: searchQuery, $options: "i" } },
              ],
            },
          ],
        });
      }

      return res.render("Admin/dashboard", {
        users,
        verification,
        message:
          users.length > 0 ? "Search results:" : "No user matched your search",
      });
    } else if (!searchQuery && !isNaN(verification)) {
      if (verification === 0) {
        users = await User.find({ is_verified: 0 , is_admin: 0 });
      } else if (verification === 1) {
        users = await User.find({ is_verified: 1,is_admin: 0  });
      } else if (verification === 3) {
        users = await User.find({is_admin: 0 });
      }

      return res.render("Admin/dashboard", {
        users,
        verification,
        message:
          users.length > 0 ? "Search results:" : "No user matched your search",
      });
    } else {
      // No search, list all users
      users = await User.find({ is_admin: 0 });

      return res.render("Admin/dashboard", {
        users,
        verification,
      });
    }
  } catch (error) {
    console.error(error.message);
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
    console.error(error.message);
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
      //update it into DB
      name: name,
      email: email,
      mobile: mobile,
      image: image,
      password: sPassword,
      is_admin: 0,
    });

    const userData = await user.save();

    if (userData) {
      const mailContent = `<p>Hi ${name}, please click here to <a href="${process.env.BASE_URL}/verify?id=${userData._id}">verify</a></p><br><br>
      <p>Your username and password is<b> ${password} </b> </p>`;
      emailHandler.sendVerifyMail(email, mailContent); // Send email to new user
      res.redirect("/admin/dashboard");
    } else {
      res.render("/admin/new-user", { message: "Something Went wrong" });
    }
  } catch (error) {
    console.error(error.message);
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
    console.error(error.message);
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
    console.error(error.message);
  }
};

// Delete a user and reload dashboard
const deleteUserData = async (req, res) => {
  try {
    const id = req.query.id;
    const userDelete = await User.deleteOne({ _id: id }); // Delete user by ID
    const users = await User.find({is_admin:0}); // Reload all users
    return res.render("Admin/dashboard", { users, message: `User Deleted` });
  } catch (error) {
    console.error(error.message);
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
