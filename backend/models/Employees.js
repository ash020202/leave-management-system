// src/models/Employee.js
import { EntitySchema } from "typeorm";

export const Employee = new EntitySchema({
  name: "Employee",
  tableName: "employees",
  columns: {
    emp_id: {
      primary: true,
      type: "int",
      generated: true,
    },
    emp_name: {
      type: "varchar",
    },
    department: {
      type: "varchar",
    },
    role: {
      type: "varchar",
    },
    manager_id: {
      type: "int",
    },
    manager_name: {
      type: "varchar",
    },
    sr_manager_id: {
      type: "int",
    },
    sr_manager_name: {
      type: "varchar",
    },
    total_leave_balance: {
      type: "int",
    },
    sick_leave: {
      type: "int",
    },
    floater_leave: {
      type: "int",
    },
    earned_leave: {
      type: "int",
    },
    loss_of_pay: {
      type: "int",
    },
  },
});
