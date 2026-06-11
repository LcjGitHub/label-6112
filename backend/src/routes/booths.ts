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
const VALID_PAGE_SIZES = [10, 20, 50];

function validateInput(body: Record<string, unknown>): { input: BoothInput; errors: Record<string, string> } | { input: null; errors: Record<string, string> } {
  const { city, address, longitude, latitude, status, discovery_date, photo_url, remark } = body;
  const errors: Record<string, string> = {};

  if (typeof city !== "string" || city.trim().length === 0) {
    errors.city = "请输入城市";
  }
  if (typeof address !== "string" || address.trim().length === 0) {
    errors.address = "请输入地址";
  }
  if (typeof longitude !== "number") {
    errors.longitude = "请输入有效经度";
  }
  if (typeof latitude !== "number") {
    errors.latitude = "请输入有效纬度";
  }
  if (typeof status !== "string" || !VALID_STATUSES.includes(status as BoothStatus)) {
    errors.status = "请选择有效状态";
  }
  if (typeof discovery_date !== "string" || discovery_date.trim().length === 0) {
    errors.discovery_date = "请输入发现日期";
  }
  if (typeof remark === "string" && remark.trim().length > 200) {
    errors.remark = "备注不能超过200字";
  }

  if (Object.keys(errors).length > 0) {
    return { input: null, errors };
  }

  return {
    input: {
      city: (city as string).trim(),
      address: (address as string).trim(),
      longitude: longitude as number,
      latitude: latitude as number,
      status: status as BoothStatus,
      discovery_date: (discovery_date as string).trim(),
      photo_url: typeof photo_url === "string" ? photo_url : "",
      remark: typeof remark === "string" && remark.trim() !== "" ? (remark as string).trim() : null,
    },
    errors,
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
  const pageSizeRaw = Number(req.query.pageSize);
  const pageSize = VALID_PAGE_SIZES.includes(pageSizeRaw) ? pageSizeRaw : 10;
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
  const result = validateInput(req.body);
  if (!result.input) {
    res.status(400).json({ error: "Validation failed", details: result.errors });
    return;
  }
  const booth = createBooth(result.input);
  res.status(201).json(booth);
});

router.put("/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const result = validateInput(req.body);
  if (!result.input) {
    res.status(400).json({ error: "Validation failed", details: result.errors });
    return;
  }
  const booth = updateBooth(id, result.input);
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
