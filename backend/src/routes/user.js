/**
 * User routes placeholder
 */
const express = require("express");
const router = express.Router();
const passport = require("passport");
const auth = passport.authenticate("jwt", { session: false });

// Placeholder route
router.get("/", auth, (req, res) => {
  res.json({ success: true, message: "User routes placeholder" });
});

module.exports = router;
