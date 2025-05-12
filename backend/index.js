import express from "express";
import cors from "cors";

import bodyParser from "body-parser";
import empRoute from "./routes/employeeRoute.js";
import leaveRoute from "./routes/leaveRoutes.js";
import authRoute from "./routes/authRoute.js";
import { AppDataSource } from "./db/data-source.js";
import logger from "./utils/logger.js";

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use("/api/auth", authRoute);
app.use("/api/employees", empRoute);
app.use("/api/leave", leaveRoute);

const port = 5000;

AppDataSource.initialize()
  .then(() => {
    logger.info(" DB connected successfully");
    console.log(" DB connected successfully");

    app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((err) => {
    logger.error("Error during Data Source initialization", err);
    console.error("Error during Data Source initialization", err);
  });
