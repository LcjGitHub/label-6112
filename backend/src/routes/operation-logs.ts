import { Router, Request, Response } from "express";
import { getOperationLogs } from "../db";

const router = Router();

const VALID_PAGE_SIZES = [10, 20, 50];

router.get("/", (req: Request, res: Response) => {
  const page = Number(req.query.page);
  const pageSizeRaw = Number(req.query.pageSize);
  const pageSize = VALID_PAGE_SIZES.includes(pageSizeRaw) ? pageSizeRaw : 10;
  res.json(getOperationLogs(page, pageSize));
});

export default router;
