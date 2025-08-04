// backend/models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "sales_manager", "sales_rep", "marketing_manager"],
      default: "sales_rep",
    },
    department: { type: String },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    permissions: [
      {
        module: String, // 'leads', 'tasks', 'reports', etc.
        actions: [String], // ['read', 'write', 'delete', 'export']
      },
    ],
    avatar: { type: String },
    phone: { type: String },
    timezone: { type: String, default: "UTC" },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("User", userSchema);
