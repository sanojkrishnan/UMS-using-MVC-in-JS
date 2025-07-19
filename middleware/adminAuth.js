const isLogin = async (req, res, next) => {
  try {
    if (req.session.admin_id) {    //used admin_id instead of user_id, otherwise it will automatically logs in on user account also
      next(); // ✅ logged in
    } else {
      res.redirect("/admin");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const isLogout = async (req, res, next) => {
  try {
    if (req.session.admin_id) {
      res.redirect("/admin/home");
    } else {
      next(); // ✅ continue to login page
    }
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  isLogin,
  isLogout
};
