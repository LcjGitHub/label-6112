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
}

export interface BoothInput {
  city: string;
  address: string;
  longitude: number;
  latitude: number;
  status: BoothStatus;
  discovery_date: string;
  photo_url: string;
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
