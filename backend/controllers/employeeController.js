import { findEmpById, insertEmpHelper } from "../utils/Helper.js";
import { AppDataSource } from "../db/data-source.js";
import { Employee } from "../models/Employees.js";
import logger from "../utils/logger.js";

const getEmployeeRepo = AppDataSource.getRepository(Employee);

export const getAllEmployees = async (req, res) => {
  try {
    const employees = await getEmployeeRepo.find();
    logger.info("success fetching employees");
    return res.json(employees);
  } catch (error) {
    logger.error("Error fetching employees:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const insertEmployees = async (req, res) => {
  const {
    emp_name,
    department,
    role,
    manager_id,
    manager_name,
    sr_manager_id,
    sr_manager_name,
    total_leave_balance,
    sick_leave,
    floater_leave,
    earned_leave,
    loss_of_pay,
  } = req.body;
  try {
    await insertEmpHelper(
      emp_name,
      department,
      role,
      manager_id,
      manager_name,
      sr_manager_id,
      sr_manager_name,
      total_leave_balance,
      sick_leave,
      floater_leave,
      earned_leave,
      loss_of_pay
    );
    logger.info("leave inserted successfully");
    return res.status(200).json({ message: "success inserted" });
  } catch (error) {
    logger.error("error in insert helper");
    return res.json({ message: "error in insert helper" });
  }
};

export const deleteEmployee = async (req, res) => {
  const { emp_id } = req.body;
  try {
    const deleteEmp = await getEmployeeRepo.delete({ emp_id });
    if (deleteEmp.affected === 0) {
      throw new Error("Employee not found");
    }
    logger.info("delete employee success");
    return res.status(200).json({ message: `deleted emp id: ${emp_id}` });
  } catch (error) {
    logger.error("error in delete");
    return res.json({ message: "error in delete" });
  }
};

export const getOneEmployee = async (req, res) => {
  const { emp_id } = req.params;
  try {
    const employee = await findEmpById(emp_id);
    return res.status(200).json(employee);
  } catch (error) {
    logger.error("single emp fetech failed", error);
    console.log(error);
    return res.json({ message: "error in single emp fetch" });
  }
};
