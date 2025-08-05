import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    // Contact Information
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    company: { type: String },
    jobTitle: { type: String },

    // Lead Status and Pipeline
    status: {
      type: String,
      enum: [
        "new",
        "contacted",
        "qualified",
        "demo_scheduled",
        "proposal_sent",
        "negotiation",
        "closed_won",
        "closed_lost",
      ],
      default: "new",
    },

    // Lead Source and Quality
    source: {
      type: String,
      enum: [
        "website",
        "social_media",
        "referral",
        "cold_outreach",
        "event",
        "competitor_analysis",
        "other",
      ],
      default: "website",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "hot"],
      default: "medium",
    },

    // Financial Information
    estimatedValue: { type: Number, default: 0 },
    actualValue: { type: Number, default: 0 },

    // Ownership and Assignment
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Additional Data
    notes: [
      {
        content: String,
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // AI-Generated Insights
    aiInsights: [
      {
        insight: String,
        confidence: Number,
        generatedAt: { type: Date, default: Date.now },
      },
    ],

    // Tracking
    lastContactDate: { type: Date },
    nextFollowUpDate: { type: Date },

    // Custom Fields for flexibility
    customFields: [
      {
        fieldName: String,
        fieldValue: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Lead", leadSchema);
