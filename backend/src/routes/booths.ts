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
import { BoothInput, BoothStatus, InspectionRecordInput, InspectionRecordUpdateInput } from "../types";

const router = Router();

const VALID_STATUSES: BoothStatus[] = ["available", "damaged", "demolished"];

function validateInput(body: Record<string, unknown>): BoothInput | null {
  const { city, address, longitude, latitude, status, discovery_date, photo_url, remark } = body;
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
    remark: typeof remark === "string" && remark.trim() !== "" ? remark.trim() : null,
  };
}

function validateInspectorAndRemarks(
  inspector_name: unknown,
  remarks: unknown
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (typeof inspector_name !== "string" || inspector_name.trim().length === 0) {
    errors.inspector_name = "请输入巡检人姓名";
  }
  if (typeof remarks !== "string" || remarks.trim().length === 0) {
    errors.remarks = "请输入备注说明";
  } else if (remarks.trim().length > 500) {
    errors.remarks = "备注不能超过500字";
  }
  return errors;
}

function validateInspectionInput(
  body: Record<string, unknown>,
  boothId: number
): { input: InspectionRecordInput; errors: Record<string, string> } | { input: null; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const { inspector_name, inspection_date, remarks } = body;

  const sharedErrors = validateInspectorAndRemarks(inspector_name, remarks);
  Object.assign(errors, sharedErrors);

  if (typeof inspection_date !== "string" || inspection_date.trim().length === 0) {
    errors.inspection_date = "请选择巡检日期";
  }

  if (Object.keys(errors).length > 0) {
    return { input: null, errors };
  }

  return {
    input: {
      booth_id: boothId,
      inspector_name: (inspector_name as string).trim(),
      inspection_date: (inspection_date as string).trim(),
      remarks: (remarks as string).trim(),
    },
    errors,
  };
}

function validateInspectionUpdateInput(
  body: Record<string, unknown>
): { input: InspectionRecordUpdateInput; errors: Record<string, string> } | { input: null; errors: Record<string, string> } {
  const { inspector_name, remarks } = body;
  const errors = validateInspectorAndRemarks(inspector_name, remarks);

  if (Object.keys(errors).length > 0) {
    return { input: null, errors };
  }

  return {
    input: {
      inspector_name: (inspector_name as string).trim(),
      remarks: (remarks as string).trim(),
    },
    errors,
  };
}

router.get("/", (req: Request, res: Response) => {
  const city = req.query.city as string | undefined;
  const status = req.query.status as string | undefined;
  const keyword = req.query.keyword as string | undefined;
  const page = Number(req.query.page);
  const pageSize = Number(req.query.pageSize);
  const result = getAllBooths(city, status, keyword, page, pageSize);
  res.json(result);
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
  const result = validateInspectionInput(req.body, id);
  if (!result.input) {
    res.status(400).json({ error: "Validation failed", details: result.errors });
    return;
  }
  const record = createInspectionRecord(result.input);
  res.status(201).json(record);
});

router.put("/:id/inspections/:recordId", (req: Request, res: Response) => {
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
  const deleted = deleteInspectionRecord(recordId, id);
  if (!deleted) {
    res.status(404).json({ error: "Inspection record not found" });
    return;
  }
  res.status(204).send();
});

export default router;
