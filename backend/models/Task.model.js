import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },

    // Task Classification
    type: {
      type: String,
      enum: [
        "follow_up",
        "demo",
        "meeting",
        "call",
        "email",
        "research",
        "competitor_analysis",
      ],
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "cancelled"],
      default: "pending",
    },

    // Dates
    dueDate: { type: Date, required: true },
    completedAt: { type: Date },

    // Associations
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
    relatedLead: { type: mongoose.Schema.Types.ObjectId, ref: "Lead" },
    relatedCompetitor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Competitor",
    },

    // AI Suggestions
    aiSuggestions: [
      {
        suggestion: String,
        confidence: Number,
        applied: { type: Boolean, default: false },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Task", taskSchema);
