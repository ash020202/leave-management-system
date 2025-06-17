import { insertEmpHelper } from "../utils/Helper.js";
import { AppDataSource } from "../db/data-source.js";
import { Employee } from "../models/Employees.js";
import logger from "../utils/logger.js";
import { getLeaveBalanceRepo } from "../repositories/LeaveBalanceRepo.js";
import { EmployeeIDParams } from "../validators/common/EmployeeIDParams.js";
import { redisConnection } from "../db/redis.js";
import { Queue } from "bullmq";
const getEmployeeRepo = AppDataSource.getRepository(Employee);
const employeeQueue = new Queue("employee-bulk-upload", {
  connection: redisConnection,
});
export const getAllEmployees = async (req, res) => {
  try {
    const employees = await getEmployeeRepo.find();
    logger.info(
      "employee-controller-getAllEmployees: success fetching employees"
    );
    return res.status(200).json(employees);
  } catch (error) {
    logger.error(
      "employee-controller-getAllEmployees: Error fetching employees: ",
      error
    );
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const insertEmployees = async (req, res) => {
  const { emp_name, department, role, manager_id, total_leave_balance } =
    req.body;

  try {
    const result = await insertEmpHelper(
      emp_name,
      department,
      role,
      manager_id,
      total_leave_balance
    );

    logger.info(
      "employee-controller-insertEmployees: Employee inserted successfully"
    );
    return res.status(200).json(result);
  } catch (error) {
    logger.error(
      "employee-controller-insertEmployees: Error in insert helper: ",
      error
    );
    return res.status(500).json({ message: "Error inserting employee" });
  }
};

export const bulkinsertEmp = async (req, res) => {
  try {
    const bulkData = req.body.employees;
    await employeeQueue.add("bulkInsert", { data: bulkData }); // enqueue job
    logger.info(
      "employee-controller-bulkinsertEmp: Upload queued for processing"
    );
    return res.status(202).json({ message: "Upload queued for processing" });
  } catch (error) {
    logger.error(
      "employee-controller-bulkinsertEmp: error adding job to worker",
      error
    );
    return res.status(500).json({ message: "error adding job to worker" });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const { emp_id } = await EmployeeIDParams.validateAsync(req.params);
    const deleteEmp = await getEmployeeRepo.delete({ emp_id });
    if (deleteEmp.affected === 0) {
      logger.error("employee-controller-deleteEmployee: employee not found ");
      throw new Error("Employee not found");
    }
    logger.info(
      `employee-controller-deleteEmployee: delete employee ${emp_id} success`
    );
    return res.status(200).json({ message: `deleted emp id: ${emp_id}` });
  } catch (error) {
    if (error.isJoi) {
      // Handle Joi validation errors
      return res.status(400).json({ error: error.details[0].message });
    }
    logger.error("employee-controller-deleteEmployee: error in delete", error);
    return res.status(500).json({ message: "error in delete" });
  }
};

export const getUserLeaveBalance = async (req, res) => {
  try {
    const { emp_id } = await EmployeeIDParams.validateAsync(req.params);
    // Fetch employee details
    const employee = await getEmployeeRepo.findOne({
      where: { emp_id },
      relations: ["manager", "manager.manager"], // Include manager and senior manager relations
    });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Fetch leave balances for the employee
    const leaveBalances = await getLeaveBalanceRepo.find({
      where: { employee: { emp_id } },
      relations: ["leaveType"], // Include leaveType relation
    });

    // Map leave balances to leave type names
    const balances = {};
    leaveBalances.forEach((lb) => {
      balances[lb.leaveType.name] = lb.balance;
    });

    // Format the response
    const response = {
      emp_id: employee.emp_id,
      emp_name: employee.emp_name,
      department: employee.department,
      role: employee.role,
      // total_leave_balance: Object.values(balances).reduce((a, b) => a + b, 0),
      total_leave_balance: employee.total_leave_balance,
      manager_name: employee.manager?.emp_name || "N/A",
      sr_manager_name: employee.manager?.manager?.emp_name || "N/A",
      ...balances, // Include individual leave balances
    };
    logger.info(
      "employee-controller-getUserLeaveBalance: fetched user leave balance successfully"
    );
    return res.status(200).json(response);
  } catch (error) {
    if (error.isJoi) {
      // Handle Joi validation errors
      return res.status(400).json({ error: error.details[0].message });
    }
    logger.error(
      "employee-controller-getUserLeaveBalance: unable to fetch user leave balance",
      error
    );
    return res.status(500).json({ message: "Failed to fetch leave balance" });
  }
};
