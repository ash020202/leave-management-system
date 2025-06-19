import joi from "joi";

export const LeaveReqSchema = joi.object({
  emp_id: joi.number().strict().required().label("Employee ID"),
  leave_type_id: joi.number().strict().required().label("Leave Type ID"),
  from_date: joi.string().required().label("From Date"),
  to_date: joi.string().required().label("To Date"),
  reason: joi
    .string()
    .min(20)
    .max(250)
    .strict()
    .required()
    .label("Reason for Leave"),
  halfDay: joi
    .string()
    .valid("none", "full_day", "first_half", "second_half")
    .required()
    .label("HalfDay Value missing"),
});
