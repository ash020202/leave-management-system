import express from "express";
import {
  deleteEmployee,
  getAllEmployees,
  getLeaveBalance,
  getOneEmployee,
  insertEmployees,
} from "../controllers/employeeController.js";

const router = express.Router();

router.get("/", getAllEmployees);
router.get("/user-fetch/:emp_id", getLeaveBalance);
router.post("/insert-one", insertEmployees);
router.delete("/delete-one", deleteEmployee);

export default router;
