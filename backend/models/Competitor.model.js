import mongoose from "mongoose";

const competitorSchema = new mongoose.Schema(
  {
    // Basic Info
    name: { type: String, required: true },
    website: { type: String, required: true },
    description: { type: String },
    industry: { type: String },

    // Scraping Configuration
    scrapingConfig: {
      isActive: { type: Boolean, default: true },
      frequency: {
        type: String,
        enum: ["daily", "weekly", "monthly"],
        default: "weekly",
      },
      selectors: {
        priceSelector: String,
        productSelector: String,
        reviewSelector: String,
        offerSelector: String,
      },
      lastScrapedAt: Date,
      nextScrapeAt: Date,
    },

    // Scraped Data
    scrapedData: [
      {
        dataType: {
          type: String,
          enum: ["price", "product", "review", "offer", "content"],
        },
        value: mongoose.Schema.Types.Mixed,
        scrapedAt: { type: Date, default: Date.now },
        isActive: { type: Boolean, default: true },
      },
    ],

    // AI Analysis
    aiAnalysis: [
      {
        analysisType: {
          type: String,
          enum: [
            "pricing_strategy",
            "market_position",
            "content_strategy",
            "product_comparison",
          ],
        },
        insights: String,
        recommendations: [String],
        confidence: Number,
        generatedAt: { type: Date, default: Date.now },
      },
    ],

    // User Association
    trackedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Status
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Competitor", competitorSchema);
