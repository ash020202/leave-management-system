import { createLogger, format, transports } from "winston";
import path from "path";

// Define log format
const logFormat = format.printf(({ level, message, stack }) => {
  return `[${level.toUpperCase()}] ${stack || message}`;
});

// Create logger instance
const logger = createLogger({
  level: "info",
  format: logFormat,
  transports: [
    new transports.File({
      filename: path.join("logs", "error.log"),
      level: "error", // only error logs go here
    }),
    new transports.File({
      filename: path.join("logs", "combined.log"),
    }),
    new transports.Console({
      // Console log always enabled
      format: format.combine(
        format.colorize(), // adds colors
        format.simple() // simpler output for console
      ),
    }),
  ],
});

// Optional: log to console during development
// if (process.env.NODE_ENV !== "production") {
//   logger.add(
//     new transports.Console({
//       format: format.combine(format.colorize(), format.simple()),
//     })
//   );
// }

export default logger;
