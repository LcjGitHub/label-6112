import express from "express";
import cors from "cors";
import boothsRouter from "./routes/booths";
import { seedIfEmpty } from "./db";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

seedIfEmpty();

app.use("/api/booths", boothsRouter);

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
