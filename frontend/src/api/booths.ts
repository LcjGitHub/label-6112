import axios from "axios";
import type { Booth, BoothInput, BoothStatistics } from "@/types/booth";

const api = axios.create({ baseURL: "/api" });

let statisticsCache: { data: BoothStatistics; timestamp: number } | null = null;
const CACHE_TTL = 60 * 1000;

export async function fetchBooths(city?: string, status?: string): Promise<Booth[]> {
  const params: Record<string, string> = {};
  if (city) params.city = city;
  if (status) params.status = status;
  const { data } = await api.get<Booth[]>("/booths", { params });
  return data;
}

export async function fetchBooth(id: number): Promise<Booth> {
  const { data } = await api.get<Booth>(`/booths/${id}`);
  return data;
}

export async function fetchCities(): Promise<string[]> {
  const { data } = await api.get<string[]>("/booths/cities");
  return data;
}

export async function createBooth(input: BoothInput): Promise<Booth> {
  const { data } = await api.post<Booth>("/booths", input);
  return data;
}

export async function updateBooth(id: number, input: BoothInput): Promise<Booth> {
  const { data } = await api.put<Booth>(`/booths/${id}`, input);
  return data;
}

export async function deleteBooth(id: number): Promise<void> {
  await api.delete(`/booths/${id}`);
}

export async function fetchStatistics(): Promise<BoothStatistics> {
  const now = Date.now();
  if (statisticsCache && now - statisticsCache.timestamp < CACHE_TTL) {
    return statisticsCache.data;
  }
  const { data } = await api.get<BoothStatistics>("/booths/statistics");
  statisticsCache = { data, timestamp: now };
  return data;
}

export function invalidateStatisticsCache(): void {
  statisticsCache = null;
}
