export type BoothStatus = "available" | "damaged" | "demolished";

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

export interface InspectionRecord {
  id: number;
  booth_id: number;
  inspector_name: string;
  inspection_date: string;
  remarks: string;
}

export interface InspectionRecordInput {
  booth_id: number;
  inspector_name: string;
  inspection_date: string;
  remarks: string;
}

export interface InspectionRecordUpdateInput {
  inspector_name: string;
  remarks: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
