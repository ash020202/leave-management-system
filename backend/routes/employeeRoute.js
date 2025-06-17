import express from "express";
import {
  bulkinsertEmp,
  deleteEmployee,
  getAllEmployees,
  getUserLeaveBalance,
  insertEmployees,
} from "../controllers/employeeController.js";

const router = express.Router();

router.get("/", getAllEmployees);
router.post("/", insertEmployees);
router.post("/bulk-insert", bulkinsertEmp);
router.get("/user-fetch/:emp_id", getUserLeaveBalance);
router.delete("/user/:emp_id", deleteEmployee);

export default router;
