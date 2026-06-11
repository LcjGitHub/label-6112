import axios from "axios";
import type { Booth, BoothInput, BoothSortField, BoothStatistics, Favorite, FavoriteBooth, InspectionRecord, InspectionRecordInput, InspectionRecordUpdateInput, OperationLog, PaginatedResult, RecentInspection, SortDirection, Tag } from "@/types/booth";
import { getSessionKey } from "@/lib/session";

const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const key = getSessionKey();
  if (key) {
    config.headers["X-Session-Key"] = key;
  }
  return config;
});

export async function fetchBooths(
  city?: string,
  status?: string,
  keyword?: string,
  page: number = 1,
  pageSize: number = 10,
  sortField?: BoothSortField,
  sortDirection: SortDirection = "asc",
  tagId?: number
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
  if (tagId !== undefined) params.tagId = tagId;
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

export async function fetchRecentInspections(limit: number = 20): Promise<RecentInspection[]> {
  const params: Record<string, number> = {};
  if (limit > 0) params.limit = limit;
  const { data } = await api.get<RecentInspection[]>("/booths/inspections/recent", { params });
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
  keyword?: string,
  tagId?: number
): Promise<void> {
  const params: Record<string, string | number> = {};
  if (city) params.city = city;
  if (status) params.status = status;
  const trimmedKeyword = keyword?.trim();
  if (trimmedKeyword) params.keyword = trimmedKeyword;
  if (tagId !== undefined) params.tagId = tagId;

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

export async function fetchFavorites(): Promise<FavoriteBooth[]> {
  const { data } = await api.get<FavoriteBooth[]>("/booths/favorites/list");
  return data;
}

export async function fetchFavoriteIds(): Promise<number[]> {
  const { data } = await api.get<number[]>("/booths/favorites/ids");
  return data;
}

export async function checkFavorite(boothId: number): Promise<boolean> {
  const { data } = await api.get<{ favorited: boolean }>(`/booths/${boothId}/favorite`);
  return data.favorited;
}

export async function addFavorite(boothId: number): Promise<Favorite> {
  const { data } = await api.post<Favorite>(`/booths/${boothId}/favorite`);
  return data;
}

export async function removeFavorite(boothId: number): Promise<void> {
  await api.delete(`/booths/${boothId}/favorite`);
}

export async function toggleFavorite(boothId: number, isCurrentlyFavorited: boolean): Promise<boolean> {
  if (isCurrentlyFavorited) {
    await removeFavorite(boothId);
    return false;
  } else {
    await addFavorite(boothId);
    return true;
  }
}

export async function fetchAllTags(): Promise<Tag[]> {
  const { data } = await api.get<Tag[]>("/booths/tags/list");
  return data;
}

export async function fetchBoothTags(boothId: number): Promise<Tag[]> {
  const { data } = await api.get<Tag[]>(`/booths/${boothId}/tags`);
  return data;
}

export async function setBoothTags(boothId: number, tagNames: string[]): Promise<Tag[]> {
  const { data } = await api.put<Tag[]>(`/booths/${boothId}/tags`, { tag_names: tagNames });
  return data;
}
