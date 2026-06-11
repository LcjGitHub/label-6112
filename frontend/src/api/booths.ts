import axios from "axios";
import type { Booth, BoothInput, BoothStatistics, InspectionRecord, InspectionRecordInput } from "@/types/booth";

const api = axios.create({ baseURL: "/api" });

export async function fetchBooths(city?: string, status?: string, keyword?: string): Promise<Booth[]> {
  const params: Record<string, string> = {};
  if (city) params.city = city;
  if (status) params.status = status;
  if (keyword) params.keyword = keyword;
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
  const { data } = await api.get<BoothStatistics>("/booths/statistics");
  return data;
}

export async function fetchInspections(boothId: number): Promise<InspectionRecord[]> {
  const { data } = await api.get<InspectionRecord[]>(`/booths/${boothId}/inspections`);
  return data;
}

export async function createInspection(
  boothId: number,
  input: InspectionRecordInput
): Promise<InspectionRecord> {
  const { data } = await api.post<InspectionRecord>(`/booths/${boothId}/inspections`, input);
  return data;
}

export async function deleteInspection(boothId: number, recordId: number): Promise<void> {
  await api.delete(`/booths/${boothId}/inspections/${recordId}`);
}
