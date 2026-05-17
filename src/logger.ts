import pino from "pino";
import { config } from "./config.js";

const logger = pino({
  level: config.logging.level,
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname",
      singleLine: false,
    },
  },
});

export default logger;
