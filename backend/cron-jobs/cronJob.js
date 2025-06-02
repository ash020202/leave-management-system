import cron from "node-cron";
import { accumulateLeavesMonthly } from "../utils/Helper.js";

cron.schedule("18 17 02 * *", async () => {
  console.log("Running monthly leave accumulation job...");
  await accumulateLeavesMonthly();
});
