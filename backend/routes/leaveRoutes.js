import express from "express";
import {
  cancelLeave,
  changeLeaveStatus,
  checkLeaveBalance,
  getApprovedOrRejectedLevController,
  getLeaveHistory,
  getManagerPendingLeaveRequests,
  getPublicHolidays,
  submitLeave,
  trackLeave,
} from "../controllers/leaveController.js";
import {
  authenticate,
  authorize,
  checkOwnership,
} from "../middleware/authMiddleware.js";
import { EmployeeConstants } from "../constants/EmployeeConstants.js";

const router = express.Router();

//manager fetch pending leave
router.get(
  "/manager/leaves/:emp_id",

  authenticate,
  authorize(
    EmployeeConstants.EMPLOYEE_ROLES.MANAGER,
    EmployeeConstants.EMPLOYEE_ROLES.SENIOR_MANAGER
  ),
  checkOwnership,

  getManagerPendingLeaveRequests
);

// manager leave status update,
router.patch(
  "/status/:emp_id",
  authenticate,
  authorize(
    EmployeeConstants.EMPLOYEE_ROLES.MANAGER,
    EmployeeConstants.EMPLOYEE_ROLES.SENIOR_MANAGER
  ),
  changeLeaveStatus
);

//fetch approved,rejected leaves for manager
router.get(
  "/manager/approved-rejected-leaves/:emp_id",
  authenticate,
  authorize(
    EmployeeConstants.EMPLOYEE_ROLES.MANAGER,
    EmployeeConstants.EMPLOYEE_ROLES.SENIOR_MANAGER
  ),
  checkOwnership,
  getApprovedOrRejectedLevController
);

//employee leave request
router.post("/request", authenticate, authorize(), submitLeave);

//employee cancel leave
router.post("/cancel/:emp_id", authenticate, authorize(), cancelLeave);

//emp leave balance
router.get("/balance/:emp_id", authenticate, authorize(), checkLeaveBalance);

//emp leave history
router.get("/user/:emp_id", authenticate, authorize(), getLeaveHistory);

//fetch public holidays
router.get("/public-holidays", authenticate, authorize(), getPublicHolidays);

//trach leave approval flow
router.get("/track/:leave_req_id", authenticate, authorize(), trackLeave);

export default router;
