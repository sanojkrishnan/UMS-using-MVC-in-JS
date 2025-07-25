// Importing required modules
const User = require("../models/userModel");
const randomString = require("randomstring"); // To generate tokens for reset link
const bcrypt = require("bcrypt"); //password management

const sPassword = require("../security/security"); //password checker
const securePassword = sPassword.securePassword;

const emailHandler = require("../mail handler/mailer"); //email handle

//----------------------------------------------
//  Load registration page
const loadRegister = async (req, res) => {
  try {
    return res.render("users/registration");
  } catch (error) {
    console.error(error.message);
  }
};

//----------------------------------------------
//  Register new user
const insertUser = async (req, res) => {
  try {
    const sPassword = await securePassword(req.body.password);
    const regEmail = req.body.email;
    const number = req.body.mno;

    const ifNum = await User.findOne({ mobile: number });
    const ifMail = await User.findOne({ email: regEmail });

    if (ifMail && !ifNum) {
      return res.render("users/registration", { 
        message: "the email already exist" 
      });
    } 
    else if (ifNum && !ifMail) {
      return res.render("users/registration", {
        message: "the mobile number already exist",
      });
    } 
    else if (ifMail && ifNum) {
      return res.render("users/registration", {
        message: " the email and mobile number already exist",
      });
    } else {
      const user = new User({
        name: req.body.name,
        email: req.body.email,
        mobile: req.body.mno,
        image: req.file.filename,
        password: sPassword,
        is_admin: 0,
      }); //upload user

      const userData = await user.save(); //save user
      const mailContent = `<p>Hi ${userData.name}, please click here to <a href="${process.env.BASE_URL}/verify?id=${userData._id}">verify</a></p>`;

      if (userData) {
        emailHandler.sendVerifyMail(req.body.email, mailContent); // Send verification email
        return res.render("users/registration", {
          message:
            "Your Registration has been successful, please verify the email",
        });
      } else {
        return res.render("users/registration", {
          message: "Your Registration has been failed",
        });
      }
    }
  } catch (error) {
    console.error(error.message);
  }
};

//----------------------------------------------
//  Email verification link logic
const verifyMail = async (req, res) => {
  try {
    await User.updateOne({ _id: req.query.id }, { $set: { is_verified: 1 } });
    return res.render("users/email-verified");
  } catch (error) {
    console.error(error.message);
  }
};

//----------------------------------------------
//  Email verification through login page
const verificationLoad = async (req, res) => {
  try {
    res.render("users/verification");
  } catch (error) {
    console.error(error);
  }
};

//---------------------------------------------
//  send verification email ( post )
const sendVerification = async (req, res) => {
  try {
    const mailToVerify = req.body.email;
    const userData = await User.findOne({ email: mailToVerify });
    const mailContent = `<p>Hi ${userData.name}, please click here to <a href="${process.env.BASE_URL}/verify?id=${userData._id}">verify</a></p>`;

    if (userData) {
      emailHandler.sendVerifyMail(userData.email, mailContent);

      res.render("users/verification", { message: `Go check your email` });
    } else {
      res.render("users/verification", {
        message: `This mail is new to me..!`,
      });
    }
  } catch (error) {
    console.error(error.message);
  }
};

//----------------------------------------------
//  Load login page
const loginLoad = async (req, res) => {
  try {
    res.render("users/login");
  } catch (error) {
    console.error(error.message);
  }
};

//----------------------------------------------
//  Logout user and destroy session
const userLogout = async (req, res) => {
  try {
    //  Only logs out user, keeps admin session
    delete req.session.user_id; // delete user session only
    res.redirect("/login"); // Redirect to login
  } catch (error) {
    console.error(error.message);
  }
};

//----------------------------------------------
//  Verify user login
const verifyLogin = async (req, res) => {
  try {
    const Email = req.body.email;
    const Password = req.body.password;
    const userData = await User.findOne({ email: Email }); // it will work when two people try to make login with same email and deferent password

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
    console.error(error.message);
  }
};

//----------------------------------------------
//  Load home page (after login)
const loadHome = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.user_id });
    return res.render("users/home", { user: userData }); //show user name
  } catch (error) {
    console.error(error.message);
  }
};

//----------------------------------------------
// Edit user profile in future (after login)
const editLoad = async (req, res) => {
  try {
    const id = req.query.id;

    const userData = await User.findById({ _id: id });

    if (userData) {
      res.render("users/editUser", { user: userData });
    } else {
      res.redirect("/home");
    }
  } catch (error) {
    console.error(error.message);
  }
};

//----------------------------------------------
//update edited profile data in the DB
const updateProfile = async (req, res) => {
  try {
    if (req.file) {
      const newData = await User.findByIdAndUpdate(
        { _id: req.body.user_id },
        {
          $set: {
            image: req.file.filename,
            name: req.body.name,
            email: req.body.email,
            mobile: req.body.mno,
          },
        }
      );
    } else {
      const newData = await User.findByIdAndUpdate(
        { _id: req.body.user_id },
        {
          $set: {
            name: req.body.name,
            email: req.body.email,
            mobile: req.body.mno,
          },
        }
      );
    }
    res.redirect("/home");
  } catch (error) {
    console.error(Error.message);
  }
};

//----------------------------------------------
//  Load forget password page
const forgetLoad = async (req, res) => {
  try {
    return res.render("users/forget");
  } catch (error) {
    console.error(error.message);
  }
};

//----------------------------------------------
//  Send password reset link
const forgetLink = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await User.findOne({ email: email });
    const randomStr = randomString.generate();
    const mailContent = `<p>Hi ${userData.name}, please click here to <a href="${process.env.BASE_URL}/forget-password?token=${randomStr}">recover your account</a></p>`;

    if (userData) {
      if (userData.is_verified === 0) {
        return res.render("users/forget", {
          message: "Please verify your mail",
        });
      } else {
        await User.updateOne({ email: email }, { $set: { token: randomStr } });
        emailHandler.sendVerifyMail(userData.email, mailContent);
        return res.render("users/forget", { message: `Check your Email` });
      }
    } else {
      return res.render("users/forget", { message: `Sorry, user not found` });
    }
  } catch (error) {
    console.error(error.message);
  }
};

//----------------------------------------------
// Load reset password form using token
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
    console.error(error.message);
  }
};

//----------------------------------------------
//  Save new password
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
    console.error(error.message);
  }
};

//----------------------------------------------
//  Export all controller functions
module.exports = {
  loadRegister, //line 55
  insertUser, //line 65
  verifyMail, //line 98
  loginLoad, //line 140
  verifyLogin, //line 163
  loadHome, //line 197
  forgetLoad, //line 242
  forgetLink, //line 252
  forgetPasswordLoad, //line 312
  resetPassword, //line 329
  userLogout, //line 150
  verificationLoad, //line 109
  sendVerification, //line 119
  editLoad, //line 208
  updateProfile, //line 226
};
