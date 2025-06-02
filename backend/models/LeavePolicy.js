import { EntitySchema } from "typeorm";
import { EmployeeConstants } from "../constants/EmployeeConstants.js";

export const LeavePolicy = new EntitySchema({
  name: "LeavePolicy",
  tableName: "leave_policy",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    employee_type: {
      type: "enum",
      enum: [
        EmployeeConstants.EMPLOYEE_ROLES.INTERN,
        EmployeeConstants.EMPLOYEE_ROLES.EMPLOYEE,
        EmployeeConstants.EMPLOYEE_ROLES.MANAGER,
        EmployeeConstants.EMPLOYEE_ROLES.SENIOR_MANAGER,
      ],
      default: "EMPLOYEE",
    },
    leave_type_id: {
      type: "int",
      nullable: false,
      comment: "Reference to leave_types table",
    },
    accrual_per_month: {
      type: "int",
      nullable: false,
      default: 0,
      comment: "Number of leave days to accrue per month",
    },
    max_days_per_year: {
      type: "int",
      nullable: false,
      default: 0,
      comment: "Maximum leave days allowed per year for this leave type",
    },
  },
  relations: {
    leaveType: {
      target: "LeaveType",
      type: "many-to-one",
      joinColumn: {
        name: "leave_type_id",
      },
      eager: false,
    },
  },
});
