import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const { Schema, model } = mongoose;

const userSchema = new Schema({
  firstName: { type: String, required: true, trim: true },
  lastName:  { type: String, required: true, trim: true },
  role: {
    type: String,
    enum: ["premium", "normal"],
    default: "normal",
    required: true
  },
  googleId: { type: String, unique: true, sparse: true }, 
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String }, // required if no googleId
  phoneNumber: { type: String, trim: true },
},{ timestamps:true });


userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  if (this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

userSchema.methods.comparePassword = async function(candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

export default model("User", userSchema);
