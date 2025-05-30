import { getEmployeeRepo } from "../repositories/EmployeeRepo.js";
import { getLeaveBalanceRepo } from "../repositories/LeaveBalanceRepo.js";
import { getLeaveReqRepo } from "../repositories/LeaveRequestRepo.js";
import CryptoJS from "crypto-js";
import { getLeaveTypeRepo } from "../repositories/LeaveTypeRepo.js";

// holidays.js
// utils/workingDays.js

export const calculateWorkingDays = (from_date, to_date, holidays = []) => {
  const start = new Date(from_date);
  const end = new Date(to_date);

  // Format all holidays to 'YYYY-MM-DD' and use a Set for faster lookup
  const holidaySet = new Set(
    holidays.map((date) => new Date(date).toISOString().split("T")[0])
  );

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
    console.error("Error fetching employee:", error);
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
    console.log("Assigned Manager ID being saved:", assignedManagerId);

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

    await getLeaveReqRepo.save(leave);
    return { duplicate: false, message: "Leave request inserted successfully" };
  } catch (error) {
    console.error("Insert Leave Error:", error);
    throw new Error("Failed to insert leave request");
  }
};
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
    await getLeaveBalanceRepo.save(leaveBalance);

    return leaveBalance.balance; // Return the updated balance
  } catch (error) {
    console.error("Error in updateLeaveBalance:", error);
    throw new Error("Failed to update leave balance");
  }
};

//for all emp leave history
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
    console.error("Error fetching leave requests:", error);
    throw new Error("Failed to fetch leave requests");
  }
};

export const getEmpLeaveHistory = async (emp_id) => {
  try {
    const leaveHistory = await getLeaveReqRepo.find({
      where: {
        employee: { emp_id }, // Match the employee's emp_id
      },
      relations: ["employee", "leaveType"], // Include relations to fetch employee and leaveType details
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
    }));
  } catch (error) {
    console.error("Error fetching leave history:", error);
    throw new Error("Failed to fetch leave history");
  }
};

export const leaveReqApproval = async (
  leave_req_id,
  newStatus,
  rejection_reason
) => {
  const leaveReq = await getLeaveReqRepo.findOneBy({ leave_req_id });
  if (!leaveReq) {
    throw new Error("Leave request not found");
  }
  // console.log(leaveReq);

  leaveReq.status = newStatus;
  leaveReq.rejection_reason =
    newStatus === "REJECTED" ? rejection_reason : null;

  return await getLeaveReqRepo.save(leaveReq);
};

export const cancelLeaveHelper = async (leave_req_id, emp_id) => {
  const leave = await getLeaveReqRepo.findOne({
    where: { leave_req_id },
    relations: ["employee", "leaveType"], // Include relations to fetch employee and leaveType
  });
  if (!leave) {
    throw { code: 404, message: "Leave request not found" };
  }
  console.log(leave.employee.emp_id, emp_id);

  if (leave.employee.emp_id !== parseInt(emp_id)) {
    throw {
      code: 403,
      message: "You are not authorized to cancel this leave",
    };
  }

  if (leave.status === "PENDING" || leave.status === "APPROVED") {
    leave.status = "CANCELLED";
    await getLeaveReqRepo.save(leave);
    return "Leave cancelled successfully";
  } else {
    throw {
      code: 400,
      message: "Only PENDING or APPROVED leaves can be cancelled",
    };
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
    console.error("Error in leaveBalanceHelper:", error);
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
    console.error("Error inserting employee:", error);
    throw new Error("Insert failed");
  }
};
