import { EntitySchema } from "typeorm";
import { LeaveRequest } from "./LeaveRequest.js";
import { Employee } from "./Employees.js";

export const ApprovalFlow = new EntitySchema({
  name: "ApprovalFlow",
  tableName: "ApprovalFlow",
  columns: {
    approval_id: {
      primary: true,
      type: "int",
      generated: true,
    },
    approval_level: {
      type: "int", // 1 = direct manager, 2 = senior manager, 3 = next level, etc.
    },
    status: {
      type: "varchar",
      default: "PENDING", // PENDING, APPROVED, REJECTED
      enum: ["PENDING", "APPROVED", "REJECTED"],
    },
    approval_date: {
      type: "timestamp",
      nullable: true,
    },
    rejection_reason: {
      type: "text",
      nullable: true,
    },
    created_at: {
      type: "timestamp",
      createDate: true,
    },
  },
  relations: {
    leaveRequest: {
      type: "many-to-one",
      target: "LeaveRequest",
      joinColumn: { name: "leave_req_id" },
    },
    approver: {
      type: "many-to-one",
      target: "Employee",
      joinColumn: { name: "approver_id" },
    },
  },
});
