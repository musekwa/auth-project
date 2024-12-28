const express = require("express");
const { identifier } = require("../middlewares/identification");
const { createPost, getPosts, getPost, updatePost, deletePost } = require("../controllers/posts.controller");

const router = express.Router();

router.get("/all-posts", getPosts);
router.get("/single-post", getPost);
router.post("/create-post", identifier, createPost);
router.put("/update-post", identifier, updatePost);
router.delete("/delete-post", identifier, deletePost);

module.exports = router;