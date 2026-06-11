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
  getBoothsForExport,
  getFavorites,
  getFavoriteIds,
  addFavorite,
  removeFavorite,
  isFavorited,
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

const STATUS_LABELS: Record<string, string> = {
  available: "可用",
  damaged: "损坏",
  demolished: "已拆",
};

function escapeCsvField(value: string | number | null | undefined): string {
  const str = value == null ? "" : String(value);
  if (str.includes('"') || str.includes(",") || str.includes("\n") || str.includes("\r")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

router.get("/export", (req: Request, res: Response) => {
  const city = req.query.city as string | undefined;
  const status = req.query.status as string | undefined;
  const keyword = req.query.keyword as string | undefined;

  const booths = getBoothsForExport(city, status, keyword);

  const headers = ["ID", "城市", "地址", "经度", "纬度", "状态", "发现日期", "备注"];
  const rows = booths.map((b) =>
    [
      escapeCsvField(b.id),
      escapeCsvField(b.city),
      escapeCsvField(b.address),
      escapeCsvField(b.longitude),
      escapeCsvField(b.latitude),
      escapeCsvField(STATUS_LABELS[b.status] || b.status),
      escapeCsvField(b.discovery_date),
      escapeCsvField(b.remark),
    ].join(",")
  );

  const bom = "\uFEFF";
  const csv = bom + headers.join(",") + "\n" + rows.join("\n");

  const today = new Date().toISOString().slice(0, 10);
  const filename = encodeURIComponent(`电话亭数据_${today}.csv`);

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"; filename*=UTF-8''${filename}`);
  res.send(csv);
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

function extractSessionKey(req: Request): string | null {
  const header = req.header("X-Session-Key");
  if (header && header.trim()) return header.trim();
  const query = req.query.session_key as string | undefined;
  if (query && query.trim()) return query.trim();
  return null;
}

function sendInvalidSessionKey(res: Response): void {
  res.status(400).json({ error: "Missing or invalid session key (use X-Session-Key header or session_key query)" });
}

router.get("/favorites/list", (req: Request, res: Response) => {
  const sessionKey = extractSessionKey(req);
  if (!sessionKey) { sendInvalidSessionKey(res); return; }
  res.json(getFavorites(sessionKey));
});

router.get("/favorites/ids", (req: Request, res: Response) => {
  const sessionKey = extractSessionKey(req);
  if (!sessionKey) { sendInvalidSessionKey(res); return; }
  res.json(getFavoriteIds(sessionKey));
});

router.post("/:id/favorite", (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (id === null) { sendInvalidId(res); return; }
  const sessionKey = extractSessionKey(req);
  if (!sessionKey) { sendInvalidSessionKey(res); return; }
  if (!getBoothById(id)) { sendBoothNotFound(res); return; }
  const result = addFavorite(sessionKey, id);
  if (!result) {
    res.status(409).json({ error: "Failed to add favorite" });
    return;
  }
  res.status(201).json(result);
});

router.delete("/:id/favorite", (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (id === null) { sendInvalidId(res); return; }
  const sessionKey = extractSessionKey(req);
  if (!sessionKey) { sendInvalidSessionKey(res); return; }
  if (!getBoothById(id)) { sendBoothNotFound(res); return; }
  const removed = removeFavorite(sessionKey, id);
  if (!removed) {
    res.status(404).json({ error: "Favorite not found" });
    return;
  }
  res.status(204).send();
});

router.get("/:id/favorite", (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (id === null) { sendInvalidId(res); return; }
  const sessionKey = extractSessionKey(req);
  if (!sessionKey) { sendInvalidSessionKey(res); return; }
  if (!getBoothById(id)) { sendBoothNotFound(res); return; }
  res.json({ favorited: isFavorited(sessionKey, id) });
});

export default router;
