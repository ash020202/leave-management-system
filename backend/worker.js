import { Worker } from "bullmq";
import dotenv from "dotenv";
import { AppDataSource } from "./db/data-source.js";
import { getEmployeeRepo } from "./repositories/EmployeeRepo.js";
import { redisConnection } from "./db/redis.js";
dotenv.config();

try {
  await AppDataSource.initialize()
    .then(() => console.log("DB connected in worker"))
    .catch((err) => {
      console.error("DB init error in worker", err);
      process.exit(1);
    });
} catch (error) {
  console.log(error);
}

const worker = new Worker(
  "employee-bulk-upload",
  async (job) => {
    console.log(
      `Received job id ${job.id} with ${job.data.data.length} employees`
    );
    const employees = job.data.data;

    const chunkSize = 10;
    for (let i = 0; i < employees.length; i += chunkSize) {
      const chunk = employees.slice(i, i + chunkSize);
      await getEmployeeRepo.insert(chunk); // fast insert
      console.log(`Inserted chunk: ${i}–${i + chunk.length - 1}`);
    }
    console.log(`Job id: ${job.id} has been processed`);
  },
  { connection: redisConnection }
);

worker.on("ready", () => {
  console.log("worker is listening for jobs");
});
worker.on("active", (job) => {
  console.log(`Job id ${job.id} is being processed...`);
});
worker.on("completed", (job) => console.log(`Job id ${job.id} done`));
worker.on("failed", (job, err) =>
  console.error(`Job id ${job?.id} failed`, err)
);
