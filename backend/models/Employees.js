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
    total_leave_balance: {
      type: "float",
    },
  },
  relations: {
    manager: {
      type: "many-to-one",
      target: "Employee",
      joinColumn: { name: "manager_id" },
      nullable: true,
    },
    subordinates: {
      type: "one-to-many",
      target: "Employee",
      inverseSide: "manager",
    },
    leaveBalances: {
      type: "one-to-many",
      target: "LeaveBalance",
      inverseSide: "employee",
    },
  },
});
