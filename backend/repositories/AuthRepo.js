import { AppDataSource } from "../db/data-source.js";
import { Auth } from "../models/Auth.js";

export const getAuthRepo = AppDataSource.getRepository(Auth);
