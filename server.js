// ----------------------------------------------
// Import and connect to MongoDB using Mongoose
const mongoose = require("mongoose"); // ODM for MongoDB

// Connect to local MongoDB database named "UMS"


/*mongoose.connect("mongodb://127.0.0.1:27017/UMS", {
  useNewUrlParser: true,
  useUnifiedTopology: true*/ //this is deprecated
  // Note: these options are good to add to prevent warnings


  //use this instead

  mongoose.connect("mongodb://127.0.0.1:27017/UMS")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));
  



// ----------------------------------------------
// Set up Express
const express = require("express");
const app = express(); // Create an Express application instance




// ----------------------------------------------
// Import and use user-related routes
const userRout = require("./routes/userRouts");
// Mount all routes from userRout at root path ("/")
// This means all routes like /login, /register, etc., are handled here
app.use("/", userRout);



// ----------------------------------------------
//Import and use admin-related routes
const adminRout = require("./routes/adminRouts");
 //Mount all routes from adminRout at root path ("/admin")
// This means all routes related to admin are handled here
app.use("/admin", adminRout)




// ----------------------------------------------
// Set the view engine to EJS
app.set("view engine", "ejs"); // Use EJS to render views

// Set the directory where view files (EJS templates) are stored
app.set("views", __dirname + "/views");



// ----------------------------------------------
// Start the server on port 3000
app.listen(3000, () => {
  console.log("Server is running");
});
