import express from "express";
import cors from "cors";
import boothsRouter from "./routes/booths";
import { seedIfEmpty } from "./db";

export function createApp(): express.Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use("/api/booths", boothsRouter);

  return app;
}

if (require.main === module) {
  const app = createApp();
  const PORT = 3000;

  seedIfEmpty();

  app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
  });
}
