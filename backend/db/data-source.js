import { DataSource } from "typeorm";
import "reflect-metadata";
import dotenv from "dotenv";
import { Employee } from "../models/Employees.js";
import { LeaveRequest } from "../models/LeaveRequest.js";
import { Auth } from "../models/Auth.js";
dotenv.config();

export const AppDataSource = new DataSource({
  type: "mysql",
  host: "localhost",
  port: 3306,
  username: process.env.USER,
  password: process.env.PWD,
  database: process.env.DB_NAME,
  synchronize: false, // use migrations in production
  logging: false,
  entities: [Employee, LeaveRequest, Auth],
});
