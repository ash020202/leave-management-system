import { AppDataSource } from "./db/data-source.js";
import { Employee } from "./models/Employees.js";
import { LeaveRequest } from "./models/LeaveRequest.js";

// src/test-connection.js

const main = async () => {
  try {
    await AppDataSource.initialize();
    console.log("✅ Database connected!");

    const employeeRepo = AppDataSource.getRepository(Employee);
    const employees = await employeeRepo.find();
    console.log("Employees:", employees);

    const leaveRequestRepo = AppDataSource.getRepository(LeaveRequest);
    const leaveRequests = await leaveRequestRepo.find();
    console.log("Leave Requests:", leaveRequests);

    await AppDataSource.destroy();
  } catch (error) {
    console.error("❌ Error connecting to DB:", error);
  }
};

main();
