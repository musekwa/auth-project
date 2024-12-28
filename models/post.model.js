const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
    title: { type: String, required: [true, "Title is required"] },
    description: { type: String, required: [true, "Description is required"] },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: [true, "User is required"] },
}, {
    timestamps: true
});

const Post = mongoose.model("Post", postSchema);

module.exports = Post;

