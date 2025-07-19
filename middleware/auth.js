// Middleware for protecting routes

// 🔐 Only allow access if user is logged in
const isLogin = async (req, res, next) => {
  try {
    if (!req.session.user_id) {
      return res.redirect("/"); // Not logged in — redirect to login
    }
    next(); // Logged in — continue
  } catch (error) {
    console.log(error.message);
  }
};



// 🔓 Only allow access if user is logged OUT
const isLogout = async (req, res, next) => {
  try {
    if (req.session.user_id) {
      return res.redirect("/home"); // Already logged in — go home
    }
    next(); // Not logged in — continue
  } catch (error) {
    console.log(error.message);
  }
};



module.exports = {
  isLogin,
  isLogout
};
