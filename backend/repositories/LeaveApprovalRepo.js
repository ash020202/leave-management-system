import { AppDataSource } from "../db/data-source";
import { ApprovalFlow } from "../models/ApprovalFlow";

export const getLeaveApprovalRepo = AppDataSource.getRepository(ApprovalFlow);
