import { getEmployeeRepo } from "../repositories/EmployeeRepo.js";
import { getLeaveBalanceRepo } from "../repositories/LeaveBalanceRepo.js";
import { getLeaveReqRepo } from "../repositories/LeaveRequestRepo.js";
import CryptoJS from "crypto-js";
import { LeaveConstants } from "../constants/LeaveConstants.js";
import { getLeavePolicyRepo } from "../repositories/LeavePolicyRepo.js";
import { ApprovalFlowRepo } from "../repositories/ApprovalFlowRepo.js";
import logger from "./logger.js";

export const calculateWorkingDays = (
  from_date,
  to_date,
  holidays = [],
  leaveType = ""
) => {
  const start = new Date(from_date);
  const end = new Date(to_date);
  // console.log(leaveType);

  const floaterSet = new Set(LeaveConstants.FLOATER_LEAVE);
  // const cleanHolidays = holidaySet.filter((h) => !floaterSet.has(h));
  const holidaySet = new Set(
    holidays
      .map((date) => new Date(date).toISOString().split("T")[0])
      .filter((d) =>
        leaveType === LeaveConstants.LEAVE_TYPES.FLOATER_LEAVE
          ? !floaterSet.has(d) // Ignore floater days from holidays for floater leave
          : true
      )
  );
  // console.log("Holiday Set:", holidaySet);

  let totalDays = 0;
  let allDaysInvalid = true;

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const day = d.getDay(); // 0 = Sunday, 6 = Saturday
    const dateStr = d.toISOString().split("T")[0];

    const isWeekend = day === 0 || day === 6;
    const isHoliday = holidaySet.has(dateStr);

    // console.log("Checking date:", dateStr, "is holiday:", isHoliday);

    if (!isWeekend && !isHoliday) {
      totalDays++;
      allDaysInvalid = false;
    }
  }

  return { totalDays, allDaysInvalid };
};

export const decryptPassword = (encryptedPassword) => {
  const secretKey = process.env.PWD_SECRET_KEY;
  const bytes = CryptoJS.AES.decrypt(encryptedPassword, secretKey);
  const originalPassword = bytes.toString(CryptoJS.enc.Utf8);
  // console.log(originalPassword);

  return originalPassword;
};

export const findEmpById = async (emp_id) => {
  try {
    const employee = await getEmployeeRepo.findOne({
      where: { emp_id },
      relations: ["manager", "manager.manager"], // Load manager and senior manager relations
    });

    return employee;
  } catch (error) {
    logger.error("Helper-findEmpById-Error: error fetching employee:", error);
    throw new Error("Failed to fetch employee");
  }
};

export const insertLeaveRequest = async (
  emp_id,
  leave_type_id,
  from_date,
  to_date,
  reason,
  leaveStatus,
  assignedManagerId,
  totalDays
) => {
  try {
    const checkDuplicate = await getLeaveReqRepo.findOneBy({
      employee: { emp_id },
      from_date,
      to_date,
    });

    if (
      checkDuplicate &&
      from_date === checkDuplicate.from_date &&
      to_date === checkDuplicate.to_date
    ) {
      return {
        duplicate: true,
        message: `Leave already exists for the selected date range (${from_date} to ${to_date}).`,
      };
    }
    // console.log("Assigned Manager ID being saved:", assignedManagerId);

    const leave = getLeaveReqRepo.create({
      employee: { emp_id }, // Reference the employee entity
      leaveType: { leave_type_id }, // Reference the leave type entity
      from_date,
      to_date,
      reason,
      status: leaveStatus,
      num_of_days: totalDays,
      manager_id: assignedManagerId, // Save the assigned manager ID
    });

    const savedLeave = await getLeaveReqRepo.save(leave);
    logger.info("Helper-insertLeaveRequest: leave inserted successfully");
    return {
      duplicate: false,
      leave_req_id: savedLeave.leave_req_id,
      message: "Leave request inserted successfully",
    };
  } catch (error) {
    logger.error("Insert Leave Error:", error);
    throw new Error("Failed to insert leave request");
  }
};

export async function fetchHolidaysForDateRange(from_date, to_date) {
  const fromYear = new Date(from_date).getFullYear();
  const toYear = new Date(to_date).getFullYear();
  const years = new Set();

  for (let year = fromYear; year <= toYear; year++) {
    years.add(year);
  }

  let allHolidays = [];
  for (let year of years) {
    const holidays = await fetchIndianHolidays(year);
    const formattedHolidays = holidays.map(
      (h) => new Date(h).toISOString().split("T")[0]
    );
    allHolidays.push(...formattedHolidays);
  }

  return allHolidays;
}

// Helper function to determine leave status
export function getLeaveStatus(leaveTypeName) {
  return leaveTypeName === LeaveConstants.LEAVE_TYPES.SICK_LEAVE
    ? LeaveConstants.LEAVE_STATUS.APPROVED
    : LeaveConstants.LEAVE_STATUS.PENDING;
}

// Helper function to create approval flow entries
export async function createApprovalFlowEntries(
  leaveRequestId,
  employee,
  leaveTypeName,
  hasSufficientBalance
) {
  try {
    // Skip approval flow for sick leave
    if (leaveTypeName === LeaveConstants.LEAVE_TYPES.SICK_LEAVE) {
      const approvalFlowEntry = ApprovalFlowRepo.create({
        leaveRequest: leaveRequestId,
        approver: employee.manager.emp_id,
        status: LeaveConstants.LEAVE_STATUS.APPROVED,
        remarks:
          "auto approved your sick leave - your manager has been notified about your leave",
      });
      await ApprovalFlowRepo.save(approvalFlowEntry);
      // console.log("sick leave approval entry done");
      return;
    }

    if (hasSufficientBalance) {
      // Single manager approval for sufficient balance
      const approvalFlowEntry = ApprovalFlowRepo.create({
        leaveRequest: leaveRequestId,
        approver: employee.manager.emp_id,
        status: LeaveConstants.LEAVE_STATUS.PENDING,
        remarks: "Pending manager approval - sufficient balance",
      });
      await ApprovalFlowRepo.save(approvalFlowEntry);
    } else {
      // Manager approval entry for insufficient balance
      if (employee.manager?.emp_id) {
        const managerApprovalEntry = ApprovalFlowRepo.create({
          leaveRequest: leaveRequestId,
          approver: employee.manager.emp_id,
          status: LeaveConstants.LEAVE_STATUS.PENDING,
          remarks: "Pending manager approval - insufficient balance",
        });
        await ApprovalFlowRepo.save(managerApprovalEntry);
      }

      // Senior manager approval entry for insufficient balance
      if (employee.manager?.manager?.emp_id) {
        const seniorManagerApprovalEntry = ApprovalFlowRepo.create({
          leaveRequest: leaveRequestId,
          approver: employee.manager.manager.emp_id,
          status: LeaveConstants.LEAVE_STATUS.PENDING_SENIOR_MANAGER,
          remarks: "Pending senior manager approval - insufficient balance",
        });
        await ApprovalFlowRepo.save(seniorManagerApprovalEntry);
      }
    }
  } catch (error) {
    logger.error(
      "Helper-createApprovalFlowEntries: Error updating leave balance:",
      error
    );
    throw new Error("Failed to submit leave request");
  }
}

// Helper function to generate response message
export function generateResponseMessage(
  leaveTypeName,
  totalDays,
  hasSufficientBalance
) {
  if (hasSufficientBalance) {
    return leaveTypeName === LeaveConstants.LEAVE_TYPES.SICK_LEAVE
      ? `${leaveTypeName} leave approved and ${totalDays} days deducted from balance.`
      : `${leaveTypeName} leave request sent to manager for ${totalDays} days.`;
  } else {
    return `${leaveTypeName} leave balance insufficient. Leave request forwarded to Manager Approval -> Senior Manager.`;
  }
}

export const updateLeaveBalance = async (emp_id, leave_type_id, totalDays) => {
  try {
    // Fetch the leave balance for the employee and leave type
    const leaveBalance = await getLeaveBalanceRepo.findOne({
      where: {
        employee: { emp_id },
        leaveType: { leave_type_id },
      },
      relations: ["employee", "leaveType"],
    });

    if (!leaveBalance) {
      throw new Error("Leave balance not found for the specified leave type");
    }

    // Deduct the leave days from the balance
    leaveBalance.balance -= totalDays;
    leaveBalance.employee.total_leave_balance -= totalDays; // Update the total leave balance

    if (leaveBalance.balance < 0) {
      throw new Error("Insufficient leave balance");
    }

    // Save the updated leave balance
    await getEmployeeRepo.save(leaveBalance.employee); // Save the employee to update total_leave_balance
    await getLeaveBalanceRepo.save(leaveBalance);

    return leaveBalance.balance; // Return the updated balance
  } catch (error) {
    logger.error(
      "Helper-updateLeaveBalance: Error in updateLeaveBalance:",
      error
    );
    throw new Error("Failed to update leave balance");
  }
};

//fetch emp leave requests to manager helper
export const getLeaveRequests = async (manager_id) => {
  try {
    const leaveRequests = await getLeaveReqRepo.find({
      where: {
        manager_id: manager_id, // Match manager_id directly
        // status: "PENDING", // Fetch only pending leave requests
      },
      relations: ["employee", "leaveType"], // Include employee and leaveType relations
      order: {
        created_at: "DESC", // Order by creation date
      },
    });

    // Map the results to include necessary details
    return leaveRequests.map((lr) => ({
      leave_req_id: lr.leave_req_id,
      emp_id: lr.employee.emp_id,
      emp_name: lr.employee.emp_name,
      leave_type: lr.leaveType.name, // Use leave type name
      from_date: lr.from_date,
      to_date: lr.to_date,
      reason: lr.reason,
      status: lr.status,
      num_of_days: lr.num_of_days,
      created_at: lr.created_at,
    }));
  } catch (error) {
    logger.error(
      "Helper-getLeaveRequests: Error fetching leave requests:",
      error
    );
    throw new Error("Failed to fetch leave requests");
  }
};

export const getEmpLeaveHistory = async (emp_id) => {
  try {
    const leaveHistory = await getLeaveReqRepo.find({
      where: {
        employee: { emp_id }, // Match the employee's emp_id
      },
      relations: ["employee", "leaveType", "manager"], // Include relations to fetch employee and leaveType details
      order: {
        created_at: "DESC", // Order by creation date (most recent first)
      },
    });

    // Map the results to match the desired response format
    return leaveHistory.map((leave) => ({
      leave_req_id: leave.leave_req_id,
      emp_id: leave.employee.emp_id,
      leave_type: leave.leaveType.name, // Use leave type name
      from_date: leave.from_date,
      to_date: leave.to_date,
      reason: leave.reason,
      status: leave.status,
      rejection_reason: leave.rejection_reason,
      created_at: leave.created_at,
      emp_name: leave.employee.emp_name, // Include employee name
      approved_by: leave.manager.emp_name, // Include manager ID who approved the leave
    }));
  } catch (error) {
    logger.error(
      "Helper-getEmpLeaveHistory: Error fetching leave history:",
      error
    );
    throw new Error("Failed to fetch leave history");
  }
};

export const getApprovedOrRejectedLeaves = async (manager_id) => {
  try {
    const approvals = await ApprovalFlowRepo.find({
      where: { approver: { emp_id: manager_id } },
      relations: [
        "leaveRequest",
        "leaveRequest.employee",
        "leaveRequest.manager",
        "leaveRequest.leaveType",
      ],
      order: { created_at: "DESC" },
    });
    // console.log(approvals[0].leaveRequest.leaveType.name);

    // Format or filter data as needed before returning
    return approvals.map((approval) => ({
      leave_req_id: approval.leaveRequest.leave_req_id,
      leave_type: approval.leaveRequest.leaveType.name,
      emp_name: approval.leaveRequest.employee.emp_name,
      from_date: approval.leaveRequest.from_date,
      to_date: approval.leaveRequest.to_date,
      reason: approval.leaveRequest.reason,
      status: approval.leaveRequest.status,
      approval_status: approval.status,
      approver_id: approval.leaveRequest.employee.emp_id,
      approved_at: approval.created_at,
      remarks: approval.remarks,
    }));
  } catch (error) {
    logger.error("Helper-getApprovedOrRejectedLeaves: error", error);
    throw new Error("Helper-getApprovedOrRejectedLeaves-error");
  }
};

export const getApprovalTrailForLeave = async (leave_req_id) => {
  try {
    const trail = await ApprovalFlowRepo.find({
      where: {
        leaveRequest: { leave_req_id: leave_req_id },
      },
      relations: {
        approver: true,
      },
      order: {
        created_at: "ASC",
      },
    });

    return trail;
  } catch (error) {
    logger.error("Helper-getApprovalTrailForLeave: error", error);
  }
};

export const leaveReqApproval = async (
  leave_req_id,
  newStatus,
  rejection_reason
) => {
  try {
    const leaveReq = await getLeaveReqRepo.findOneBy({ leave_req_id });
    if (!leaveReq) {
      throw new Error("Leave request not found");
    }
    // console.log(leaveReq);

    leaveReq.status = newStatus;
    leaveReq.rejection_reason =
      newStatus === "REJECTED" ? rejection_reason : null;

    return await getLeaveReqRepo.save(leaveReq);
  } catch (error) {
    logger.error("Helper-leaveReqApproval: error", error);
  }
};

export const cancelLeaveHelper = async (leave_req_id, emp_id) => {
  try {
    const leave = await getLeaveReqRepo.findOne({
      where: { leave_req_id },
      relations: ["employee", "leaveType"], // Include relations to fetch employee and leaveType
    });
    if (!leave) {
      throw { code: 404, message: "Leave request not found" };
    }
    // console.log(leave.employee.emp_id, emp_id);

    if (leave.employee.emp_id !== parseInt(emp_id)) {
      throw {
        code: 403,
        message: "You are not authorized to cancel this leave",
      };
    }

    await ApprovalFlowRepo.delete({
      leaveRequest: { leave_req_id },
    });
    if (
      leave.status === LeaveConstants.LEAVE_STATUS.PENDING ||
      leave.status === LeaveConstants.LEAVE_STATUS.PENDING_SENIOR_MANAGER
    ) {
      leave.status = "CANCELLED";
      await getLeaveReqRepo.save(leave);
      return "Leave cancelled successfully";
    } else {
      throw {
        code: 400,
        message: "Only PENDING or APPROVED leaves can be cancelled",
      };
    }
  } catch (error) {
    logger.error("Helper-cancelLeaveHelper: error", error);
  }
};

export const leaveBalanceHelper = async (emp_id) => {
  try {
    const leaveBalances = await getLeaveBalanceRepo.find({
      where: { employee: { emp_id } },
      relations: ["leaveType"],
    });

    const balances = {};
    leaveBalances.forEach((lb) => {
      balances[lb.leaveType.name] = lb.balance; // Map leave type name to balance
    });
    // console.log("Leave Balances:", balances);

    return balances;
  } catch (error) {
    logger.error(
      "Helper-leaveBalanceHelper: Error in leaveBalanceHelper:",
      error
    );
    throw new Error("Failed to fetch leave balances");
  }
};

export const insertEmpHelper = async (
  emp_name,
  department,
  role,
  manager_id,
  total_leave_balance
) => {
  try {
    // Find the manager entity if a manager_id is provided
    const manager = manager_id
      ? await getEmployeeRepo.findOneBy({ emp_id: manager_id })
      : null;

    if (manager_id && !manager) {
      throw new Error("Manager not found");
    }

    // Create the employee entity
    const employee = getEmployeeRepo.create({
      emp_name,
      department,
      role,
      manager, // Assign the manager entity
      total_leave_balance,
    });

    // Save the employee
    const insertEmp = await getEmployeeRepo.save(employee);
    return { message: "Inserted successfully", employee: insertEmp };
  } catch (error) {
    logger.error("Helper-insertEmpHelper: Error inserting employee:", error);
    throw new Error("Insert failed");
  }
};

//cron job helper
export async function accumulateLeavesMonthly() {
  try {
    const employees = await getEmployeeRepo.find();

    for (const emp of employees) {
      const policies = await getLeavePolicyRepo.find({
        where: { employee_type: emp.role },
        relations: ["leaveType"],
      });

      let monthlyTotalAdd = 0;

      for (const policy of policies) {
        const existingBalance = await getLeaveBalanceRepo.findOne({
          where: {
            employee: { emp_id: emp.emp_id },
            leaveType: { leave_type_id: policy.leaveType.leave_type_id },
          },
          relations: ["employee", "leaveType"],
        });

        if (existingBalance) {
          const newBalance = Math.min(
            existingBalance.balance + policy.accrual_per_month,
            policy.max_days_per_year
          );
          monthlyTotalAdd += newBalance - existingBalance.balance;

          existingBalance.balance = newBalance;
          await getLeaveBalanceRepo.save(existingBalance);
        } else {
          const initialBalance = Math.min(
            policy.accrual_per_month,
            policy.max_days_per_year
          );

          monthlyTotalAdd += initialBalance;

          await getLeaveBalanceRepo.save({
            employee: emp,
            leaveType: policy.leaveType,
            balance: initialBalance,
          });
        }
      }

      // Add only if monthlyTotalAdd > 0
      if (monthlyTotalAdd > 0) {
        emp.total_leave_balance += monthlyTotalAdd;
        await getEmployeeRepo.save(emp);
      }

      console.log(
        `Updated total leave for ${emp.role} (ID: ${emp.emp_id}): +${monthlyTotalAdd}`
      );
    }

    console.log("Leave accumulation complete.");
  } catch (error) {
    logger.error("Helper-accumulateLeavesMonthly: error", error);
    throw error;
  }
}

export async function carryForwardLeaves() {
  try {
    // Get all leave balances with their related leave types and employees
    const leaveBalances = await getLeaveBalanceRepo.find({
      relations: ["leaveType", "employee"], // Assuming you have employee relation
    });

    // Group balances by employee to calculate total per employee
    const employeeBalanceMap = new Map();

    for (const bal of leaveBalances) {
      const isCarryforward = bal.leaveType.is_carry_forward;
      const employeeId = bal.employee.emp_id; // or bal.employee.id depending on your relation setup
      // console.log(employeeId);

      if (!isCarryforward) {
        // Reset balance for non-carry-forward leave types
        bal.balance = 0;
        console.log(
          `Reset balance for non-carry-forward leave: ${bal.leaveType.name} for employee ${employeeId}`
        );
      } else {
        console.log(
          `Carried forward leave: ${bal.leaveType.name} with balance ${bal.balance} for employee ${employeeId}`
        );
      }

      // Save the updated balance
      await getLeaveBalanceRepo.save(bal);

      // Calculate total balance per employee
      if (!employeeBalanceMap.has(employeeId)) {
        employeeBalanceMap.set(employeeId, 0);
      }
      employeeBalanceMap.set(
        employeeId,
        employeeBalanceMap.get(employeeId) + bal.balance
      );
    }

    // Update total_leave_balance in employees table
    for (const [employeeId, totalBalance] of employeeBalanceMap) {
      await getEmployeeRepo.update(
        { emp_id: employeeId }, // or { id: employeeId } depending on your primary key
        { total_leave_balance: totalBalance }
      );

      logger.info(
        `Updated total_leave_balance to ${totalBalance} for employee ${employeeId}`
      );
    }

    logger.info("Leave carryforward job completed successfully.");
  } catch (error) {
    logger.error(
      "Helper-carryForwardLeaves: Error in carryForwardLeaves:",
      error
    );
    throw error; // Re-throw to handle at higher level if needed
  }
}
