// Middleware to check if the admin is logged in
const isLogin = async (req, res, next) => {
  try {
    // Check if session has admin_id set (i.e., admin is logged in)
    if (req.session.admin_id) {
      // ✅ Admin is logged in, proceed to the next middleware or route handler
      next();
    } else {
      // ❌ Not logged in, redirect to admin login page
      res.redirect("/admin");
    }
  } catch (error) {
    // Log any unexpected errors
    console.log(error.message);
  }
};

// Middleware to check if admin is logged out
const isLogout = async (req, res, next) => {
  try {
    // If already logged in as admin, redirect to admin home
    if (req.session.admin_id) {
      res.redirect("/admin/home");
    } else {
      // ✅ Not logged in, allow access to login/forget/reset pages
      next();
    }
  } catch (error) {
    // Log any unexpected errors
    console.log(error.message);
  }
};

// Export both middleware functions for use in routes
module.exports = {
  isLogin,
  isLogout
};
