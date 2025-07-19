// Importing required modules
const User = require("../models/userModel");
const bcrypt = require("bcrypt"); // For hashing passwords
const nodemailer = require("nodemailer"); // For sending emails
const config = require("../config/config"); // App config (email credentials etc.)
const randomString = require("randomstring"); // To generate tokens for reset link

//----------------------------------------------
// 🔐 Secure password using bcrypt
const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

//----------------------------------------------
// 📧 Send verification email
const sendVerifyMail = async (name, email, user_id) => {
  try {
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

    const mailOptions = {
      from: config.emailUser,
      to: email,
      subject: "For Verification",
      html: `<p>Hi ${name}, please click here to <a href="http://localhost:3000/verify?id=${user_id}">verify</a></p>`,
    };

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

//----------------------------------------------
// 👤 Load registration page
const loadRegister = async (req, res) => {
  try {
    return res.render("users/registration");
  } catch (error) {
    console.log(error.message);
  }
};

//----------------------------------------------
// 💾 Register new user
const insertUser = async (req, res) => {
  try {
    const sPassword = await securePassword(req.body.password);

    const user = new User({
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mno,
      image: req.file.filename,
      password: sPassword,
      is_admin: 0,
    });

    const userData = await user.save();

    if (userData) {
      sendVerifyMail(req.body.name, req.body.email, userData._id); // Send verification email
      return res.render("users/registration", {
        message:
          "Your Registration has been successful, please verify the email",
      });
    } else {
      return res.render("users/registration", {
        message: "Your Registration has been failed",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//----------------------------------------------
// ✅ Email verification link logic
const verifyMail = async (req, res) => {
  try {
    await User.updateOne({ _id: req.query.id }, { $set: { is_verified: 1 } });
    return res.render("users/email-verified");
  } catch (error) {
    console.log(error.message);
  }
};

//----------------------------------------------
// ✅ Email verification through login page
const verificationLoad = async (req, res) => {
  try {
    res.render("users/verification");
  } catch (error) {
    console.log(error);
  }
};

//---------------------------------------------
//send verification email ( post )
const sendVerification = async (req, res) => {
  try {
    const mailToVerify = req.body.email;
    const userData = await User.findOne({ email: mailToVerify });

    if (userData) {
      sendVerifyMail(userData.name, userData.email, userData._id);

      res.render("users/verification", { message: `Go check your email` });
    } else {
      res.render("users/verification", {
        message: `This mail is new to me..!`,
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//----------------------------------------------
// 🔑 Load login page
const loginLoad = async (req, res) => {
  try {
    return res.render("users/login");
  } catch (error) {
    console.log(error.message);
  }
};

//----------------------------------------------
// 🚪 Logout user and destroy session
const userLogout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.log(err.message);
        return res.status(500).send("Logout failed");
      }
      res.clearCookie("connect.sid"); // Name of the session cookie (by default it will be in "connect.sid" )
      return res.redirect("/login"); // redirect to /login from the /logout page which is not valid
    });
  } catch (error) {
    console.log(error.message);
  }
};

//----------------------------------------------
// 🔐 Verify user login
const verifyLogin = async (req, res) => {
  try {
    const Email = req.body.email;
    const Password = req.body.password
    const userData = await User.findOne({ email: Email}); // it will work when two people try to make login with same email and deferent password

    if (userData) {
      const passwordMatch = await bcrypt.compare(Password, userData.password);
      if (passwordMatch) {
        if (userData.is_verified === 0) {
          return res.render("users/login", {
            message: `Please verify your email`,
          });
        } else {
          req.session.user_id = userData._id;
          return res.redirect("/home");
        }
      } else {
        return res.render("users/login", {
          message: `Email or password is incorrect`,
        });
      }
    } else {
      return res.render("users/login", {
        message: `Email or password is incorrect`,
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//----------------------------------------------
// 🏠 Load home page (after login)
const loadHome = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.user_id });
    return res.render("users/home", { user: userData }); //show user name
  } catch (error) {
    console.log(error.message);
  }
};

//----------------------------------------------
// Edit user profile in future (after login)
const editLoad = async (req, res) => {
  try {
    const id = req.query.id;

    const userData = await User.findById({ _id:id });

    if (userData) {
      res.render("users/editUser", { user: userData });
    } else {
      res.redirect("/home");
    }
  } catch (error) {
    console.log(error.message);
  }
};

//----------------------------------------------
//update edited profile data in the DB
const updateProfile = async(req, res) => {
  try{
    if(req.file){
      const newData = await User.findByIdAndUpdate({_id: req.body.user_id}, {$set:{image:req.file.filename, name:req.body.name, email:req.body.email, mobile:req.body.mno}});
    }
    else{
      const newData = await User.findByIdAndUpdate({_id: req.body.user_id}, {$set:{name:req.body.name, email:req.body.email, mobile:req.body.mno}});
    };
    res.redirect("/home");
  }catch(error){
    console.log(Error.message);
  }
};

//----------------------------------------------
// 🧠 Load forget password page
const forgetLoad = async (req, res) => {
  try {
    return res.render("users/forget");
  } catch (error) {
    console.log(error.message);
  }
};

//----------------------------------------------
// 📧 Send password reset link
const forgetLink = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await User.findOne({ email: email });

    if (userData) {
      if (userData.is_verified === 0) {
        return res.render("users/forget", {
          message: "Please verify your mail",
        });
      } else {
        const randomStr = randomString.generate();
        await User.updateOne({ email: email }, { $set: { token: randomStr } });
        sendResetPasswordMail(userData.name, userData.email, randomStr);
        return res.render("users/forget", { message: `Check your Email` });
      }
    } else {
      return res.render("users/forget", { message: `Sorry, user not found` });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//----------------------------------------------
// 📧 Send reset password email
const sendResetPasswordMail = async (name, email, token) => {
  try {
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

    const mailOptions = {
      from: config.emailUser,
      to: email,
      subject: "For Account Recovery",
      html: `<p>Hi ${name}, please click here to <a href="http://localhost:3000/forget-password?token=${token}">recover your account</a></p>`,
    };

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

//----------------------------------------------
// 🔓 Load reset password form using token
const forgetPasswordLoad = async (req, res) => {
  try {
    const token = req.query.token;
    const tokenData = await User.findOne({ token: token });

    if (tokenData) {
      return res.render("users/forget-password", { user_id: tokenData._id });
    } else {
      return res.render("users/404", { message: "User not found" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//----------------------------------------------
// 🔐 Save new password
const resetPassword = async (req, res) => {
  try {
    const newPassword = req.body.password;
    const user_id = req.body.user_id;

    const secureNewPassword = await securePassword(newPassword);

    await User.findByIdAndUpdate(
      { _id: user_id },
      { $set: { password: secureNewPassword, token: "" } }
    );

    return res.render("users/login", { message: "Try the new password..." });
  } catch (error) {
    console.log(error.message);
  }
};

//----------------------------------------------
// 📦 Export all controller functions
module.exports = {
  loadRegister,
  insertUser,
  verifyMail,
  loginLoad,
  verifyLogin,
  loadHome,
  forgetLoad,
  forgetLink,
  forgetPasswordLoad,
  resetPassword,
  userLogout,
  verificationLoad,
  sendVerification,
  editLoad,
  updateProfile
};
