import { AppDataSource } from "../db/data-source.js";
import { LeavePolicy } from "../models/LeavePolicy.js";

export const getLeavePolicyRepo = AppDataSource.getRepository(LeavePolicy);
