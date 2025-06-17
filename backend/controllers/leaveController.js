import { EmployeeConstants } from "../constants/EmployeeConstants.js";
import { LeaveConstants } from "../constants/LeaveConstants.js";
import { ApprovalFlowRepo } from "../repositories/ApprovalFlowRepo.js";
import { getEmployeeRepo } from "../repositories/EmployeeRepo.js";
import { getLeaveBalanceRepo } from "../repositories/LeaveBalanceRepo.js";
import { getLeaveReqRepo } from "../repositories/LeaveRequestRepo.js";
import { getLeaveTypeRepo } from "../repositories/LeaveTypeRepo.js";
import {
  calculateWorkingDays,
  cancelLeaveHelper,
  createApprovalFlowEntries,
  fetchHolidaysForDateRange,
  findEmpById,
  generateResponseMessage,
  getApprovalTrailForLeave,
  getApprovedOrRejectedLeaves,
  getEmpLeaveHistory,
  getLeaveRequests,
  getLeaveStatus,
  insertLeaveRequest,
  leaveBalanceHelper,
  updateLeaveBalance,
} from "../utils/Helper.js";
import {
  fetchIndianHolidays,
  fetchPublicHolidays,
} from "../utils/calendarHoliday.js";
import logger from "../utils/logger.js";
import { EmployeeIDParams } from "../validators/common/EmployeeIDParams.js";
import { CancelLeaveBodySchema } from "../validators/leave-request-validators/CancelLev.js";
import { ChangeLeaveStatusBodySchema } from "../validators/leave-request-validators/ChangeLevStatus.js";
import { LeaveReqSchema } from "../validators/leave-request-validators/LeaveReqSchema.js";

export const getPublicHolidays = async (req, res) => {
  const year = new Date().getFullYear();
  if (!year) {
    logger.error(
      "leave-controller-getPublicHolidays: Year is not defined in getPublicHolidays"
    );
    return res.status(400).json({ error: "Year is required" });
  }
  try {
    const holidays = await fetchPublicHolidays(year);
    if (holidays.length === 0) {
      logger.info(
        `leave-controller-getPublicHolidays: No holidays found for year ${year}`
      );
      return res
        .status(404)
        .json({ message: "No holidays found for this year" });
    }
    logger.info(
      `leave-controller-getPublicHolidays: Successfully fetched holidays for year ${year}`
    );
    return res.status(200).json(holidays.response.holidays);
  } catch (error) {
    logger.error(
      `leave-controller-getPublicHolidays: Error fetching public holidays for year ${year}: ${error}`
    );
    return res.status(500).json({ error: "Failed to fetch public holidays" });
  }
};

export const getFloaterHolidays = async (req, res) => {
  try {
    logger.info(
      "leave-controller-getFloaterHolidays: Fetching floater holidays"
    );
    const result = LeaveConstants.FLOATER_LEAVE;
    logger.info(
      "leave-controller-getFloaterHolidays: Successfully fetched floater holidays"
    );
    return res.status(200).json(result);
  } catch (error) {
    logger.error(
      `leave-controller-getFloaterHolidays: Error fetching floater holidays: ${error}`
    );
    return res
      .status(500)
      .json({ message: "failed to retrieve floater holidays list" });
  }
};

export const submitLeave = async (req, res) => {
  try {
    // Validate request body
    const { emp_id, leave_type_id, from_date, to_date, reason } =
      await LeaveReqSchema.validateAsync(req.body, {
        abortEarly: false,
        convert: false,
      });

    // Fetch employee and leave type
    logger.info(
      `leave-controller-submitLeave: Fetching employee with id ${emp_id}`
    );
    const employee = await findEmpById(emp_id);
    if (!employee) {
      logger.error(
        `leave-controller-submitLeave: Employee not found for id ${emp_id}`
      );
      return res.status(404).json({ error: "Employee not found" });
    }

    logger.info(
      `leave-controller-submitLeave: Fetching leave type with id ${leave_type_id}`
    );
    const leaveType = await getLeaveTypeRepo.findOneBy({ leave_type_id });
    if (!leaveType) {
      logger.error(
        `leave-controller-submitLeave: Leave type not found for id ${leave_type_id}`
      );
      return res.status(404).json({ error: "Leave type not found" });
    }

    // Validate floater leave dates
    if (leaveType.name === LeaveConstants.LEAVE_TYPES.FLOATER_LEAVE) {
      const floaterLeaves = LeaveConstants.FLOATER_LEAVE.map((f) => f.date);
      if (
        !floaterLeaves.includes(from_date) ||
        !floaterLeaves.includes(to_date)
      ) {
        logger.error(
          "leave-controller-submitLeave: Invalid floater leave dates"
        );
        return res.status(400).json({
          error:
            "Floater leave can only be applied for certain dates. kindly view floater holidays and apply .",
        });
      }
    }

    // Get leave balance and calculate working days
    const leaveBalance = await leaveBalanceHelper(emp_id);
    const leaveCount = leaveBalance[leaveType.name];

    // For floater leave, override totalDays = 1 (only single-day leave allowed)

    const allHolidays = await fetchIndianHolidays(from_date, to_date);
    let { totalDays, allDaysInvalid } = calculateWorkingDays(
      from_date,
      to_date,
      allHolidays,
      leaveType.name
    );

    if (leaveType.name === LeaveConstants.LEAVE_TYPES.FLOATER_LEAVE) {
      totalDays = 1;
    }
    // Validate working days (except for floater leave)
    if (
      leaveType.name !== LeaveConstants.LEAVE_TYPES.FLOATER_LEAVE &&
      (allDaysInvalid || totalDays === 0)
    ) {
      logger.error(
        "leave-controller-submitLeave: Leave cannot be applied for weekends or public holidays only"
      );
      return res.status(400).send({
        error: "Leave cannot be applied for weekends or public holidays only.",
      });
    }

    // Determine leave status and assigned manager
    const assignedManagerId = employee.manager?.emp_id || null;
    const leaveStatus = getLeaveStatus(leaveType.name);

    if (!assignedManagerId) {
      logger.error(
        "leave-controller-submitLeave: No manager or senior manager found to approve the leave request"
      );
      return res.status(400).send({
        error:
          "No manager or senior manager found to approve the leave request.",
      });
    }

    // Insert leave request
    const insertResult = await insertLeaveRequest(
      emp_id,
      leaveType.leave_type_id,
      from_date,
      to_date,
      reason,
      leaveStatus,
      assignedManagerId,
      totalDays
    );

    // Handle duplicate leave request
    if (
      insertResult.message?.toLowerCase().includes("already exists") ||
      insertResult.duplicate
    ) {
      logger.error(
        `leave-controller-submitLeave: Duplicate leave request: ${insertResult.message}`
      );
      return res.status(400).send({ error: insertResult.message });
    }

    const leaveRequestId = insertResult?.leave_req_id;
    const hasSufficientBalance = leaveCount >= totalDays;

    // Create approval flow entries
    await createApprovalFlowEntries(
      leaveRequestId,
      employee,
      leaveType.name,
      hasSufficientBalance
    );

    // Handle sick leave balance update
    let remainingLeave = 0;
    if (
      leaveCount >= totalDays &&
      leaveType.name === LeaveConstants.LEAVE_TYPES.SICK_LEAVE
    ) {
      try {
        remainingLeave = await updateLeaveBalance(
          emp_id,
          leaveType.leave_type_id,
          totalDays
        );
      } catch (error) {
        logger.error(
          `leave-controller-submitLeave: Error updating leave balance: ${error}`
        );
        console.error("Error updating leave balance:", error);
        return res
          .status(500)
          .send({ error: "Failed to update leave balance" });
      }
    }

    // Generate response message
    const message = generateResponseMessage(
      leaveType.name,
      totalDays,
      hasSufficientBalance
    );

    return res.status(200).send({ message, remainingLeave });
  } catch (err) {
    if (err.isJoi) {
      return res.status(400).json({ error: err.details[0].message });
    }
    logger.error(
      `leave-controller-submitLeave: Error processing leave request: ${err}`
    );
    return res.status(500).send({ error: "Unexpected server error" });
  }
};

export const getManagerPendingLeaveRequests = async (req, res) => {
  try {
    const { emp_id } = await EmployeeIDParams.validateAsync(req.params);

    const manager_id = Number(emp_id);
    logger.info(
      `leave-controller-getManagerPendingLeaveRequests: Fetching pending leave requests for manager_id ${manager_id}`
    );
    const leaveRequests = await getLeaveRequests(manager_id);
    if (leaveRequests.length === 0) {
      return res.status(200).json({ message: "No Pending Leave Request" });
    }
    return res.status(200).json(leaveRequests);
  } catch (error) {
    if (error.isJoi) {
      // Handle Joi validation errors
      return res.status(400).json({ error: error.details[0].message });
    }
    logger.error(
      `leave-controller-getManagerPendingLeaveRequests: Error fetching leave requests: ${error}`
    );
    return res.status(500).send("Error fetching leave requests");
  }
};
export const getApprovedOrRejectedLevController = async (req, res) => {
  try {
    const { emp_id } = req.params;
    const result = await getApprovedOrRejectedLeaves(emp_id);
    return res.status(200).json(result);
  } catch (error) {
    logger.error(
      `leave-controller-getApprovedOrRejectedLevController: `,
      error
    );
    return res.status(500).json(error);
  }
};
export const trackLeave = async (req, res) => {
  try {
    const { leave_req_id } = req.params;
    const result = await getApprovalTrailForLeave(leave_req_id);
    return res.status(200).json(result);
  } catch (error) {
    logger.error(`leave-controller-trackLeave: `, error);
    return res.status(400).json(error);
  }
};

export const changeLeaveStatus = async (req, res) => {
  try {
    const paramValues = await EmployeeIDParams.validateAsync(req.params);
    const bodyValues = await ChangeLeaveStatusBodySchema.validateAsync(
      req.body,
      {
        abortEarly: false,
        convert: false,
      }
    );

    const emp_id = paramValues.emp_id;
    const { newStatus, leave_req_id, rejection_reason } = bodyValues;

    const approver = await findEmpById(emp_id);
    if (!approver) {
      logger.error(
        `leave-controller-changeLeaveStatus: Approver not found for id ${emp_id}`
      );
      return res.status(404).json({ message: "Approver not found" });
    }
    if (
      approver.role !== EmployeeConstants.EMPLOYEE_ROLES.MANAGER &&
      approver.role !== EmployeeConstants.EMPLOYEE_ROLES.SENIOR_MANAGER
    ) {
      logger.error(
        `leave-controller-changeLeaveStatus: Unauthorized role for emp_id ${emp_id}`
      );
      return res.status(403).json({
        message: "Only managers or senior managers can approve/reject leaves.",
      });
    }

    const leaveRequest = await getLeaveReqRepo.findOne({
      where: { leave_req_id },
      relations: ["employee", "leaveType"],
    });

    if (!leaveRequest) {
      logger.error(
        `leave-controller-changeLeaveStatus: Leave request not found for id ${leave_req_id}`
      );
      return res.status(404).json({ message: "Leave request not found" });
    }

    const approvalFlow = await ApprovalFlowRepo.findOne({
      where: {
        leaveRequest: { leave_req_id },
        approver: { emp_id: approver.emp_id },
      },
      relations: ["leaveRequest", "approver"],
    });

    if (!approvalFlow) {
      logger.error(
        `leave-controller-changeLeaveStatus: Approval flow record not found for leave_req_id ${leave_req_id} and approver ${emp_id}`
      );
      return res
        .status(404)
        .json({ message: "Approval flow record not found" });
    }
    // Handle Rejection
    if (newStatus === LeaveConstants.LEAVE_STATUS.REJECTED) {
      if (!rejection_reason) {
        logger.error(
          "leave-controller-changeLeaveStatus: Rejection reason is required"
        );
        return res
          .status(400)
          .json({ message: "Rejection reason is required" });
      }

      leaveRequest.status = LeaveConstants.LEAVE_STATUS.REJECTED;
      leaveRequest.rejection_reason = rejection_reason;

      approvalFlow.status =
        approver.role === EmployeeConstants.EMPLOYEE_ROLES.MANAGER
          ? LeaveConstants.LEAVE_STATUS.REJECTED
          : LeaveConstants.LEAVE_STATUS.REJECTED_SENIOR_MANAGER;
      approvalFlow.remarks = rejection_reason;

      if (approver.role === EmployeeConstants.EMPLOYEE_ROLES.MANAGER) {
        logger.info(
          "leave-controller-changeLeaveStatus: Deleting pending senior manager approval flow"
        );
        await ApprovalFlowRepo.delete({
          leaveRequest: { leave_req_id },
          status: LeaveConstants.LEAVE_STATUS.PENDING_SENIOR_MANAGER,
        });
      }

      await Promise.all([
        getLeaveReqRepo.save(leaveRequest),
        ApprovalFlowRepo.save(approvalFlow),
      ]);

      return res.status(200).json({
        message: `Leave request rejected by ${approver.emp_name}`,
      });
    }

    // Handle Approval
    if (newStatus === LeaveConstants.LEAVE_STATUS.APPROVED) {
      logger.info(
        `leave-controller-changeLeaveStatus: Processing approval for leave_req_id ${leave_req_id}`
      );
      const leaveBalance = await getLeaveBalanceRepo.findOne({
        where: {
          employee: { emp_id: leaveRequest.employee.emp_id },
          leaveType: { leave_type_id: leaveRequest.leaveType.leave_type_id },
        },
      });

      const isManager =
        approver.role === EmployeeConstants.EMPLOYEE_ROLES.MANAGER;
      const isSeniorManager =
        approver.role === EmployeeConstants.EMPLOYEE_ROLES.SENIOR_MANAGER;
      const hasEnoughBalance =
        leaveBalance && leaveBalance.balance >= leaveRequest.num_of_days;

      if (isManager) {
        if (hasEnoughBalance) {
          // Direct approve (balance is sufficient)
          leaveRequest.status = LeaveConstants.LEAVE_STATUS.APPROVED;
          leaveBalance.balance -= leaveRequest.num_of_days;
          leaveRequest.employee.total_leave_balance -= leaveRequest.num_of_days;

          approvalFlow.status = LeaveConstants.LEAVE_STATUS.APPROVED;
          approvalFlow.remarks = "Approved by manager";

          await Promise.all([
            getLeaveBalanceRepo.save(leaveBalance),
            getEmployeeRepo.save(leaveRequest.employee),
            getLeaveReqRepo.save(leaveRequest),
            ApprovalFlowRepo.save(approvalFlow),
          ]);

          return res
            .status(200)
            .json({ message: `Leave approved by ${approver.emp_name}` });
        } else {
          // Forward to senior manager
          const seniorManagerId = approver.manager?.emp_id;
          if (!seniorManagerId) {
            logger.error(
              "leave-controller-changeLeaveStatus: Senior manager not found"
            );
            return res
              .status(400)
              .json({ message: "Senior manager not found" });
          }

          leaveRequest.status =
            LeaveConstants.LEAVE_STATUS.PENDING_SENIOR_MANAGER;
          leaveRequest.rejection_reason = null;
          leaveRequest.manager_id = seniorManagerId;

          approvalFlow.status = LeaveConstants.LEAVE_STATUS.APPROVED;
          approvalFlow.remarks = "Forwarded to senior manager";

          await Promise.all([
            getLeaveReqRepo.save(leaveRequest),
            ApprovalFlowRepo.save(approvalFlow),
          ]);

          return res.status(200).json({
            message: `Leave request forwarded to Senior Manager by ${approver.emp_name}`,
          });
        }
      }

      if (isSeniorManager) {
        // Final approval and balance deduction
        leaveRequest.status = LeaveConstants.LEAVE_STATUS.APPROVED;
        leaveRequest.rejection_reason = null;

        // leaveBalance.balance -= leaveRequest.num_of_days;
        // leaveRequest.employee.total_leave_balance -= leaveRequest.num_of_days;

        const remainingBalance =
          leaveBalance.balance - leaveRequest.num_of_days;
        leaveBalance.balance = Math.max(0, remainingBalance);

        // 🔁 Recalculate total leave balance from all leave types for this employee
        const allLeaveBalances = await getLeaveBalanceRepo.find({
          where: { employee: { emp_id: leaveRequest.employee.emp_id } },
          relations: ["leaveType"],
        });

        // console.log("all balance ", allLeaveBalances);

        const newTotalLeaveBalance = allLeaveBalances.reduce((sum, lb) => {
          const isCurrentLeaveType =
            lb.leaveType?.leave_type_id ===
            leaveRequest.leaveType?.leave_type_id;
          return sum + (isCurrentLeaveType ? leaveBalance.balance : lb.balance);
        }, 0);
        // console.log("new total balance", newTotalLeaveBalance);

        leaveRequest.employee.total_leave_balance = newTotalLeaveBalance;

        approvalFlow.status =
          LeaveConstants.LEAVE_STATUS.APPROVED_SENIOR_MANAGER;
        approvalFlow.remarks = "Approved by senior manager";

        await Promise.all([
          getLeaveBalanceRepo.save(leaveBalance),
          getEmployeeRepo.save(leaveRequest.employee),
          getLeaveReqRepo.save(leaveRequest),
          ApprovalFlowRepo.save(approvalFlow),
        ]);

        return res
          .status(200)
          .json({ message: `Leave approved by ${approver.emp_name}` });
      }
    }
    logger.error("leave-controller-changeLeaveStatus: Invalid status provided");
    return res.status(400).json({ message: "Invalid status" });
  } catch (error) {
    if (error.isJoi)
      return res.status(400).json({ error: error.details[0].message });

    logger.error(
      `leave-controller-changeLeaveStatus: Error processing leave status change: ${error}`
    );
    return res.status(500).json({
      error: "Error processing leave status change",
    });
  }
};

export const cancelLeave = async (req, res) => {
  try {
    const { emp_id } = await EmployeeIDParams.validateAsync(req.params);
    const { leave_req_id } = await CancelLeaveBodySchema.validateAsync(
      req.body,
      {
        abortEarly: false, // catch all errors
        convert: false, //  prevent auto-type coercion like string "3" => number 3
      }
    );
    logger.info(
      `leave-controller-cancelLeave: Attempting to cancel leave_req_id ${leave_req_id} for emp_id ${emp_id}`
    );
    const result = await cancelLeaveHelper(leave_req_id, emp_id);
    return res.status(200).json({ message: result });
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }
    logger.error(
      `leave-controller-cancelLeave: Error cancelling leave: ${error}`
    );
    return res.status(error.code || 500).json({ message: error.message });
  }
};

export const checkLeaveBalance = async (req, res) => {
  try {
    const { emp_id } = await EmployeeIDParams.validateAsync(req.params);
    logger.info(
      `leave-controller-checkLeaveBalance: Fetching leave balance for emp_id ${emp_id}`
    );
    const result = await leaveBalanceHelper(emp_id);
    // console.log(result);
    return res.status(200).json(result);
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }
    logger.error(
      `leave-controller-checkLeaveBalance: Error fetching leave balance: ${error}`
    );
    return res.status(error.code || 500).json({ message: error.message });
  }
};

export const getLeaveHistory = async (req, res) => {
  try {
    const { emp_id } = await EmployeeIDParams.validateAsync(req.params);
    logger.info(
      `leave-controller-getLeaveHistory: Fetching leave history for emp_id ${emp_id}`
    );
    const result = await getEmpLeaveHistory(emp_id);
    return res.status(200).json(result);
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }
    logger.error(
      `leave-controller-getLeaveHistory: Error fetching leave history: ${error}`
    );
    return res.status(500).json(error);
  }
};
