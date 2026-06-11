import axios from "axios";
import type { Booth, BoothInput, BoothSortField, BoothStatistics, InspectionRecord, InspectionRecordInput, InspectionRecordUpdateInput, OperationLog, PaginatedResult, SortDirection } from "@/types/booth";

const api = axios.create({ baseURL: "/api" });

export async function fetchBooths(
  city?: string,
  status?: string,
  keyword?: string,
  page: number = 1,
  pageSize: number = 10,
  sortField?: BoothSortField,
  sortDirection: SortDirection = "asc"
): Promise<PaginatedResult<Booth>> {
  const params: Record<string, string | number> = {};
  if (city) params.city = city;
  if (status) params.status = status;
  const trimmedKeyword = keyword?.trim();
  if (trimmedKeyword) params.keyword = trimmedKeyword;
  params.page = page;
  params.pageSize = pageSize;
  if (sortField) params.sortField = sortField;
  params.sortDirection = sortDirection;
  const { data } = await api.get<PaginatedResult<Booth>>("/booths", { params });
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

export async function updateInspection(
  boothId: number,
  recordId: number,
  input: InspectionRecordUpdateInput
): Promise<InspectionRecord> {
  const { data } = await api.put<InspectionRecord>(`/booths/${boothId}/inspections/${recordId}`, input);
  return data;
}

export async function exportBoothsCsv(
  city?: string,
  status?: string,
  keyword?: string
): Promise<void> {
  const params: Record<string, string> = {};
  if (city) params.city = city;
  if (status) params.status = status;
  const trimmedKeyword = keyword?.trim();
  if (trimmedKeyword) params.keyword = trimmedKeyword;

  const { data } = await api.get<Blob>("/booths/export", {
    params,
    responseType: "blob",
  });

  const today = new Date().toISOString().slice(0, 10);
  const filename = `电话亭数据_${today}.csv`;

  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function fetchOperationLogs(
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResult<OperationLog>> {
  const params: Record<string, number> = {
    page,
    pageSize,
  };
  const { data } = await api.get<PaginatedResult<OperationLog>>("/operation-logs", { params });
  return data;
}
