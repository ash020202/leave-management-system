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
import { EmployeeIDParams } from "../validators/common/EmployeeIDParams.js";
import { CancelLeaveBodySchema } from "../validators/leave-request-validators/CancelLev.js";
import { ChangeLeaveStatusBodySchema } from "../validators/leave-request-validators/ChangeLevStatus.js";
import { LeaveReqSchema } from "../validators/leave-request-validators/LeaveReqSchema.js";

export const getPublicHolidays = async (req, res) => {
  const year = new Date().getFullYear();
  if (!year) {
    return res.status(400).json({ error: "Year is required" });
  }
  try {
    const holidays = await fetchPublicHolidays(year);
    if (holidays.length === 0) {
      return res
        .status(404)
        .json({ message: "No holidays found for this year" });
    }
    return res.status(200).json(holidays.response.holidays);
  } catch (error) {
    console.error("Error fetching public holidays:", error);
    return res.status(500).json({ error: "Failed to fetch public holidays" });
  }
};

export const getFloaterHolidays = async (req, res) => {
  try {
    const result = LeaveConstants.FLOATER_LEAVE;
    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "failed to retrieve floater holidays list" });
  }
};

// export const submitLeave = async (req, res) => {
//   try {
//     const { emp_id, leave_type_id, from_date, to_date, reason } =
//       await LeaveReqSchema.validateAsync(req.body, {
//         abortEarly: false, // catch all errors
//         convert: false, //  prevent auto-type coercion like string "3" => number 3
//       });
//     // Fetch the employee
//     const employee = await findEmpById(emp_id);
//     // console.log("Manager:", employee.manager);
//     // console.log("Senior Manager:", employee.manager?.manager);
//     if (!employee) {
//       return res.status(404).json({ error: "Employee not found" });
//     }

//     // Fetch the leave type
//     const leaveType = await getLeaveTypeRepo.findOneBy({ leave_type_id });
//     if (!leaveType) {
//       return res.status(404).json({ error: "Leave type not found" });
//     }

//     //check if floater leave then isFloater is true based on given from date and to date match with an constant here
//     const floaterLeaves = LeaveConstants.FLOATER_LEAVE.map((f) => f.date);
//     if (leaveType.name === LeaveConstants.LEAVE_TYPES.FLOATER_LEAVE) {
//       if (
//         !floaterLeaves.includes(from_date) ||
//         !floaterLeaves.includes(to_date)
//       ) {
//         return res.status(400).json({
//           error: `Floater leave can only be applied for certain dates Contact HR for more details.`,
//         });
//       }
//     }

//     // Fetch leave balance for the employee
//     const leaveBalance = await leaveBalanceHelper(emp_id);
//     const leaveCount = leaveBalance[leaveType.name]; // Use leave type name to get the balance

//     // Calculate working days
//     const fromYear = new Date(from_date).getFullYear();
//     const toYear = new Date(to_date).getFullYear();
//     const years = new Set();
//     for (let year = fromYear; year <= toYear; year++) years.add(year);

//     // Fetch holidays for all years
//     let allHolidays = [];
//     for (let year of years) {
//       const holidays = await fetchIndianHolidays(year);
//       const formattedHolidays = holidays.map(
//         (h) => new Date(h).toISOString().split("T")[0]
//       );
//       allHolidays.push(...formattedHolidays);
//     }

//     const { totalDays, allDaysInvalid } = calculateWorkingDays(
//       from_date,
//       to_date,
//       allHolidays,
//       leaveType.name
//     );

//     if (
//       leaveType.name !== LeaveConstants.LEAVE_TYPES.FLOATER_LEAVE &&
//       (allDaysInvalid || totalDays === 0)
//     ) {
//       return res.status(400).send({
//         error: "Leave cannot be applied for weekends or public holidays only.",
//       });
//     }

//     let assignedManagerId = null;
//     let leaveStatus;

//     assignedManagerId = employee.manager?.emp_id || null;
//     leaveStatus =
//       leaveType.name === LeaveConstants.LEAVE_TYPES.SICK_LEAVE
//         ? LeaveConstants.LEAVE_STATUS.APPROVED
//         : LeaveConstants.LEAVE_STATUS.PENDING;

//     if (!assignedManagerId) {
//       return res.status(400).send({
//         error:
//           "No manager or senior manager found to approve the leave request.",
//       });
//     }
//     // console.log("Assigned Manager ID:", assignedManagerId);

//     // Insert the leave request
//     const insertResult = await insertLeaveRequest(
//       emp_id,
//       leaveType.leave_type_id, // Use leave_type_id
//       from_date,
//       to_date,
//       reason,
//       leaveStatus,
//       assignedManagerId,
//       totalDays
//     );

//     //to fetch leave_req from approval flow table and update status of that record
//     const leaveRequestId = insertResult?.leave_req_id;
//     // console.log("Leave Request ID:", leaveRequestId);
//     // console.log("sr manager id:", employee.manager?.manager?.emp_id);

//     const hasSufficientBalance = leaveCount >= totalDays;

//     //update approval flow status based on leave_req_id
//     try {
//       //if emp have balance then one entry in approval flow (while submitting leave)
//       if (
//         hasSufficientBalance &&
//         leaveType.name != LeaveConstants.LEAVE_TYPES.SICK_LEAVE
//       ) {
//         // console.log(leaveType);

//         const approvalFlowEntry = ApprovalFlowRepo.create({
//           leaveRequest: leaveRequestId,
//           approver: employee.manager.emp_id,
//           status: LeaveConstants.LEAVE_STATUS.PENDING,
//           remarks: "Pending manager approval - sufficient balance",
//         });
//         await ApprovalFlowRepo.save(approvalFlowEntry);
//       } else {
//         if (leaveType.name != LeaveConstants.LEAVE_TYPES.SICK_LEAVE) {
//           //if emp have no balance or long leave then two entries in approval flow (while submitting leave)
//           if (employee.manager?.emp_id) {
//             //Then, manager approval entry (also PENDING initially)
//             const managerApprovalEntry = ApprovalFlowRepo.create({
//               leaveRequest: leaveRequestId,
//               approver: employee.manager.emp_id,
//               status: LeaveConstants.LEAVE_STATUS.PENDING,
//               remarks: "Pending manager approval - insufficient balance",
//             });
//             await ApprovalFlowRepo.save(managerApprovalEntry);
//           }

//           if (employee.manager?.manager?.emp_id) {
//             // Then, senior manager approval entry (also PENDING initially)
//             const seniorManagerApprovalEntry = ApprovalFlowRepo.create({
//               leaveRequest: leaveRequestId,
//               approver: employee.manager.manager.emp_id,
//               status: LeaveConstants.LEAVE_STATUS.PENDING_SENIOR_MANAGER,
//               remarks: "Pending senior manager approval - insufficient balance",
//             });
//             await ApprovalFlowRepo.save(seniorManagerApprovalEntry);
//           }
//         }
//       }
//     } catch (error) {
//       console.error("Error updating leave balance:", error);
//       return res.status(500).send({ error: "Failed to submit leave request" });
//     }

//     if (
//       insertResult.message?.toLowerCase().includes("already exists") ||
//       insertResult.duplicate
//     ) {
//       return res.status(400).send({ error: insertResult.message });
//     }

//     let remainingLeave = 0;
//     if (
//       leaveCount >= totalDays &&
//       leaveType.name === LeaveConstants.LEAVE_TYPES.SICK_LEAVE
//     ) {
//       try {
//         const updatedBalance = await updateLeaveBalance(
//           emp_id,
//           leaveType.leave_type_id,
//           totalDays
//         );
//         // console.log("Updated Leave Balance:", updatedBalance);

//         remainingLeave = updatedBalance;
//       } catch (error) {
//         console.error("Error updating leave balance:", error);
//         return res
//           .status(500)
//           .send({ error: "Failed to update leave balance" });
//       }
//     }

//     const message =
//       leaveCount >= totalDays
//         ? leaveType.name === LeaveConstants.LEAVE_TYPES.SICK_LEAVE
//           ? `${leaveType.name} leave approved and ${totalDays} days deducted from balance.`
//           : `${leaveType.name} leave request sent to manager for ${totalDays} days.`
//         : `${leaveType.name} leave balance insufficient. Leave request forwarded to Manager Approval -> Senior Manager.`;

//     return res.status(200).send({ message, remainingLeave });
//   } catch (err) {
//     if (err.isJoi) {
//       // Handle Joi validation errors
//       return res.status(400).json({ error: err.details[0].message });
//     }
//     console.error("Error processing leave request:", err);
//     return res.status(500).send({ error: "Unexpected server error" });
//   }
// };

export const submitLeave = async (req, res) => {
  try {
    // Validate request body
    const { emp_id, leave_type_id, from_date, to_date, reason } =
      await LeaveReqSchema.validateAsync(req.body, {
        abortEarly: false,
        convert: false,
      });

    // Fetch employee and leave type
    const employee = await findEmpById(emp_id);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const leaveType = await getLeaveTypeRepo.findOneBy({ leave_type_id });
    if (!leaveType) {
      return res.status(404).json({ error: "Leave type not found" });
    }

    // Validate floater leave dates
    if (leaveType.name === LeaveConstants.LEAVE_TYPES.FLOATER_LEAVE) {
      const floaterLeaves = LeaveConstants.FLOATER_LEAVE.map((f) => f.date);
      if (
        !floaterLeaves.includes(from_date) ||
        !floaterLeaves.includes(to_date)
      ) {
        return res.status(400).json({
          error:
            "Floater leave can only be applied for certain dates. kindly view floater holidays and apply .",
        });
      }
    }

    // Get leave balance and calculate working days
    const leaveBalance = await leaveBalanceHelper(emp_id);
    const leaveCount = leaveBalance[leaveType.name];

    const allHolidays = await fetchIndianHolidays(from_date, to_date);
    const { totalDays, allDaysInvalid } = calculateWorkingDays(
      from_date,
      to_date,
      allHolidays,
      leaveType.name
    );

    // Validate working days (except for floater leave)
    if (
      leaveType.name !== LeaveConstants.LEAVE_TYPES.FLOATER_LEAVE &&
      (allDaysInvalid || totalDays === 0)
    ) {
      return res.status(400).send({
        error: "Leave cannot be applied for weekends or public holidays only.",
      });
    }

    // Determine leave status and assigned manager
    const assignedManagerId = employee.manager?.emp_id || null;
    const leaveStatus = getLeaveStatus(leaveType.name);

    if (!assignedManagerId) {
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
    console.error("Error processing leave request:", err);
    return res.status(500).send({ error: "Unexpected server error" });
  }
};

export const getManagerPendingLeaveRequests = async (req, res) => {
  try {
    const { emp_id } = await EmployeeIDParams.validateAsync(req.params);

    const manager_id = Number(emp_id);
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
    console.error(error);
    return res.status(500).send("Error fetching leave requests");
  }
};
export const getApprovedOrRejectedLevController = async (req, res) => {
  try {
    const { emp_id } = req.params;
    const result = await getApprovedOrRejectedLeaves(emp_id);
    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
};
export const trackLeave = async (req, res) => {
  try {
    const { leave_req_id } = req.params;
    const result = await getApprovalTrailForLeave(leave_req_id);
    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
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
    if (!approver)
      return res.status(404).json({ message: "Approver not found" });

    if (
      approver.role !== EmployeeConstants.EMPLOYEE_ROLES.MANAGER &&
      approver.role !== EmployeeConstants.EMPLOYEE_ROLES.SENIOR_MANAGER
    ) {
      return res.status(403).json({
        message: "Only managers or senior managers can approve/reject leaves.",
      });
    }

    const leaveRequest = await getLeaveReqRepo.findOne({
      where: { leave_req_id },
      relations: ["employee", "leaveType"],
    });

    if (!leaveRequest)
      return res.status(404).json({ message: "Leave request not found" });

    const approvalFlow = await ApprovalFlowRepo.findOne({
      where: {
        leaveRequest: { leave_req_id },
        approver: { emp_id: approver.emp_id },
      },
      relations: ["leaveRequest", "approver"],
    });

    if (!approvalFlow)
      return res
        .status(404)
        .json({ message: "Approval flow record not found" });

    // Handle Rejection
    if (newStatus === LeaveConstants.LEAVE_STATUS.REJECTED) {
      if (!rejection_reason) {
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

        leaveBalance.balance -= leaveRequest.num_of_days;
        leaveRequest.employee.total_leave_balance -= leaveRequest.num_of_days;

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

    return res.status(400).json({ message: "Invalid status" });
  } catch (error) {
    if (error.isJoi)
      return res.status(400).json({ error: error.details[0].message });

    console.error("Error in changeLeaveStatus:", error);
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
    const result = await cancelLeaveHelper(leave_req_id, emp_id);
    return res.status(200).json({ message: result });
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }
    console.error("Cancel Error:", error);
    return res.status(error.code || 500).json({ message: error.message });
  }
};

export const checkLeaveBalance = async (req, res) => {
  try {
    const { emp_id } = await EmployeeIDParams.validateAsync(req.params);
    const result = await leaveBalanceHelper(emp_id);
    // console.log(result);
    return res.status(200).json(result);
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }
    console.error("leave balance Error:", error);
    return res.status(error.code || 500).json({ message: error.message });
  }
};

export const getLeaveHistory = async (req, res) => {
  try {
    const { emp_id } = await EmployeeIDParams.validateAsync(req.params);
    const result = await getEmpLeaveHistory(emp_id);
    return res.status(200).json(result);
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }
    console.log(error);
    return res.status(500).json(error);
  }
};
