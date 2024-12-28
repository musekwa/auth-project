const bcrypt = require("bcryptjs");
const crypto = require("crypto");

exports.doHash = async (password, saltRounds = 10) => {
    return await bcrypt.hash(password, saltRounds);
}

exports.doHashValidation = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
}

exports.hmacProcess = (value, key) => {
    const result = crypto.createHmac("sha256", key).update(value).digest("hex");
    return result;
}

