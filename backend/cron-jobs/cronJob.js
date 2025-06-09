import cron from "node-cron";
import {
  accumulateLeavesMonthly,
  carryForwardLeaves,
} from "../utils/Helper.js";

cron.schedule("09 09 09 * *", async () => {
  console.log("Running monthly leave accumulation job...");
  await accumulateLeavesMonthly();
});

cron.schedule("07 09 09 * *", async () => {
  console.log("running carry forward leave balance update job");
  await carryForwardLeaves();
});
