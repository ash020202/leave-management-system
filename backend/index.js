import express from "express";
import cors from "cors";
//initial call to create db and tables

import bodyParser from "body-parser";
import empRoute from "./routes/employeeRoute.js";
import leaveRoute from "./routes/leaveRoutes.js";
import authRoute from "./routes/authRoute.js";
import { AppDataSource } from "./db/data-source.js";
import logger from "./utils/logger.js";

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

app.use("/api/auth", authRoute);
app.use("/api/employees", empRoute);
app.use("/api/leave", leaveRoute);

const port = 5000;

// app.listen(port, () => {
//   console.log("running", port);
// });

AppDataSource.initialize()
  .then(() => {
    logger.info(" DB connected successfully");
    console.log(" DB connected successfully");

    // Routes will be added next
    app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((err) => {
    logger.error("Error during Data Source initialization", err);
    console.error("Error during Data Source initialization", err);
  });
