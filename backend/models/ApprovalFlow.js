import { EntitySchema } from "typeorm";

export const ApprovalFlow = new EntitySchema({
  name: "ApprovalFlow",
  tableName: "ApprovalFlow",
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    status: {
      type: "varchar",
      length: 50, // APPROVED, FORWARDED, REJECTED
    },
    remarks: {
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
      nullable: false,
      onDelete: "CASCADE",
    },
    approver: {
      type: "many-to-one",
      target: "Employee",
      joinColumn: { name: "approver_id" },
      nullable: false,
      onDelete: "CASCADE",
    },
  },
});
