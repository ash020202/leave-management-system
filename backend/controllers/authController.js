import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getAuthRepo } from "../repositories/AuthRepo.js";
import { getEmployeeRepo } from "../repositories/EmployeeRepo.js";
import logger from "../utils/logger.js";
import { decryptPassword } from "../utils/Helper.js";

const JWT_SECRET = process.env.JWT_SECRET;

export const signup = async (req, res) => {
  const { email, password, emp_id } = req.body;
  try {
    const employee = await getEmployeeRepo.findOneBy({ emp_id });
    if (!employee) {
      logger.error("Manager not found for emp_id: " + emp_id);
      return res.status(404).json({ message: "Manager not found" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = getAuthRepo.create({
      email,
      password: hashedPassword,
      employee,
    });
    await getAuthRepo.save(newUser);
    logger.info("sign up success");
    res.status(201).json({ message: "Signup successful" });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: "Signup failed" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  // const decryptPwd = decryptPassword(password);

  try {
    const user = await getAuthRepo.findOne({
      where: { email },
      relations: ["employee"],
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      logger.warn("Invalid credentials attempted");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        empId: user.employee.emp_id,
        emp_name: user.employee.emp_name,
        role: user.employee.role,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token });
    logger.info("login success");
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: "Login failed" });
  }
};
