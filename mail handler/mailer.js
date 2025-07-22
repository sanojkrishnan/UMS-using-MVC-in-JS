const nodemailer = require("nodemailer"); // For sending emails
const config = require("../config/config");
//----------------------------------------------
//  Send verification email
const sendVerifyMail = async ( email, sendHere) => {
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
      html:sendHere
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
      } else {
        console.log("Email has been sent", info.response);
      }
    });
  } catch (error) {
    console.error(error.message);
  }
};


module.exports={sendVerifyMail};
