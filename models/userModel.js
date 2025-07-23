// Import mongoose to define a schema and model
const mongoose = require("mongoose");

// Define the schema for the User collection in MongoDB
const userSchema = new mongoose.Schema({

  // User's full name
  name: {
    type: String,
    required: true // This field is mandatory
  },

  // User's email address
  email: {
    type: String,
    required: true, // Must be provided (used for login + communication)
    unique: true
  },

  // Mobile number of the user
  mobile: {
    type: String,
    required: true,
    unique: true
  },

  // Profile image filename (uploaded via Multer and saved in /public/userImages)
  image: {
    type: String,
    required: true
  },

  // Hashed password of the user (stored securely using bcrypt)
  password: {
    type: String,
    required: true
  },

  // User role: 0 = regular user, 1 = admin (used for access control)
  is_admin: {
    type: Number,
    required: true
  },

  // Email verification status: 0 = not verified, 1 = verified
  is_verified: {
    type: Number,
    default: 0 // By default, a user is not verified until email confirmation
  },

  // Token for password reset (temporary string sent via email)
  token: {
    type: String,
    default: "" // Empty unless a reset token is set
  }
});

// Export the model so it can be used in controllers
module.exports = mongoose.model("User", userSchema);
