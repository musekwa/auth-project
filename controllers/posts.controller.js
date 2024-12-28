const Post = require("../models/post.model");
const { createPostSchema } = require("../middlewares/validator");

exports.createPost = async (req, res) => {
    const { title, description } = req.body;
    const {userId} = req.user;
    try {   
        const {error} = createPostSchema.validate({title, description, userId});
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }
        const newPost = new Post({ title, description, userId });
        await newPost.save();
        res.status(200).json({ success: true, message: "Post created successfully", data: newPost });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
}

exports.getPosts = async (req, res) => {
    const { page } = req.query;
    const postsPerPage = 10;

    try {   
        let pageNumber = 0
        if (page <= 1) {
            pageNumber = 0
        }
        else {
            pageNumber = page - 1
        }
        const posts = await Post.find().sort({ createdAt: -1 }).skip(pageNumber * postsPerPage).limit(postsPerPage).populate({
            path: "userId",
            select: "email"
        });
        res.status(200).json({ success: true, message: "Posts fetched successfully", data: posts });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

exports.getPost = async (req, res) => {
    const { _id } = req.query;
    try {
        const post = await Post.findOne({ _id }).populate({
            path: "userId",
            select: "email"
        });
        if (!post) {
            return res.status(404).json({ success: false, message: "Post not found" });
        }
        res.status(200).json({ success: true, message: "Post fetched successfully", data: post });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

exports.updatePost = async (req, res) => {
    const {userId} = req.user;
    const { title, description } = req.body;
    const {_id} = req.query;
    try {
        const {error} = createPostSchema.validate({title, description, userId});
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }
        const existingPost = await Post.findOne({ _id });
        if (!existingPost) {
            return res.status(404).json({ success: false, message: "Post not found" });
        }
        if (existingPost.userId.toString() !== userId) {
            return res.status(403).json({ success: false, message: "You are not authorized to update this post" });
        }
        existingPost.title = title;
        existingPost.description = description;
        const updatedPost = await existingPost.save();
        res.status(200).json({ success: true, message: "Post updated successfully", data: updatedPost });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

exports.deletePost = async (req, res) => {
    const { _id } = req.query;
    const {userId} = req.user;
    try {
        const post = await Post.findOne({ _id });
        if (!post) {
            return res.status(404).json({ success: false, message: "Post not found" });
        }
        if (post.userId.toString() !== userId) {
            return res.status(403).json({ success: false, message: "You are not authorized to delete this post" });
        }
        await Post.findOneAndDelete({ _id });
        res.status(200).json({ success: true, message: "Post deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}


