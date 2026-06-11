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
  updateInspectionRecord,
  deleteInspectionRecord,
} from "../db";
import {
  validateBoothInput,
  validateInspectionInput,
  validateInspectionUpdateInput,
} from "../validators/booths";

const router = Router();

const VALID_PAGE_SIZES = [10, 20, 50];

function parseId(raw: string | string[]): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function sendInvalidId(res: Response): void {
  res.status(400).json({ error: "Invalid id" });
}

function sendBoothNotFound(res: Response): void {
  res.status(404).json({ error: "Booth not found" });
}

router.get("/", (req: Request, res: Response) => {
  const city = req.query.city as string | undefined;
  const status = req.query.status as string | undefined;
  const keyword = req.query.keyword as string | undefined;
  const page = Number(req.query.page);
  const pageSizeRaw = Number(req.query.pageSize);
  const pageSize = VALID_PAGE_SIZES.includes(pageSizeRaw) ? pageSizeRaw : 10;
  const sortFieldRaw = req.query.sortField as string | undefined;
  const sortDirectionRaw = req.query.sortDirection as string | undefined;
  const VALID_SORT_FIELDS = ["discovery_date", "city"];
  const VALID_SORT_DIRECTIONS = ["asc", "desc"];
  const sortField = VALID_SORT_FIELDS.includes(sortFieldRaw as string) ? sortFieldRaw : undefined;
  const sortDirection = VALID_SORT_DIRECTIONS.includes(sortDirectionRaw as string) ? sortDirectionRaw : "asc";
  res.json(getAllBooths(city, status, keyword, page, pageSize, sortField as "discovery_date" | "city" | undefined, sortDirection as "asc" | "desc"));
});

router.get("/cities", (_req: Request, res: Response) => {
  res.json(getCities());
});

router.get("/statistics", (_req: Request, res: Response) => {
  res.json(getStatistics());
});

router.get("/:id", (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (id === null) { sendInvalidId(res); return; }
  const booth = getBoothById(id);
  if (!booth) { sendBoothNotFound(res); return; }
  res.json(booth);
});

router.post("/", (req: Request, res: Response) => {
  const result = validateBoothInput(req.body);
  if (!result.input) {
    res.status(400).json({ error: "校验失败", details: result.errors });
    return;
  }
  res.status(201).json(createBooth(result.input));
});

router.put("/:id", (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (id === null) { sendInvalidId(res); return; }
  const result = validateBoothInput(req.body);
  if (!result.input) {
    res.status(400).json({ error: "校验失败", details: result.errors });
    return;
  }
  const booth = updateBooth(id, result.input);
  if (!booth) { sendBoothNotFound(res); return; }
  res.json(booth);
});

router.delete("/:id", (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (id === null) { sendInvalidId(res); return; }
  if (!deleteBooth(id)) { sendBoothNotFound(res); return; }
  res.status(204).send();
});

router.get("/:id/inspections", (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (id === null) { sendInvalidId(res); return; }
  if (!getBoothById(id)) { sendBoothNotFound(res); return; }
  res.json(getInspectionsByBoothId(id));
});

router.post("/:id/inspections", (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (id === null) { sendInvalidId(res); return; }
  if (!getBoothById(id)) { sendBoothNotFound(res); return; }
  const result = validateInspectionInput(req.body, id);
  if (!result.input) {
    res.status(400).json({ error: "Validation failed", details: result.errors });
    return;
  }
  res.status(201).json(createInspectionRecord(result.input));
});

router.put("/:id/inspections/:recordId", (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const recordId = parseId(req.params.recordId);
  if (id === null || recordId === null) { sendInvalidId(res); return; }
  if (!getBoothById(id)) { sendBoothNotFound(res); return; }
  const result = validateInspectionUpdateInput(req.body);
  if (!result.input) {
    res.status(400).json({ error: "Validation failed", details: result.errors });
    return;
  }
  const record = updateInspectionRecord(recordId, id, result.input);
  if (!record) {
    res.status(404).json({ error: "Inspection record not found" });
    return;
  }
  res.json(record);
});

router.delete("/:id/inspections/:recordId", (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const recordId = parseId(req.params.recordId);
  if (id === null || recordId === null) { sendInvalidId(res); return; }
  if (!getBoothById(id)) { sendBoothNotFound(res); return; }
  if (!deleteInspectionRecord(recordId, id)) {
    res.status(404).json({ error: "Inspection record not found" });
    return;
  }
  res.status(204).send();
});

export default router;
