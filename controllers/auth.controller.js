
const User = require("../models/user.model");
const { signupSchema, signinSchema, acceptCodeSchema, changePasswordSchema, verifyForgotPasswordCodeSchema } = require("../middlewares/validator");
const transporter = require("../middlewares/sendMail");
const { doHash, doHashValidation, hmacProcess } = require("../utils/hashing");
const jwt = require("jsonwebtoken");

exports.signup = async (req, res) => {

    const { email, password } = req.body;

    try {
        const { error, value } = signupSchema.validate({ email, password });
        if (error) {
            return res.status(401).json({ success: false, message: error.details[0].message });
        }
        // check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(401).json({ success: false, message: "User already exists" });
        }
        // hash password
        const hashedPassword = await doHash(password);
        const newUser = new User({ email, password: hashedPassword });
        const result = await newUser.save();
        result.password = undefined;


        res.status(201).json({ success: true, message: "User created successfully", data: result });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }

}

exports.signin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const { error, value } = signinSchema.validate({ email, password });
        if (error) {
            return res.status(401).json({ success: false, message: error.details[0].message });
        }
        const existingUser = await User.findOne({ email }).select("+password");
        if (!existingUser) {
            return res.status(401).json({ success: false, message: "User not found" });
        }
        if(!existingUser.verified){
            return res.status(401).json({ success: false, message: "User not verified" });
        }
        const isPasswordValid = await doHashValidation(password, existingUser.password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: "Invalid password" });
        }
        // const token = await generateToken(existingUser);
        const token = jwt.sign({ userId: existingUser._id, email: existingUser.email, verified: existingUser.verified }, process.env.JWT_SECRET, { expiresIn: "8h" });
        res.cookie("Authorization", "Bearer " + token, { expires: new Date(Date.now() + 8 * 3600000), httpOnly: process.env.NODE_ENV === 'production', secure: process.env.NODE_ENV === 'production' }).json({ success: true, message: "User logged in successfully", token });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

exports.signout = async (req, res) => {
    res.clearCookie("Authorization").status(200).json({ success: true, message: "User logged out successfully" });
}

exports.sendVerificationCode = async (req, res) => {
    const { email } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return res.status(401).json({ success: false, message: "User not found" });
        }
        if (existingUser.verified) {
            return res.status(401).json({ success: false, message: "User already verified" });
        }

        const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
        let info = await transporter.sendMail({
            from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
            to: existingUser.email,
            subject: "YT-Auth Verification Code",
            html: `<h1>Your verification code is <b>${verificationCode}</b></h1>`
        });
       
        if (info.accepted[0] === existingUser.email) {

            const hmacCode = hmacProcess(verificationCode, process.env.HMAC_VERIFICATION_CODE_SECRET);
            existingUser.verificationCode = hmacCode;
            existingUser.verificationCodeValidation = Date.now();
            await existingUser.save();
            return res.status(200).json({ success: true, message: "Verification code sent successfully", data: { verificationCode: existingUser.verificationCode, verificationCodeValidation: existingUser.verificationCodeValidation } });

        }

        res.status(400).json({ success: false, message: "Failed to send verification code" });


    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}


exports.acceptCode = async (req, res) => {
    const { email, providedCode } = req.body;
    try {
        const { error, value } = acceptCodeSchema.validate({ email, providedCode });
        if (error) {
            return res.status(401).json({ success: false, message: error.details[0].message });
        }
        const codeValue = providedCode.toString();
        const existingUser = await User.findOne({ email }).select("+verificationCode +verificationCodeValidation");
  
        if (!existingUser) {
            return res.status(401).json({ success: false, message: "User not found" });
        }
        if (existingUser.verified) {
            return res.status(401).json({ success: false, message: "User already verified" });
        }
        if (!existingUser.verificationCode || !existingUser.verificationCodeValidation) {
            return res.status(401).json({ success: false, message: "Verification code not found" });
        }

        if (Date.now() - existingUser.verificationCodeValidation > 5 * 60 * 1000) {
            return res.status(401).json({ success: false, message: "Verification code expired" });
        }

        const hmacCode = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET);
        if (hmacCode !== existingUser.verificationCode) {
            return res.status(401).json({ success: false, message: "Invalid verification code" });
        }
        existingUser.verified = true;
        existingUser.verificationCode = undefined;
        existingUser.verificationCodeValidation = undefined;
        await existingUser.save();
        res.status(200).json({ success: true, message: "Verification code verified successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

exports.changePassword = async (req, res)=>{
    const {userId, verified} = req.user;
    const {oldPassword, newPassword} = req.body;
    try{
        const {error, value} = changePasswordSchema.validate({oldPassword, newPassword});
        if(error){
            return res.status(401).json({ success: false, message: error.details[0].message });
        }
        if(!verified){
            return res.status(401).json({ success: false, message: "User not verified" });
        }
        const existingUser = await User.findOne({_id: userId}).select("+password");
        if(!existingUser){
            return res.status(401).json({ success: false, message: "User not found" });
        }
        const isPasswordValid = await doHashValidation(oldPassword, existingUser.password);
        if(!isPasswordValid){
            return res.status(401).json({ success: false, message: "Invalid password" });
        }

        const hashedNewPassword = await doHash(newPassword);
        existingUser.password = hashedNewPassword;
        await existingUser.save();
        res.status(200).json({ success: true, message: "Password changed successfully" });


    }
    catch(error){
        console.log(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}


exports.sendForgotPasswordCode = async (req, res) => {
    const { email } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return res.status(401).json({ success: false, message: "User not found" });
        }
       

        const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
        let info = await transporter.sendMail({
            from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
            to: existingUser.email,
            subject: "YT-Auth Forgot Password Code",
            html: `<h1>Your verification code is <b>${verificationCode}</b></h1>`
        });
       
        if (info.accepted[0] === existingUser.email) {

            const hmacCode = hmacProcess(verificationCode, process.env.HMAC_VERIFICATION_CODE_SECRET);
            existingUser.forgotPasswordCode = hmacCode;
            existingUser.forgotPasswordCodeValidation = Date.now();
            await existingUser.save();
            return res.status(200).json({ success: true, message: "Verification code sent successfully", data: { forgotPasswordCode: existingUser.forgotPasswordCode, forgotPasswordCodeValidation: existingUser.forgotPasswordCodeValidation } });

        }

        res.status(400).json({ success: false, message: "Failed to send verification code" });


    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}


exports.verifyForgotPasswordCode = async (req, res) => {
    const { email, providedCode, newPassword } = req.body;
    try {
        const { error, value } = verifyForgotPasswordCodeSchema.validate({ email, providedCode, newPassword });
        if (error) {
            return res.status(401).json({ success: false, message: error.details[0].message });
        }
        const codeValue = providedCode.toString();
        const existingUser = await User.findOne({ email }).select("+forgotPasswordCode +forgotPasswordCodeValidation");
  
        if (!existingUser) {
            return res.status(401).json({ success: false, message: "User not found" });
        }
        if (!existingUser.forgotPasswordCode || !existingUser.forgotPasswordCodeValidation) {
            return res.status(401).json({ success: false, message: "Verification code not found" });
        }

        if (Date.now() - existingUser.forgotPasswordCodeValidation > 5 * 60 * 1000) {
            return res.status(401).json({ success: false, message: "Verification code expired" });
        }

        const hmacCode = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET);
        if (hmacCode !== existingUser.forgotPasswordCode) {
            return res.status(401).json({ success: false, message: "Invalid verification code" });
        }
        existingUser.forgotPasswordCode = undefined;
        existingUser.forgotPasswordCodeValidation = undefined;
        await existingUser.save();
        res.status(200).json({ success: true, message: "Password updated successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}