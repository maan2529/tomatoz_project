import User from "../models/user.model.js";

const registerUser = async (req, reply) => {
    try {
        const { firstName, lastName, email, password, phoneNumber, role } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return reply.code(400).send({
                success: false,
                message: "User with this email already exists"
            });
        }

        const newUser = await User.create({
            firstName,
            lastName,
            email,
            password,
            phoneNumber,
            role: role || "normal"
        });

        const userResponse = {
            _id: newUser._id,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            email: newUser.email,
            role: newUser.role,
            phoneNumber: newUser.phoneNumber,
            googleId: newUser.googleId,
            createdAt: newUser.createdAt,
            updatedAt: newUser.updatedAt
        };

        // Generate tokens
        const accessToken = newUser.generateAccessToken();
        const refreshToken = newUser.generateRefreshToken();

        // Set cookie using Fastify's setCookie method
        reply.setCookie('refreshToken', refreshToken, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
        });

        reply.code(201).send({
            success: true,
            message: "User registered successfully",
            user: userResponse,
            accessToken
        });
    } catch (error) {
        if (error.code === 11000) {
            return reply.code(400).send({
                success: false,
                message: "User with this email already exists"
            });
        }
        reply.code(500).send({ success: false, message: error.message });
    }
};

const loginUser = async (req, reply) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return reply.code(401).send({
                success: false,
                message: "Invalid email or password"
            });
        }

        if (!user.password) {
            return reply.code(401).send({
                success: false,
                message: "This email is associated with Google login. Please use Google Sign-In."
            });
        }

        const isMatch = await user.isPasswordCorrect(password);
        if (!isMatch) {
            return reply.code(401).send({
                success: false,
                message: "Invalid email or password"
            });
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        const userResponse = {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            phoneNumber: user.phoneNumber
        };

        // Set cookie using Fastify's setCookie
        reply.setCookie('refreshToken', refreshToken, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
        });

        reply.send({
            success: true,
            message: "Login successful",
            user: userResponse,
            accessToken
        });
    } catch (error) {
        reply.code(500).send({ success: false, message: error.message });
    }
};

const logoutUser = async (req, reply) => {
    try {
        // Clear the refreshToken cookie
        reply.clearCookie('refreshToken', {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        reply.send({
            success: true,
            message: "Logged out successfully"
        });
    } catch (error) {
        reply.code(500).send({ success: false, message: error.message });
    }
};

export default {
    loginUser,
    registerUser,
    logoutUser
};