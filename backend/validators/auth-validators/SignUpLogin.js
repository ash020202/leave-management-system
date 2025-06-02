import joi from "joi";

export const SignUpSchema = joi.object({
  email: joi.string().required().label("Email ID"),
  password: joi.string().required().label("Password"),
  emp_id: joi.string().required().label("Employee ID"),
});

export const LoginSchema = joi.object({
  email: joi.string().required().label("Email"),
  password: joi.string().required().label("Password"),
});
