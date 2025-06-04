import { EntitySchema } from "typeorm";
import { Employee } from "./Employees.js";
import { LeaveType } from "./LeaveType.js";
import { LeaveConstants } from "../constants/LeaveConstants.js";

export const LeaveRequest = new EntitySchema({
  name: "LeaveRequest",
  tableName: "leave_requests",
  columns: {
    leave_req_id: {
      primary: true,
      type: "int",
      generated: true,
    },
    from_date: {
      type: "date",
    },
    to_date: {
      type: "date",
    },
    reason: {
      type: "text",
    },
    status: {
      type: "varchar",
      default: "PENDING", // PENDING, APPROVED, REJECTED
      enum: [
        LeaveConstants.LEAVE_STATUS.PENDING,
        LeaveConstants.LEAVE_STATUS.APPROVED,
        LeaveConstants.LEAVE_STATUS.REJECTED,
      ],
    },
    rejection_reason: {
      type: "text",
      nullable: true,
    },
    requires_dual_approval: {
      type: "boolean",
      default: false,
    },
    num_of_days: {
      type: "int",
    },
    created_at: {
      type: "timestamp",
      createDate: true,
    },
  },
  relations: {
    employee: {
      type: "many-to-one",
      target: Employee,
      joinColumn: { name: "emp_id" },
    },
    leaveType: {
      type: "many-to-one",
      target: LeaveType,
      joinColumn: { name: "leave_type_id" },
    },
    approvals: {
      type: "one-to-many",
      target: "ApprovalFlow",
      inverseSide: "leaveRequest",
    },
  },
});
