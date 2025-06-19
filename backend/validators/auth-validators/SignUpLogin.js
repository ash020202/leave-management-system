import joi from "joi";

export const SignUpSchema = joi.object({
  name: joi.string().min(2).required().label("Name"),
  email: joi
    .string()
    .email({ tlds: { allow: false } })
    .pattern(/^[^\s@]+@[a-zA-Z]{2,}\.[a-z]{2,}$/)
    .required()
    .label("Email ID"),
  password: joi
    .string()
    .min(8)
    .pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/)
    .required()
    .label("Password")
    .messages({
      "string.pattern.base":
        "Password must include at least one letter and one number",
    }),
  emp_id: joi.string().required().label("Employee ID"),
});

export const LoginSchema = joi.object({
  email: joi.string().required().label("Email"),
  password: joi.string().required().label("Password"),
});
