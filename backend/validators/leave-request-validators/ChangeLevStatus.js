import Joi from "joi";

export const ChangeLeaveStatusBodySchema = Joi.object({
  newStatus: Joi.string().valid("APPROVED", "REJECTED").required(),
  leave_req_id: Joi.number().integer().positive().required(),
  rejection_reason: Joi.when("newStatus", {
    is: "REJECTED",
    then: Joi.string().min(20).max(500).required().messages({
      "any.required": "Rejection reason is required when rejecting",
    }),
    otherwise: Joi.forbidden(),
  }),
});
