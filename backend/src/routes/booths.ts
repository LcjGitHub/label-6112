import { Router, Request, Response } from "express";
import {
  getAllBooths,
  getBoothById,
  createBooth,
  updateBooth,
  deleteBooth,
  getCities,
  getStatistics,
  getInspectionsByBoothId,
  createInspectionRecord,
  deleteInspectionRecord,
} from "../db";
import { BoothInput, BoothStatus, InspectionRecordInput } from "../types";

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

function validateInspectionInput(
  body: Record<string, unknown>,
  boothId: number
): InspectionRecordInput | null {
  const { inspector_name, inspection_date, remarks } = body;
  if (
    typeof inspector_name !== "string" ||
    inspector_name.trim().length === 0 ||
    typeof inspection_date !== "string" ||
    inspection_date.trim().length === 0
  ) {
    return null;
  }
  return {
    booth_id: boothId,
    inspector_name: inspector_name.trim(),
    inspection_date: inspection_date.trim(),
    remarks: typeof remarks === "string" ? remarks : "",
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

router.get("/statistics", (_req: Request, res: Response) => {
  res.json(getStatistics());
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

router.get("/:id/inspections", (req: Request, res: Response) => {
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
  const inspections = getInspectionsByBoothId(id);
  res.json(inspections);
});

router.post("/:id/inspections", (req: Request, res: Response) => {
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
  const input = validateInspectionInput(req.body, id);
  if (!input) {
    res.status(400).json({ error: "Invalid input: inspector_name and inspection_date are required" });
    return;
  }
  const record = createInspectionRecord(input);
  res.status(201).json(record);
});

router.delete("/:id/inspections/:recordId", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const recordId = Number(req.params.recordId);
  if (Number.isNaN(id) || Number.isNaN(recordId)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const booth = getBoothById(id);
  if (!booth) {
    res.status(404).json({ error: "Booth not found" });
    return;
  }
  const deleted = deleteInspectionRecord(recordId);
  if (!deleted) {
    res.status(404).json({ error: "Inspection record not found" });
    return;
  }
  res.status(204).send();
});

export default router;
