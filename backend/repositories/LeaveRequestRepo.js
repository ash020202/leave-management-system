import { AppDataSource } from "../db/data-source.js";
import { LeaveRequest } from "../models/LeaveRequest.js";

export const getLeaveReqRepo = AppDataSource.getRepository(LeaveRequest);
