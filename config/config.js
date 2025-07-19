// This file holds application-wide configuration values,
// like email credentials and session secret key for session handling.

// Secret key used to sign and verify session cookies.
// This string should be strong and kept private.
const sessionSec = "mysitesessionsecret";

// Email ID used to send verification and reset password emails.
// In a real app, avoid hardcoding this. Use environment variables (.env) instead.
const emailUser = "tmlinks1234@gmail.com";

// App password or generated token from your email provider
// (For Gmail, this is an App Password, not your Gmail login password).
const emailPassword = "dwpe skpe scbl xqlj";

// Export all config values as an object so they can be imported in other files.
module.exports = {
    sessionSec,
    emailUser,
    emailPassword
};
