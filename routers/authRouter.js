const express = require("express");
const { signup, signin, signout, sendVerificationCode, acceptCode, changePassword, sendForgotPasswordCode, verifyForgotPasswordCode } = require("../controllers/auth.controller");
const { identifier } = require("../middlewares/identification");

const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.get("/signout", identifier, signout);
router.patch("/verify-code", sendVerificationCode);
router.patch("/accept-code", acceptCode);
router.patch("/change-password", identifier, changePassword);
router.patch("/forgot-password", sendForgotPasswordCode);
router.patch("/verify-forgot-password-code", verifyForgotPasswordCode);

module.exports = router;
