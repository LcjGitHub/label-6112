export type BoothStatus = "available" | "damaged" | "demolished";

export type BoothSortField = "discovery_date" | "city";
export type SortDirection = "asc" | "desc";

export interface LatestInspection {
  inspector_name: string;
  inspection_date: string;
  remarks: string;
}

export interface Booth {
  id: number;
  city: string;
  address: string;
  longitude: number;
  latitude: number;
  status: BoothStatus;
  discovery_date: string;
  photo_url: string;
  remark: string | null;
  inspection_count?: number;
  latest_inspection?: LatestInspection | null;
}

export interface BoothInput {
  city: string;
  address: string;
  longitude: number;
  latitude: number;
  status: BoothStatus;
  discovery_date: string;
  photo_url: string;
  remark: string | null;
}

export interface BoothStatistics {
  total: number;
  byStatus: Record<BoothStatus, number>;
  byCity: Record<string, number>;
}

export const STATUS_LABELS: Record<BoothStatus, string> = {
  available: "可用",
  damaged: "损坏",
  demolished: "已拆",
};

export interface InspectionRecord {
  id: number;
  booth_id: number;
  inspector_name: string;
  inspection_date: string;
  remarks: string;
}

export interface InspectionRecordInput {
  inspector_name: string;
  inspection_date: string;
  remarks: string;
}

export interface InspectionRecordUpdateInput {
  inspector_name: string;
  remarks: string;
}

export type OperationType = "create" | "update" | "delete";

export interface OperationLog {
  id: number;
  operation_type: OperationType;
  booth_id: number;
  booth_address: string;
  summary: string;
  created_at: string;
}

export const OPERATION_TYPE_LABELS: Record<OperationType, string> = {
  create: "创建",
  update: "更新",
  delete: "删除",
};

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Favorite {
  id: number;
  session_key: string;
  booth_id: number;
  created_at: string;
}

export interface FavoriteBooth extends Booth {
  favorited_at: string;
}
