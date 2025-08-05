// backend/models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    avatar: { type: String },

    // Role-based access control
    role: {
      type: String,
      enum: ["admin", "sales_manager", "sales_rep", "viewer"],
      default: "sales_rep",
    },

    // Subscription system
    subscriptionPlan: {
      type: String,
      enum: ["free", "silver", "gold"],
      default: "free",
    },
    subscriptionExpiry: { type: Date },

    // Business info
    company: { type: String },
    department: { type: String },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // Status and tracking
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    timezone: { type: String, default: "UTC" },

    // Usage tracking for subscription limits
    usageStats: {
      aiRequestsThisMonth: { type: Number, default: 0 },
      scrapingRequestsThisMonth: { type: Number, default: 0 },
      leadsCreatedThisMonth: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("User", userSchema);
