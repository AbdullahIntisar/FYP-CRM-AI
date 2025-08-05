// backend/utils/subscriptionUtils.js
import Subscription from "../models/Subscriptions.model.js";
import User from "../models/User.model.js";

/**
 * Update usage statistics for a user
 * @param {string} userId - User ID
 * @param {string} usageType - Type of usage (leads, competitors, ai, scraping)
 * @param {number} increment - Amount to increment (default: 1)
 */
export const updateUsage = async (userId, usageType, increment = 1) => {
  try {
    const subscription = await Subscription.findOne({ userId });
    if (!subscription) return false;

    const updateField = {};

    switch (usageType) {
      case "leads":
        updateField["currentUsage.leadsCount"] =
          subscription.currentUsage.leadsCount + increment;
        break;
      case "competitors":
        updateField["currentUsage.competitorsCount"] =
          subscription.currentUsage.competitorsCount + increment;
        break;
      case "ai":
        updateField["currentUsage.aiRequestsThisMonth"] =
          subscription.currentUsage.aiRequestsThisMonth + increment;
        break;
      case "scraping":
        updateField["currentUsage.scrapingRequestsThisMonth"] =
          subscription.currentUsage.scrapingRequestsThisMonth + increment;
        break;
      default:
        return false;
    }

    await Subscription.findOneAndUpdate({ userId }, updateField);

    // Also update user usage stats
    const userUpdateField = {};
    switch (usageType) {
      case "ai":
        userUpdateField["usageStats.aiRequestsThisMonth"] =
          subscription.currentUsage.aiRequestsThisMonth + increment;
        break;
      case "scraping":
        userUpdateField["usageStats.scrapingRequestsThisMonth"] =
          subscription.currentUsage.scrapingRequestsThisMonth + increment;
        break;
      case "leads":
        userUpdateField["usageStats.leadsCreatedThisMonth"] =
          subscription.currentUsage.leadsCount + increment;
        break;
    }

    if (Object.keys(userUpdateField).length > 0) {
      await User.findByIdAndUpdate(userId, userUpdateField);
    }

    return true;
  } catch (error) {
    console.error("Error updating usage:", error);
    return false;
  }
};

/**
 * Check if user can perform an action based on their subscription limits
 * @param {string} userId - User ID
 * @param {string} featureType - Feature type to check
 * @returns {object} - { canUse: boolean, message: string, limit: number, current: number }
 */
export const checkFeatureAccess = async (userId, featureType) => {
  try {
    const subscription = await Subscription.findOne({ userId });
    if (!subscription) {
      return {
        canUse: false,
        message: "No subscription found",
        limit: 0,
        current: 0,
      };
    }

    const { limits, currentUsage } = subscription;

    switch (featureType) {
      case "leads":
        if (limits.maxLeads === -1)
          return {
            canUse: true,
            message: "Unlimited",
            limit: -1,
            current: currentUsage.leadsCount,
          };
        return {
          canUse: currentUsage.leadsCount < limits.maxLeads,
          message:
            currentUsage.leadsCount >= limits.maxLeads
              ? "Lead limit reached"
              : "Access granted",
          limit: limits.maxLeads,
          current: currentUsage.leadsCount,
        };

      case "competitors":
        if (limits.maxCompetitors === -1)
          return {
            canUse: true,
            message: "Unlimited",
            limit: -1,
            current: currentUsage.competitorsCount,
          };
        return {
          canUse: currentUsage.competitorsCount < limits.maxCompetitors,
          message:
            currentUsage.competitorsCount >= limits.maxCompetitors
              ? "Competitor tracking limit reached"
              : "Access granted",
          limit: limits.maxCompetitors,
          current: currentUsage.competitorsCount,
        };

      case "ai":
        if (limits.maxAIRequests === -1)
          return {
            canUse: true,
            message: "Unlimited",
            limit: -1,
            current: currentUsage.aiRequestsThisMonth,
          };
        return {
          canUse: currentUsage.aiRequestsThisMonth < limits.maxAIRequests,
          message:
            currentUsage.aiRequestsThisMonth >= limits.maxAIRequests
              ? "AI request limit reached for this month"
              : "Access granted",
          limit: limits.maxAIRequests,
          current: currentUsage.aiRequestsThisMonth,
        };

      case "scraping":
        if (limits.maxScrapingRequests === -1)
          return {
            canUse: true,
            message: "Unlimited",
            limit: -1,
            current: currentUsage.scrapingRequestsThisMonth,
          };
        return {
          canUse:
            currentUsage.scrapingRequestsThisMonth < limits.maxScrapingRequests,
          message:
            currentUsage.scrapingRequestsThisMonth >= limits.maxScrapingRequests
              ? "Scraping limit reached for this month"
              : "Access granted",
          limit: limits.maxScrapingRequests,
          current: currentUsage.scrapingRequestsThisMonth,
        };

      case "advanced_analytics":
        return {
          canUse: limits.hasAdvancedAnalytics,
          message: limits.hasAdvancedAnalytics
            ? "Access granted"
            : "Advanced analytics requires Silver plan or higher",
          limit: limits.hasAdvancedAnalytics ? 1 : 0,
          current: limits.hasAdvancedAnalytics ? 1 : 0,
        };

      case "api_access":
        return {
          canUse: limits.hasAPIAccess,
          message: limits.hasAPIAccess
            ? "Access granted"
            : "API access requires Gold plan",
          limit: limits.hasAPIAccess ? 1 : 0,
          current: limits.hasAPIAccess ? 1 : 0,
        };

      default:
        return {
          canUse: false,
          message: "Invalid feature type",
          limit: 0,
          current: 0,
        };
    }
  } catch (error) {
    console.error("Error checking feature access:", error);
    return {
      canUse: false,
      message: "Error checking access",
      limit: 0,
      current: 0,
    };
  }
};

/**
 * Reset monthly usage counters (should be called monthly via cron job)
 */
export const resetMonthlyUsage = async () => {
  try {
    await Subscription.updateMany(
      {},
      {
        $set: {
          "currentUsage.aiRequestsThisMonth": 0,
          "currentUsage.scrapingRequestsThisMonth": 0,
        },
      }
    );

    await User.updateMany(
      {},
      {
        $set: {
          "usageStats.aiRequestsThisMonth": 0,
          "usageStats.scrapingRequestsThisMonth": 0,
          "usageStats.leadsCreatedThisMonth": 0,
        },
      }
    );

    console.log("Monthly usage counters reset successfully");
    return true;
  } catch (error) {
    console.error("Error resetting monthly usage:", error);
    return false;
  }
};

/**
 * Get user's subscription status and usage summary
 * @param {string} userId - User ID
 * @returns {object} - Complete subscription and usage info
 */
export const getSubscriptionSummary = async (userId) => {
  try {
    const subscription = await Subscription.findOne({ userId }).populate(
      "userId",
      "firstName lastName email subscriptionPlan"
    );
    if (!subscription) return null;

    const { limits, currentUsage, plan, status } = subscription;

    // Calculate usage percentages
    const usagePercentages = {
      leads:
        limits.maxLeads === -1
          ? 0
          : Math.round((currentUsage.leadsCount / limits.maxLeads) * 100),
      competitors:
        limits.maxCompetitors === -1
          ? 0
          : Math.round(
              (currentUsage.competitorsCount / limits.maxCompetitors) * 100
            ),
      ai:
        limits.maxAIRequests === -1
          ? 0
          : Math.round(
              (currentUsage.aiRequestsThisMonth / limits.maxAIRequests) * 100
            ),
      scraping:
        limits.maxScrapingRequests === -1
          ? 0
          : Math.round(
              (currentUsage.scrapingRequestsThisMonth /
                limits.maxScrapingRequests) *
                100
            ),
    };

    // Check which limits are close to being reached (>80%)
    const warnings = [];
    if (usagePercentages.leads > 80) warnings.push("leads");
    if (usagePercentages.competitors > 80) warnings.push("competitors");
    if (usagePercentages.ai > 80) warnings.push("ai");
    if (usagePercentages.scraping > 80) warnings.push("scraping");

    return {
      subscription,
      usagePercentages,
      warnings,
      isTrialExpired:
        subscription.trialEndDate && new Date() > subscription.trialEndDate,
      daysUntilExpiry: subscription.endDate
        ? Math.ceil((subscription.endDate - new Date()) / (1000 * 60 * 60 * 24))
        : null,
    };
  } catch (error) {
    console.error("Error getting subscription summary:", error);
    return null;
  }
};

/**
 * Check if user's trial has expired
 * @param {string} userId - User ID
 * @returns {boolean} - True if trial has expired
 */
export const isTrialExpired = async (userId) => {
  try {
    const subscription = await Subscription.findOne({ userId });
    if (!subscription || !subscription.trialEndDate) return false;

    return new Date() > subscription.trialEndDate;
  } catch (error) {
    console.error("Error checking trial expiry:", error);
    return false;
  }
};

/**
 * Middleware to check if user can access premium features
 */
export const checkPremiumAccess = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({ userId: req.user._id });

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: "No subscription found",
        upgradeRequired: true,
      });
    }

    // Check if trial has expired and user is on free plan
    if (
      subscription.plan === "free" &&
      subscription.status === "trial" &&
      (await isTrialExpired(req.user._id))
    ) {
      return res.status(403).json({
        success: false,
        message: "Trial has expired. Please upgrade your plan.",
        trialExpired: true,
        upgradeRequired: true,
      });
    }

    req.subscription = subscription;
    next();
  } catch (error) {
    console.error("Error checking premium access:", error);
    res.status(500).json({
      success: false,
      message: "Error checking subscription access",
    });
  }
};
