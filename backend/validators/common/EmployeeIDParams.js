import joi from "joi";
export const EmployeeIDParams = joi.object({
  emp_id: joi.string().required(),
});
