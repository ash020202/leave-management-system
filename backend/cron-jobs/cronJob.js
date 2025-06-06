import cron from "node-cron";
import { accumulateLeavesMonthly } from "../utils/Helper.js";

cron.schedule("44 14 04 * *", async () => {
  console.log("Running monthly leave accumulation job...");
  await accumulateLeavesMonthly();
});
