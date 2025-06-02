import { EntitySchema } from "typeorm";
import { Employee } from "../models/Employees.js";
import { EmployeeConstants } from "../constants/EmployeeConstants.js";

export const Auth = new EntitySchema({
  name: "Auth",
  tableName: "auth",
  columns: {
    auth_id: {
      primary: true,
      type: "int",
      generated: true,
    },
    email: {
      type: "varchar",
      unique: true,
    },
    password: {
      type: "varchar",
    },
    role: {
      type: "enum",
      enum: [
        EmployeeConstants.EMPLOYEE_ROLES.INTERN,
        EmployeeConstants.EMPLOYEE_ROLES.EMPLOYEE,
        EmployeeConstants.EMPLOYEE_ROLES.MANAGER,
        EmployeeConstants.EMPLOYEE_ROLES.SENIOR_MANAGER,
      ],
      default: "EMPLOYEE",
    },
  },
  relations: {
    employee: {
      type: "one-to-one",
      target: Employee,
      joinColumn: true,
      cascade: false,
    },
  },
});
