import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import {
  Booth,
  BoothInput,
  BoothStatistics,
  BoothStatus,
  InspectionRecord,
  InspectionRecordInput,
  InspectionRecordUpdateInput,
  PaginatedResult,
} from "./types";

const dataDir = path.resolve(__dirname, "../../data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "booths.db");
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS booths (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    longitude REAL NOT NULL,
    latitude REAL NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('available', 'damaged', 'demolished')),
    discovery_date TEXT NOT NULL,
    photo_url TEXT NOT NULL DEFAULT '',
    remark TEXT
  );

  CREATE TABLE IF NOT EXISTS inspection_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booth_id INTEGER NOT NULL,
    inspector_name TEXT NOT NULL,
    inspection_date TEXT NOT NULL,
    remarks TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (booth_id) REFERENCES booths(id) ON DELETE CASCADE
  )
`);

try {
  db.exec(`ALTER TABLE booths ADD COLUMN remark TEXT`);
} catch (e) {
  // Column already exists, ignore
}

export function getAllBooths(
  city?: string,
  status?: string,
  keyword?: string,
  page: number = 1,
  pageSize: number = 10
): PaginatedResult<Booth> {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (city) {
    conditions.push("city = ?");
    params.push(city);
  }
  if (status) {
    conditions.push("status = ?");
    params.push(status);
  }
  const trimmedKeyword = keyword?.trim();
  if (trimmedKeyword) {
    const escapedKeyword = trimmedKeyword.replace(/%/g, "\\%").replace(/_/g, "\\_");
    conditions.push("address LIKE ? ESCAPE '\\'");
    params.push(`%${escapedKeyword}%`);
  }

  const whereClause = conditions.length > 0 ? " WHERE " + conditions.join(" AND ") : "";

  const countSql = "SELECT COUNT(*) as cnt FROM booths" + whereClause;
  const total = (db.prepare(countSql).get(...params) as { cnt: number }).cnt;

  const validPageSize = Math.max(1, Math.min(100, Math.floor(pageSize) || 10));
  const totalPages = Math.max(1, Math.ceil(total / validPageSize));
  let validPage = Math.max(1, Math.floor(page) || 1);
  if (validPage > totalPages) {
    validPage = totalPages;
  }
  const offset = (validPage - 1) * validPageSize;

  const dataSql = "SELECT * FROM booths" + whereClause + " ORDER BY id ASC LIMIT ? OFFSET ?";
  const dataParams = [...params, validPageSize, offset];
  const data = db.prepare(dataSql).all(...dataParams) as Booth[];

  return {
    data,
    total,
    page: validPage,
    pageSize: validPageSize,
  };
}

export function getBoothById(id: number): Booth | undefined {
  return db.prepare("SELECT * FROM booths WHERE id = ?").get(id) as Booth | undefined;
}

export function createBooth(input: BoothInput): Booth {
  const stmt = db.prepare(
    `INSERT INTO booths (city, address, longitude, latitude, status, discovery_date, photo_url, remark)
     VALUES (@city, @address, @longitude, @latitude, @status, @discovery_date, @photo_url, @remark)`
  );
  const result = stmt.run(input);
  return getBoothById(result.lastInsertRowid as number)!;
}

export function updateBooth(id: number, input: BoothInput): Booth | undefined {
  const existing = getBoothById(id);
  if (!existing) return undefined;

  db.prepare(
    `UPDATE booths SET
      city = @city, address = @address, longitude = @longitude,
      latitude = @latitude, status = @status, discovery_date = @discovery_date,
      photo_url = @photo_url, remark = @remark
     WHERE id = @id`
  ).run({ ...input, id });

  return getBoothById(id);
}

export function deleteBooth(id: number): boolean {
  const result = db.prepare("DELETE FROM booths WHERE id = ?").run(id);
  return result.changes > 0;
}

export function getInspectionsByBoothId(boothId: number): InspectionRecord[] {
  return db
    .prepare("SELECT * FROM inspection_records WHERE booth_id = ? ORDER BY inspection_date DESC, id DESC")
    .all(boothId) as InspectionRecord[];
}

export function createInspectionRecord(input: InspectionRecordInput): InspectionRecord {
  const stmt = db.prepare(
    `INSERT INTO inspection_records (booth_id, inspector_name, inspection_date, remarks)
     VALUES (@booth_id, @inspector_name, @inspection_date, @remarks)`
  );
  const result = stmt.run(input);
  return db
    .prepare("SELECT * FROM inspection_records WHERE id = ?")
    .get(result.lastInsertRowid as number) as InspectionRecord;
}

export function deleteInspectionRecord(id: number, boothId: number): boolean {
  const result = db.prepare("DELETE FROM inspection_records WHERE id = ? AND booth_id = ?").run(id, boothId);
  return result.changes > 0;
}

export function updateInspectionRecord(
  id: number,
  boothId: number,
  input: InspectionRecordUpdateInput
): InspectionRecord | undefined {
  const existing = db
    .prepare("SELECT * FROM inspection_records WHERE id = ? AND booth_id = ?")
    .get(id, boothId) as InspectionRecord | undefined;
  if (!existing) return undefined;

  db.prepare(
    "UPDATE inspection_records SET inspector_name = ?, remarks = ? WHERE id = ?"
  ).run(input.inspector_name, input.remarks, id);

  return db
    .prepare("SELECT * FROM inspection_records WHERE id = ?")
    .get(id) as InspectionRecord;
}

export function getCities(): string[] {
  const rows = db.prepare("SELECT DISTINCT city FROM booths ORDER BY city").all() as { city: string }[];
  return rows.map((r) => r.city);
}

export function getStatistics(): BoothStatistics {
  const total = (db.prepare("SELECT COUNT(*) as cnt FROM booths").get() as { cnt: number }).cnt;

  const statusRows = db.prepare("SELECT status, COUNT(*) as count FROM booths GROUP BY status").all() as { status: BoothStatus; count: number }[];
  const byStatus: Record<BoothStatus, number> = {
    available: 0,
    damaged: 0,
    demolished: 0,
  };
  for (const row of statusRows) {
    byStatus[row.status] = row.count;
  }

  const cityRows = db.prepare("SELECT city, COUNT(*) as count FROM booths GROUP BY city ORDER BY city").all() as { city: string; count: number }[];
  const byCity: Record<string, number> = {};
  for (const row of cityRows) {
    byCity[row.city] = row.count;
  }

  return { total, byStatus, byCity };
}

const BOOTH_SEED_DATA: BoothInput[] = [
  {
    city: "北京",
    address: "东城区王府井大街88号",
    longitude: 116.4174,
    latitude: 39.9092,
    status: "available",
    discovery_date: "2024-03-15",
    photo_url: "https://picsum.photos/seed/booth1/400/300",
    remark: "位于王府井步行街入口处，周边人流量大，设备运行良好",
  },
  {
    city: "上海",
    address: "黄浦区南京东路100号",
    longitude: 121.4844,
    latitude: 31.2359,
    status: "damaged",
    discovery_date: "2024-05-20",
    photo_url: "https://picsum.photos/seed/booth2/400/300",
    remark: "听筒线缆断裂，玻璃面板有裂纹，已安排维修人员处理，预计下周修复",
  },
  {
    city: "广州",
    address: "越秀区北京路168号",
    longitude: 113.2644,
    latitude: 23.1291,
    status: "available",
    discovery_date: "2024-06-08",
    photo_url: "https://picsum.photos/seed/booth3/400/300",
    remark: null,
  },
  {
    city: "深圳",
    address: "福田区深南大道5001号",
    longitude: 114.0579,
    latitude: 22.5431,
    status: "demolished",
    discovery_date: "2023-11-30",
    photo_url: "https://picsum.photos/seed/booth4/400/300",
    remark: "因市政道路扩建工程拆除，已完成注销手续，相关档案已归档保存",
  },
  {
    city: "北京",
    address: "西城区西单北大街120号",
    longitude: 116.3735,
    latitude: 39.9133,
    status: "available",
    discovery_date: "2024-08-12",
    photo_url: "https://picsum.photos/seed/booth5/400/300",
    remark: "靠近地铁4号线出口，2024年9月完成设备升级，支持新的支付功能",
  },
];

export function seedIfEmpty(): void {
  const boothCount = (db.prepare("SELECT COUNT(*) as cnt FROM booths").get() as { cnt: number }).cnt;
  const inspectionCount = (db.prepare("SELECT COUNT(*) as cnt FROM inspection_records").get() as { cnt: number }).cnt;

  if (boothCount === 0) {
    const seedData = BOOTH_SEED_DATA;

    const insert = db.prepare(
      `INSERT INTO booths (city, address, longitude, latitude, status, discovery_date, photo_url, remark)
       VALUES (@city, @address, @longitude, @latitude, @status, @discovery_date, @photo_url, @remark)`
    );

    const insertMany = db.transaction((items: BoothInput[]) => {
      for (const item of items) {
        insert.run(item);
      }
    });

    insertMany(seedData);
    console.log("Seeded 5 booth records.");
  }

  if (inspectionCount === 0) {
    const boothIds = (db.prepare("SELECT id FROM booths ORDER BY id ASC").all() as { id: number }[]).map((r) => r.id);
    const inspectors = ["张三", "李四", "王五", "赵六", "钱七", "孙八"];
    const remarksPool = [
      "设备运行正常，外观整洁",
      "发现玻璃轻微破损，已记录待维修",
      "电话功能测试通过",
      "内部卫生情况良好",
      "外部有少量涂鸦，需清理",
      "门锁略有松动，已紧固",
      "指示灯全部正常工作",
    ];

    const insertInsp = db.prepare(
      `INSERT INTO inspection_records (booth_id, inspector_name, inspection_date, remarks)
       VALUES (@booth_id, @inspector_name, @inspection_date, @remarks)`
    );

    const seedInspections = db.transaction((ids: number[]) => {
      for (let i = 0; i < ids.length; i++) {
        const boothId = ids[i];
        const count = (i % 2 === 0 ? 2 : 1);
        for (let j = 0; j < count; j++) {
          const date = new Date(2024, 8 + j, 10 + i * 3 + j * 5);
          const dateStr = date.toISOString().slice(0, 10);
          insertInsp.run({
            booth_id: boothId,
            inspector_name: inspectors[(i + j) % inspectors.length],
            inspection_date: dateStr,
            remarks: remarksPool[(i * 2 + j) % remarksPool.length],
          });
        }
      }
    });

    seedInspections(boothIds);
    const seeded = (db.prepare("SELECT COUNT(*) as cnt FROM inspection_records").get() as { cnt: number }).cnt;
    console.log(`Seeded ${seeded} inspection records.`);
  }

  try {
    const existingBooths = db.prepare("SELECT id, city, address, remark FROM booths").all() as { id: number; city: string; address: string; remark: string | null }[];
    const updateStmt = db.prepare("UPDATE booths SET remark = @remark WHERE id = @id");
    let backfilledCount = 0;

    for (const existing of existingBooths) {
      if (existing.remark === null || existing.remark.trim() === "") {
        const seedMatch = BOOTH_SEED_DATA.find(
          (s) => s.city === existing.city && s.address === existing.address
        );
        if (seedMatch && seedMatch.remark !== null) {
          updateStmt.run({ id: existing.id, remark: seedMatch.remark });
          backfilledCount++;
        }
      }
    }

    if (backfilledCount > 0) {
      console.log(`Backfilled remarks for ${backfilledCount} booth records.`);
    }
  } catch (e) {
    // Column might not exist yet, ignore
  }
}
