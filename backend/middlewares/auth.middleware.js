import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import Subscription from "../models/Subscriptions.model.js";

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user || !req.user.isActive) {
      return res.status(401).json({ message: "User not found or inactive" });
    }

    next();
  } catch (error) {
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

// Role-based authorization
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role ${req.user.role} is not authorized to access this resource`,
      });
    }
    next();
  };
};

// Subscription-based access control
export const requireSubscription = (requiredPlan) => {
  return async (req, res, next) => {
    try {
      const subscription = await Subscription.findOne({ userId: req.user._id });

      if (!subscription) {
        return res.status(403).json({
          message: "No subscription found. Please upgrade your plan.",
          requiredPlan,
        });
      }

      const planHierarchy = { free: 0, silver: 1, gold: 2 };

      if (planHierarchy[subscription.plan] < planHierarchy[requiredPlan]) {
        return res.status(403).json({
          message: `This feature requires ${requiredPlan} plan or higher. Current plan: ${subscription.plan}`,
          currentPlan: subscription.plan,
          requiredPlan,
        });
      }

      req.subscription = subscription;
      next();
    } catch (error) {
      res.status(500).json({ message: "Error checking subscription" });
    }
  };
};

// Usage limit checker
export const checkUsageLimit = (featureType) => {
  return async (req, res, next) => {
    try {
      const subscription = await Subscription.findOne({ userId: req.user._id });

      if (!subscription) {
        return res.status(403).json({ message: "No subscription found" });
      }

      const { limits, currentUsage } = subscription;

      switch (featureType) {
        case "leads":
          if (currentUsage.leadsCount >= limits.maxLeads) {
            return res.status(403).json({
              message: `Lead limit reached (${limits.maxLeads}). Please upgrade your plan.`,
              limit: limits.maxLeads,
              current: currentUsage.leadsCount,
            });
          }
          break;

        case "competitors":
          if (currentUsage.competitorsCount >= limits.maxCompetitors) {
            return res.status(403).json({
              message: `Competitor tracking limit reached (${limits.maxCompetitors}). Please upgrade your plan.`,
              limit: limits.maxCompetitors,
              current: currentUsage.competitorsCount,
            });
          }
          break;

        case "ai":
          if (currentUsage.aiRequestsThisMonth >= limits.maxAIRequests) {
            return res.status(403).json({
              message: `AI request limit reached for this month (${limits.maxAIRequests}). Please upgrade your plan.`,
              limit: limits.maxAIRequests,
              current: currentUsage.aiRequestsThisMonth,
            });
          }
          break;

        case "scraping":
          if (
            currentUsage.scrapingRequestsThisMonth >= limits.maxScrapingRequests
          ) {
            return res.status(403).json({
              message: `Web scraping limit reached for this month (${limits.maxScrapingRequests}). Please upgrade your plan.`,
              limit: limits.maxScrapingRequests,
              current: currentUsage.scrapingRequestsThisMonth,
            });
          }
          break;
      }

      req.subscription = subscription;
      next();
    } catch (error) {
      res.status(500).json({ message: "Error checking usage limits" });
    }
  };
};

// Permission definitions for each role
export const PERMISSIONS = {
  admin: {
    leads: ["create", "read", "update", "delete", "export", "import", "assign"],
    users: ["create", "read", "update", "delete", "manage_roles"],
    competitors: ["create", "read", "update", "delete", "scrape"],
    ai: ["use", "view_history", "advanced_prompts"],
    analytics: ["view_all", "export", "advanced_metrics"],
    subscription: ["manage", "view_all_users", "billing"],
    system: ["configure", "backup", "logs"],
  },

  sales_manager: {
    leads: ["create", "read", "update", "delete", "export", "assign_team"],
    users: ["read_team", "update_team"],
    competitors: ["create", "read", "update", "scrape"],
    ai: ["use", "view_history", "team_insights"],
    analytics: ["view_team", "export_team"],
    subscription: ["view_own"],
    system: [],
  },

  sales_rep: {
    leads: ["create", "read_own", "update_own", "export_own"],
    users: ["read_own", "update_own"],
    competitors: ["read", "basic_scrape"],
    ai: ["use_basic", "view_own_history"],
    analytics: ["view_own"],
    subscription: ["view_own"],
    system: [],
  },

  viewer: {
    leads: ["read_assigned"],
    users: ["read_own"],
    competitors: ["read"],
    ai: [],
    analytics: ["view_basic"],
    subscription: ["view_own"],
    system: [],
  },
};

// Check specific permission
export const checkPermission = (resource, action) => {
  return (req, res, next) => {
    const userRole = req.user.role;
    const userPermissions = PERMISSIONS[userRole] || {};
    const resourcePermissions = userPermissions[resource] || [];

    if (!resourcePermissions.includes(action)) {
      return res.status(403).json({
        message: `Insufficient permissions. Required: ${resource}:${action}`,
        userRole,
        availablePermissions: resourcePermissions,
      });
    }

    next();
  };
};

// Subscription Plan Configurations
export const SUBSCRIPTION_PLANS = {
  free: {
    name: "Free",
    price: 0,
    limits: {
      maxLeads: 10,
      maxCompetitors: 2,
      maxAIRequests: 5,
      maxScrapingRequests: 10,
      hasAdvancedAnalytics: false,
      hasAPIAccess: false,
    },
    features: [
      "Basic CRM functionality",
      "Up to 10 leads",
      "Track 2 competitors",
      "5 AI requests per month",
      "Basic scraping",
    ],
  },

  silver: {
    name: "Silver",
    price: 29,
    limits: {
      maxLeads: 100,
      maxCompetitors: 10,
      maxAIRequests: 50,
      maxScrapingRequests: 100,
      hasAdvancedAnalytics: true,
      hasAPIAccess: false,
    },
    features: [
      "Everything in Free",
      "Up to 100 leads",
      "Track 10 competitors",
      "50 AI requests per month",
      "Advanced analytics",
      "Priority support",
    ],
  },

  gold: {
    name: "Gold",
    price: 99,
    limits: {
      maxLeads: -1, // unlimited
      maxCompetitors: -1, // unlimited
      maxAIRequests: 500,
      maxScrapingRequests: 1000,
      hasAdvancedAnalytics: true,
      hasAPIAccess: true,
    },
    features: [
      "Everything in Silver",
      "Unlimited leads",
      "Unlimited competitor tracking",
      "500 AI requests per month",
      "API access",
      "Custom integrations",
      "Dedicated support",
    ],
  },
};
