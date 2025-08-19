// routes/lead.routes.js
import express from "express";
import {
  protect,
  checkPermission,
  checkUsageLimit,
} from "../middlewares/auth.middleware.js";
// import * as leadController from "../controllers/lead.controller.js";

const router = express.Router();

router.use(protect);

// Create Lead
router.post(
  "/",
  checkPermission("leads", "create"),
  checkUsageLimit("leads"),
  leadController.createLead
);

// Read Leads (list + filters)
router.get("/", checkPermission("leads", "read"), leadController.getLeads);

// Read Single Lead
router.get(
  "/:id",
  checkPermission("leads", "read"),
  leadController.getLeadById
);

// Update Lead
router.put(
  "/:id",
  checkPermission("leads", "update"),
  leadController.updateLead
);

// Delete Lead
router.delete(
  "/:id",
  checkPermission("leads", "delete"),
  leadController.deleteLead
);

// Add Note
router.post(
  "/:id/notes",
  checkPermission("leads", "update"),
  leadController.addNote
);

// Change Status (pipeline move)
router.put(
  "/:id/status",
  checkPermission("leads", "update"),
  leadController.updateStatus
);

// Assign Lead (managers/admin only)
router.put(
  "/:id/assign",
  checkPermission("leads", "assign"),
  leadController.assignLead
);

export default router;
