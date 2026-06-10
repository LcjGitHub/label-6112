import { Router, Request, Response } from "express";
import {
  getAllBooths,
  getBoothById,
  createBooth,
  updateBooth,
  deleteBooth,
  getCities,
} from "../db";
import { BoothInput, BoothStatus } from "../types";

const router = Router();

const VALID_STATUSES: BoothStatus[] = ["available", "damaged", "demolished"];

function validateInput(body: Record<string, unknown>): BoothInput | null {
  const { city, address, longitude, latitude, status, discovery_date, photo_url } = body;
  if (
    typeof city !== "string" ||
    typeof address !== "string" ||
    typeof longitude !== "number" ||
    typeof latitude !== "number" ||
    typeof status !== "string" ||
    !VALID_STATUSES.includes(status as BoothStatus) ||
    typeof discovery_date !== "string"
  ) {
    return null;
  }
  return {
    city,
    address,
    longitude,
    latitude,
    status: status as BoothStatus,
    discovery_date,
    photo_url: typeof photo_url === "string" ? photo_url : "",
  };
}

router.get("/", (req: Request, res: Response) => {
  const city = req.query.city as string | undefined;
  const status = req.query.status as string | undefined;
  const booths = getAllBooths(city, status);
  res.json(booths);
});

router.get("/cities", (_req: Request, res: Response) => {
  res.json(getCities());
});

router.get("/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const booth = getBoothById(id);
  if (!booth) {
    res.status(404).json({ error: "Booth not found" });
    return;
  }
  res.json(booth);
});

router.post("/", (req: Request, res: Response) => {
  const input = validateInput(req.body);
  if (!input) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const booth = createBooth(input);
  res.status(201).json(booth);
});

router.put("/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const input = validateInput(req.body);
  if (!input) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const booth = updateBooth(id, input);
  if (!booth) {
    res.status(404).json({ error: "Booth not found" });
    return;
  }
  res.json(booth);
});

router.delete("/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const deleted = deleteBooth(id);
  if (!deleted) {
    res.status(404).json({ error: "Booth not found" });
    return;
  }
  res.status(204).send();
});

export default router;
