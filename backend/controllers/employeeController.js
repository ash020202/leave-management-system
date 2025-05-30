import { findEmpById, insertEmpHelper } from "../utils/Helper.js";
import { AppDataSource } from "../db/data-source.js";
import { Employee } from "../models/Employees.js";
import logger from "../utils/logger.js";
import { getLeaveBalanceRepo } from "../repositories/LeaveBalanceRepo.js";

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

// export const insertEmployees = async (req, res) => {
//   const {
//     emp_name,
//     department,
//     role,
//     manager_id,
//     manager_name,
//     sr_manager_id,
//     sr_manager_name,
//     total_leave_balance,
//     sick_leave,
//     floater_leave,
//     earned_leave,
//     loss_of_pay,
//   } = req.body;
//   try {
//     await insertEmpHelper(
//       emp_name,
//       department,
//       role,
//       manager_id,
//       manager_name,
//       sr_manager_id,
//       sr_manager_name,
//       total_leave_balance,
//       sick_leave,
//       floater_leave,
//       earned_leave,
//       loss_of_pay
//     );
//     logger.info("leave inserted successfully");
//     return res.status(200).json({ message: "success inserted" });
//   } catch (error) {
//     logger.error("error in insert helper");
//     return res.json({ message: "error in insert helper" });
//   }
// };
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

    logger.info("Employee inserted successfully");
    return res.status(200).json(result);
  } catch (error) {
    logger.error("Error in insert helper:", error);
    return res.status(500).json({ message: "Error inserting employee" });
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

export const getLeaveBalance = async (req, res) => {
  const { emp_id } = req.params;

  try {
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
      total_leave_balance: Object.values(balances).reduce((a, b) => a + b, 0),
      manager_name: employee.manager?.emp_name || "N/A",
      sr_manager_name: employee.manager?.manager?.emp_name || "N/A",
      ...balances, // Include individual leave balances
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching leave balance:", error);
    return res.status(500).json({ message: "Failed to fetch leave balance" });
  }
};
