import { EntitySchema } from "typeorm";
import { Employee } from "../models/Employees.js";

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
      enum: ["INTERN", "EMPLOYEE", "MANAGER", "SENIOR_MANAGER"],
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
