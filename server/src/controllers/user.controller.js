import User from "../models/user.model.js";

const getAllUsers = async (req, reply) => {
    try {
        const users = await User.find();
        reply.send({ success: true, users });
    } catch (error) {
        reply.code(500).send({ success: false, message: error.message });
    }
};

export default {
    getAllUsers
};
