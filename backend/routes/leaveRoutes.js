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
import { EmployeeConstants } from "../constants/EmployeeConstants.js";

const router = express.Router();

router.post(
  "/request",
  authenticate,
  authorize(
    EmployeeConstants.EMPLOYEE_ROLES.INTERN,
    EmployeeConstants.EMPLOYEE_ROLES.EMPLOYEE,
    EmployeeConstants.EMPLOYEE_ROLES.MANAGER,
    EmployeeConstants.EMPLOYEE_ROLES.SENIOR_MANAGER
  ),
  submitLeave
);
router.get(
  "/manager/leaves/:emp_id",

  authenticate,
  authorize(
    EmployeeConstants.EMPLOYEE_ROLES.MANAGER,
    EmployeeConstants.EMPLOYEE_ROLES.SENIOR_MANAGER
  ),
  checkOwnership,

  getManagerLeaveRequests
);
router.patch(
  "/status/:emp_id",
  authenticate,
  authorize(
    EmployeeConstants.EMPLOYEE_ROLES.MANAGER,
    EmployeeConstants.EMPLOYEE_ROLES.SENIOR_MANAGER
  ),
  changeLeaveStatus
);
router.post(
  "/cancel/:emp_id",
  authenticate,
  authorize(
    EmployeeConstants.EMPLOYEE_ROLES.INTERN,
    EmployeeConstants.EMPLOYEE_ROLES.EMPLOYEE,
    EmployeeConstants.EMPLOYEE_ROLES.MANAGER,
    EmployeeConstants.EMPLOYEE_ROLES.SENIOR_MANAGER
  ),
  cancelLeave
);
router.get(
  "/balance/:emp_id",
  authenticate,
  authorize(
    EmployeeConstants.EMPLOYEE_ROLES.INTERN,
    EmployeeConstants.EMPLOYEE_ROLES.EMPLOYEE,
    EmployeeConstants.EMPLOYEE_ROLES.MANAGER,
    EmployeeConstants.EMPLOYEE_ROLES.SENIOR_MANAGER
  ),
  checkLeaveBalance
);

router.get(
  "/user/:emp_id",
  authenticate,
  authorize(
    EmployeeConstants.EMPLOYEE_ROLES.INTERN,
    EmployeeConstants.EMPLOYEE_ROLES.EMPLOYEE,
    EmployeeConstants.EMPLOYEE_ROLES.MANAGER,
    EmployeeConstants.EMPLOYEE_ROLES.SENIOR_MANAGER
  ),
  getLeaveHistory
);

router.get(
  "/get-public-holidays",
  authenticate,
  authorize(
    EmployeeConstants.EMPLOYEE_ROLES.INTERN,
    EmployeeConstants.EMPLOYEE_ROLES.EMPLOYEE,
    EmployeeConstants.EMPLOYEE_ROLES.MANAGER,
    EmployeeConstants.EMPLOYEE_ROLES.SENIOR_MANAGER
  ),
  getPublicHolidays
);

export default router;
