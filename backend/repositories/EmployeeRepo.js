import { AppDataSource } from "../db/data-source.js";
import { Employee } from "../models/Employees.js";

export const getEmployeeRepo = AppDataSource.getRepository(Employee);
