import mongoose from "mongoose";

const aiInteractionSchema = new mongoose.Schema(
  {
    // User and Context
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Interaction Type
    interactionType: {
      type: String,
      enum: [
        "business_strategy",
        "competitor_analysis",
        "lead_insights",
        "pricing_suggestion",
        "general_query",
      ],
      required: true,
    },

    // Input/Output
    userPrompt: { type: String, required: true },
    aiResponse: { type: String, required: true },

    // Context Data (for better AI responses)
    contextData: {
      leadId: { type: mongoose.Schema.Types.ObjectId, ref: "Lead" },
      competitorId: { type: mongoose.Schema.Types.ObjectId, ref: "Competitor" },
      additionalContext: mongoose.Schema.Types.Mixed,
    },

    // Metadata
    model: { type: String, default: "gpt-3.5-turbo" },
    tokensUsed: { type: Number },
    responseTime: { type: Number }, // milliseconds

    // User Feedback
    userRating: { type: Number, min: 1, max: 5 },
    userFeedback: { type: String },

    // Cost Tracking
    estimatedCost: { type: Number },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("AIInteraction", aiInteractionSchema);
