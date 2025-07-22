//----------------------------------------------
const bcrypt = require("bcrypt"); // Library for hashing passwords
//  Secure password using bcrypt
// Hash the password securely using bcrypt
const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10); // Hashing password with salt round 10
    return passwordHash; // Return hashed password
  } catch (error) {
    console.error(error.message); // Log error if hashing fails
  }
};

module.exports= {securePassword};