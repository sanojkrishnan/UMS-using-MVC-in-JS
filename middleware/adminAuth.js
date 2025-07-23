// ----------------------------------------------
// Middleware for route protection and session control

// Middleware: Only allow access if user is logged in
const isLogin = async (req, res, next) => {
  try {
    // If session does NOT exist, user is not logged in
    if (!req.session.admin_id) {
      return res.redirect("/"); // Redirect to login
    }

    // Prevent caching of authenticated pages
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    next(); // Proceed to the protected route
  } catch (error) {
    console.log("Auth Error (isLogin):", error.message);
    res.status(500).send("Internal Server Error");
  }
};

// Middleware: Only allow access if user is logged OUT
const isLogout = async (req, res, next) => {
  try {
    // If session exists, user is logged in — prevent access to login/register
    if (req.session.admin_id) {
      return res.redirect("/home");
    }

    // Optional: Prevent caching here too if needed
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    next(); // Proceed to login or public route
  } catch (error) {
    console.log("Auth Error (isLogout):", error.message);
    res.status(500).send("Internal Server Error");
  }
};

// Export both middlewares
module.exports = {
  isLogin,
  isLogout
};
