import "dotenv/config";
import { app } from "./app.js";
import { assertDbConnection } from "./config/db.js";
import { logger } from "./config/logger.js";

const port = Number(process.env.PORT ?? 3000);

async function start() {
  await assertDbConnection();
  app.listen(port, () => {
    logger.info(`Payment backend listening on port ${port}`);
  });
}

start().catch((error) => {
  logger.error("Failed to start server", { message: error.message, stack: error.stack });
  process.exit(1);
});
