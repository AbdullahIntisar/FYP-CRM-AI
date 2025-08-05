import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Plan Details
    plan: {
      type: String,
      enum: ["free", "silver", "gold"],
      required: true,
    },

    // Limits based on plan
    limits: {
      maxLeads: { type: Number, required: true },
      maxCompetitors: { type: Number, required: true },
      maxAIRequests: { type: Number, required: true },
      maxScrapingRequests: { type: Number, required: true },
      hasAdvancedAnalytics: { type: Boolean, default: false },
      hasAPIAccess: { type: Boolean, default: false },
    },

    // Usage Tracking
    currentUsage: {
      leadsCount: { type: Number, default: 0 },
      competitorsCount: { type: Number, default: 0 },
      aiRequestsThisMonth: { type: Number, default: 0 },
      scrapingRequestsThisMonth: { type: Number, default: 0 },
    },

    // Billing Info (simulated)
    status: {
      type: String,
      enum: ["active", "cancelled", "expired", "trial"],
      default: "trial",
    },

    // Dates
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    trialEndDate: { type: Date },

    // Payment simulation
    monthlyPrice: { type: Number, default: 0 },
    isTrialUsed: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Subscription", subscriptionSchema);
