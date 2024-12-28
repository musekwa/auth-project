
const { number } = require("joi");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    email: { type: String, required: [true, "Email is required"], trim: true, unique: [true, "Email already exists"], minlength: [3, "Email must be at least 3 characters long"], lowercase: true },
    password: { type: String, required: [true, "Password is required"], trim: true, select: false, },
    verified: { type: Boolean, default: false },
    verificationCode: { type: String, select: false },
    verificationCodeValidation: { type: Number, select: false },
    forgotPasswordCode: { type: String, select: false },
    forgotPasswordCodeValidation: { type: Number, select: false },
}, {
    timestamps: true
});

const User = mongoose.model("User", userSchema);

module.exports = User;
