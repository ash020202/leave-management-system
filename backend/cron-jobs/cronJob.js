import cron from "node-cron";
import {
  accumulateLeavesMonthly,
  carryForwardLeaves,
} from "../utils/Helper.js";
import logger from "../utils/logger.js";

cron.schedule("09 09 09 * *", async () => {
  logger.info("Running monthly leave accumulation job...");
  await accumulateLeavesMonthly();
});

cron.schedule("07 09 09 * *", async () => {
  logger.info("running carry forward leave balance update job");
  await carryForwardLeaves();
});
