import { DataSource } from "typeorm";
import "reflect-metadata";
import dotenv from "dotenv";
import { Employee } from "../models/Employees.js";
import { LeaveRequest } from "../models/LeaveRequest.js";
import { Auth } from "../models/Auth.js";
dotenv.config();

export const AppDataSource = new DataSource({
  type: process.env.DB_TYPE,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USER,
  password: process.env.DB_PWD,
  database: process.env.DB_NAME,
  synchronize: false, // use migrations in production
  logging: false,
  ssl: {
    rejectUnauthorized: false, // required for Render
  },

  entities: [Employee, LeaveRequest, Auth],
});
