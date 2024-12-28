const Joi = require("joi");

exports.signupSchema = Joi.object({
    email: Joi.string().min(3).max(255).email({
        tlds: { allow: ["com", "net", "fr",] }
    }).required(),
    password: Joi.string().min(1).required().pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$')),
});

exports.signinSchema = Joi.object({
    email: Joi.string().min(3).max(255).email({
        tlds: { allow: ["com", "net", "fr",] }
    }).required(),
    password: Joi.string().min(1).required(),
});

exports.acceptCodeSchema = Joi.object({
    email: Joi.string().min(3).max(255).email({
        tlds: { allow: ["com", "net", "fr",] }
    }).required(),
    providedCode: Joi.number().required(),
});

exports.changePasswordSchema = Joi.object({
    oldPassword: Joi.string().min(1).required().pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$')),
    newPassword: Joi.string().min(1).required().pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$')),
});

exports.verifyForgotPasswordCodeSchema = Joi.object({
    email: Joi.string().min(3).max(255).email({
        tlds: { allow: ["com", "net", "fr",] }
    }).required(),
    providedCode: Joi.number().required(),
    newPassword: Joi.string().min(1).required().pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$')),
});

exports.createPostSchema = Joi.object({
    title: Joi.string().min(6).max(255).required(),
    description: Joi.string().min(6).max(600).required(),
    userId: Joi.string().required(),
});

