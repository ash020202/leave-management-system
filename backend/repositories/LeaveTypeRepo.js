import { AppDataSource } from "../db/data-source.js";
import { LeaveType } from "../models/LeaveType.js";

export const getLeaveTypeRepo = AppDataSource.getRepository(LeaveType);
