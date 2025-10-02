import env from "../config/index.js"
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const registerUser = async (req, reply) => {
    try {
        const { username, email, password } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({ username, email, password: hashedPassword });

        reply.code(201).send({ success: true, user: newUser });
    } catch (error) {
        reply.code(500).send({ success: false, message: error.message });
    }
};

const loginUser = async (req, reply) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return reply.code(404).send({ message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return reply.code(401).send({ message: "Invalid credentials" });

        const token = jwt.sign({ id: user._id }, env.JWT_SECRET, { expiresIn: "1d" });

        reply.send({ success: true, token });
    } catch (error) {
        reply.code(500).send({ success: false, message: error.message });
    }
};

export default {
    loginUser,
    registerUser
};
