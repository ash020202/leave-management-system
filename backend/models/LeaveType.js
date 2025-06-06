import { EntitySchema } from "typeorm";

export const LeaveType = new EntitySchema({
  name: "LeaveType",
  tableName: "leave_types",
  columns: {
    leave_type_id: {
      primary: true,
      type: "int",
      generated: true,
    },
    name: {
      type: "varchar",
      unique: true,
    },
    is_carry_forward: {
      type: "boolean",
      default: false,
    },
  },
});
