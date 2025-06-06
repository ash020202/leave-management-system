import { AppDataSource } from "../db/data-source.js";
import { ApprovalFlow } from "../models/ApprovalFlow.js";

export const ApprovalFlowRepo = AppDataSource.getRepository(ApprovalFlow);
