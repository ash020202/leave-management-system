import express from "express";
import {
  cancelLeave,
  changeLeaveStatus,
  checkLeaveBalance,
  getLeaveHistory,
  getManagerLeaveRequests,
  getPublicHolidays,
  submitLeave,
} from "../controllers/leaveController.js";
import {
  authenticate,
  authorize,
  checkOwnership,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/request",
  authenticate,
  authorize("INTERN", "EMPLOYEE", "SENIOR_MANAGER", "MANAGER"),
  submitLeave
);
router.get(
  "/manager/leaves/:emp_id",

  authenticate,
  authorize("SENIOR_MANAGER", "MANAGER"),
  checkOwnership,

  getManagerLeaveRequests
);
router.patch(
  "/status/:emp_id",
  authenticate,
  authorize("SENIOR_MANAGER", "MANAGER"),
  changeLeaveStatus
);
router.post(
  "/cancel/:emp_id",
  authenticate,
  authorize("INTERN", "EMPLOYEE", "SENIOR_MANAGER", "MANAGER"),
  cancelLeave
);
router.get(
  "/balance/:emp_id",
  authenticate,
  authorize("INTERN", "EMPLOYEE", "SENIOR_MANAGER", "MANAGER"),
  checkLeaveBalance
);

router.get(
  "/user/:emp_id",
  authenticate,
  authorize("INTERN", "EMPLOYEE", "SENIOR_MANAGER", "MANAGER"),
  getLeaveHistory
);

router.get(
  "/get-public-holidays",
  authenticate,
  authorize("INTERN", "EMPLOYEE", "SENIOR_MANAGER", "MANAGER"),
  getPublicHolidays
);

export default router;
