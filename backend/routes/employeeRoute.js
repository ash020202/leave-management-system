import express from "express";
import {
  deleteEmployee,
  getAllEmployees,
  getOneEmployee,
  insertEmployees,
} from "../controllers/employeeController.js";

const router = express.Router();

router.get("/", getAllEmployees);
router.get("/user-fetch/:emp_id", getOneEmployee);
router.post("/insert-one", insertEmployees);
// router.post("/insert-many", bulkInsertEmployees);
router.delete("/delete-one", deleteEmployee);

export default router;
