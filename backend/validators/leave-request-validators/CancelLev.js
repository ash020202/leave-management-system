import joi from "joi";

export const CancelLeaveBodySchema = joi.object({
  leave_req_id: joi
    .number()
    .strict()
    .integer()
    .positive()
    .required()
    .label("Leave Req ID"),
});
