import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
  changePassword,
  forgotPassword,
  getMe,
  getSubscriptionPlans,
  login,
  logout,
  register,
  resetPassword,
  updateProfile,
  upgradeSubscription,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.get("/me", protect, getMe);
router.get("/plans", getSubscriptionPlans);

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);

router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);
router.put("/reset-password/:token", resetPassword);
router.put("/upgrade", protect, upgradeSubscription);

export default router;
