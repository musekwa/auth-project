const express = require("express");
const dotenv = require("dotenv");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const authRouter = require("./routers/authRouter");
const postsRouter = require("./routers/postsRouter");
dotenv.config();

const app = express();
app.use(cors());
app.use(helmet())
app.use(cookieParser())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/auth", authRouter)
app.use("/api/posts", postsRouter)

mongoose.connect(process.env.MONGO_URI).then(() => {
    console.log("MongoDB connected");
}).catch((err) => {
    console.log(err);
});


app.get("/", (req, res) => {
    res.send("Hello World");
});






app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});
