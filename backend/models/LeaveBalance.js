import { EntitySchema } from "typeorm";
import { Employee } from "./Employees.js";
import { LeaveType } from "./LeaveType.js";

export const LeaveBalance = new EntitySchema({
  name: "LeaveBalance",
  tableName: "leave_balances",
  columns: {
    balance_id: {
      primary: true,
      type: "int",
      generated: true,
    },
    balance: {
      type: "int",
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
  },
});
