const nodemailer = require("nodemailer"); // For sending emails

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
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
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
