const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const randomString = require("randomstring")
const config = require("../config/config");
const nodemailer = require("nodemailer");

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};


const addUserMail = async (name, email,password, user_id) => {
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
      subject: "user verification from the admin side",
      html: `<p>Hi ${name}, please click here to <a href="http://localhost:3000/verify?id=${user_id}">verify</a></p><br><br>
      <p>Your username and password is<b> ${password} </b> </p>`,
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
      html: `<p>Hi ${name}, please click here to <a href="http://localhost:3000/admin/reset-password?token=${token}">recover your account</a></p>`,
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

const loadLogin = async (req, res) => {
  try {
    res.render("Admin/login");
  } catch (error) {
    console.log(error.message);
  }
};

const adminVerify = async (req, res) => {
  try {
    const givenEmail = req.body.email;
    const givenPassword = req.body.password;

    const userData = await User.findOne({ email: givenEmail });

    if (userData) {
      const checkPassword = await bcrypt.compare(
        givenPassword,
        userData.password
      );
      if (checkPassword) {
        if (userData.is_admin == 0) {
          res.render("Admin/login", {
            message: `sorry.. the email or password is wrong`,
          });
        } else {
          req.session.admin_id = userData._id;
          res.redirect("/admin/home");
        }
      } else {
        res.render("Admin/login", {
          message: `sorry.. the email or password is wrong`,
        });
      }
    } else {
      res.render("Admin/login", {
        message: `sorry.. the email or password is wrong`,
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};


const  loadDashboard = async(req,res) => {
    try{
      const userData = await User.findById({_id:req.session.admin_id});
        res.render("Admin/home",{admin:userData});
    }catch(error){
        console.log(error.message);S
    }
};


const logoutAdmin = async(req,res) => {
    try{

        req.session.destroy();
        res.redirect("/admin");

    }catch(error){
        console.log(error.message);
    }
};

const forgetAdminPass = async(req,res) => {
  try{
    res.render("Admin/forget-password");

  }catch(error){
    console.log(error.message);
  }
};


const forgetPassVerify = async(req , res) => {
  try{

    const givenEmail = req.body.email;
    const userData = await User.findOne({email:givenEmail});

    if(userData){
      if(userData.is_admin == 0){
        res.render("Admin/forget-password", {message:"Email is incorrect"});
      }
      else{
        const randomStr = randomString.generate();
        const updatedData = await User.updateOne({email:givenEmail},{$set:{token:randomStr}});
        sendResetPasswordMail(userData.name,userData.email,randomStr);

        res.render("Admin/forget-password", {message:"please check your email"})
      }
    }
    else{
      res.render("Admin/forget-password", {message:"Email is incorrect"});
    }
  }catch(error){
    console.log(error.message);
  }
};

const forgetPassLoad = async(req,res) => {
  try{
    const token = req.query.token;
    const userData = await User.findOne({token:token});
    if(userData){
      res.render("Admin/reset-password", {admin_id:userData._id});
    }
    else{
      res.render("Admin/404",{message:"Invalid"});
    }
  }catch(error){
    console.log(error.message);
  }
};

const resetPassword = async(req,res) => {
  try{

    const newPassword = req.body.password;
    const adminId = req.body.admin_id

    const securePass = await securePassword(newPassword);

    const updatedData = await User.findByIdAndUpdate({_id:adminId},{$set:{password:securePass, token: ""}});

    return res.redirect("/admin");

  }catch(error){
    console.log(error.message);
  }
};


const adminDashboard = async (req, res) => {
  try{
    const usersData = await User.find({is_admin:0});
    res.render("Admin/dashboard",{users:usersData});
  }catch(error){
    console.log(error.message);
  }
};

//Add new user

const newUser = async(req,res) => {
  try{

    res.render("Admin/newUser");

  }catch(error){
    console.log(error.message);
  }
};

const addNewUser = async(req,res) => {
  try{
    const name = req.body.name;
    const email = req.body.email;
    const mobile = req.body.mno;
    const image = req.file.filename;
    const password = randomString.generate(8);

    const sPassword = await securePassword(password);

    const user = new User({
      name :name,
      email:email,
      mobile:mobile,
      image: image,
      password:sPassword,
      is_admin: 0,
    });

    const userData = await user.save();

    if(userData){
      addUserMail(name, email, password, userData._id);
      res.redirect("/admin/dashboard")
    }
    else{
      res.render("/admin/new-user", {message: "Something Went wrong"});
    }
  }catch(error){
    console.log(error.message);
  }
};

const editUserLoad = async(req,res) => {
  try{
    const id = req.query.id;
    const userData =await User.findById({_id:id});
    if(userData){
      res.render("Admin/editUser",{user:userData});
    }
    else{
      res.redirect("/admin/dashboard")
    };
  }catch(error){
    console.log(error.message);
  }
};

const updateUserValue = async(req,res)=> {
  try{
    const userData = await User.findByIdAndUpdate({_id:req.body.id},{$set: { name:req.body.name, email:req.body.email, mobile:req.body.mno, is_verified:req.body.verify
     } })
     res.redirect("/admin/dashboard")
  }catch(error){
    console.log(error.message);
  }
};

const deleteUserData = async(req,res) => {
  try{

    const id = req.query.id;
    const userDelete = await User.deleteOne({_id:id});
    const users = await User.find();
    return res.render("Admin/dashboard",{users, message:`User Deleted`})
  }catch(error){
    console.log(error.message);
  }
};

module.exports = {
  loadLogin,
  adminVerify,
  loadDashboard,
  logoutAdmin,
  forgetAdminPass,
  forgetPassVerify,
  forgetPassLoad,
  resetPassword,
  adminDashboard,
  newUser,
  addNewUser,
  editUserLoad,
  updateUserValue,
  deleteUserData
};
