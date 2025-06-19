import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getAuthRepo } from "../repositories/AuthRepo.js";
import { getEmployeeRepo } from "../repositories/EmployeeRepo.js";
import logger from "../utils/logger.js";
import { decryptPassword } from "../utils/Helper.js";
import {
  LoginSchema,
  SignUpSchema,
} from "../validators/auth-validators/SignUpLogin.js";

const JWT_SECRET = process.env.JWT_SECRET;

export const signup = async (req, res) => {
  try {
    const { email, password } = await SignUpSchema.validateAsync(req.body);
    const employee = await getEmployeeRepo.findOneBy({ email });
    if (!employee) {
      logger.error("Emp not found for emp_id: " + email);
      return res
        .status(404)
        .json({ message: "Employee not found. Please Contact Admin" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = getAuthRepo.create({
      email,
      password: hashedPassword,
      employee,
    });
    await getAuthRepo.save(newUser);
    logger.info("signup-controller: sign up success");
    return res.status(201).json({ message: "Signup successful" });
  } catch (err) {
    if (err.isJoi) {
      // Handle Joi validation errors
      return res.status(400).json({ error: err.details[0].message });
    }
    logger.error("signup-controller: ", err);
    return res.status(500).json({ message: "Signup failed" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = await LoginSchema.validateAsync(req.body);
    // const decryptPwd = decryptPassword(password);
    const user = await getAuthRepo.findOne({
      where: { email },
      relations: ["employee"],
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      logger.warn("login-controller: Invalid credentials attempted");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        empId: user.employee.emp_id,
        emp_name: user.employee.emp_name,
        role: user.employee.role,
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token });
    return logger.info("login-controller: login success");
  } catch (err) {
    if (err.isJoi) {
      // Handle Joi validation errors
      return res.status(400).json({ error: error.details[0].message });
    }
    logger.error("login-controller: ", err);
    return res.status(500).json({ message: "Login failed" });
  }
};
