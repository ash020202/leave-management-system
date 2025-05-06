// src/models/LeaveRequest.js
import { EntitySchema } from "typeorm";
import { Employee } from "../models/Employees.js";

export const LeaveRequest = new EntitySchema({
  name: "LeaveRequest",
  tableName: "leave_requests",
  columns: {
    emp_id: {
      type: "int",
    },
    leave_type: {
      type: "varchar",
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
    },
    cancelled: {
      type: "int",
      default: 0,
    },
    num_of_days: {
      type: "int",
    },
    created_at: {
      type: "timestamp",
      createDate: true,
      default: () => "CURRENT_TIMESTAMP",
    },
    manager_id: {
      type: "int",
    },
    leave_req_id: {
      primary: true,
      type: "int",
      generated: true,
    },
    rejection_reason: {
      type: "text",
      nullable: true,
    },
  },
  relations: {
    employee: {
      type: "many-to-one",
      target: Employee,
      joinColumn: { name: "emp_id" },
    },
  },
});
