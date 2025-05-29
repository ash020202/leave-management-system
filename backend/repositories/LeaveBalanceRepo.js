import { AppDataSource } from "../db/data-source.js";
import { LeaveBalance } from "../models/LeaveBalance.js";

export const getLeaveBalanceRepo = AppDataSource.getRepository(LeaveBalance);
