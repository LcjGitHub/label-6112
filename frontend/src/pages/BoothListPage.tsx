import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { MapPin, Plus, Trash2, BarChart3, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchBooths, fetchCities, createBooth, deleteBooth } from "@/api/booths";
import { BoothForm } from "@/components/BoothForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HighlightText } from "@/components/HighlightText";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Booth, BoothStatus, PaginatedResult } from "@/types/booth";
import { STATUS_LABELS } from "@/types/booth";

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50];

function parsePageSizeFromParams(params: URLSearchParams): number {
  const raw = Number(params.get("pageSize"));
  return PAGE_SIZE_OPTIONS.includes(raw) ? raw : DEFAULT_PAGE_SIZE;
}

function parsePageFromParams(params: URLSearchParams): number {
  const raw = Number(params.get("page"));
  return Number.isInteger(raw) && raw >= 1 ? raw : 1;
}

export function BoothListPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [city, setCity] = useState<string>(searchParams.get("city") || "");
  const [status, setStatus] = useState<string>(searchParams.get("status") || "");
  const [keywordInput, setKeywordInput] = useState<string>(searchParams.get("keyword") || "");
  const [debouncedKeyword, setDebouncedKeyword] = useState<string>(searchParams.get("keyword") || "");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState<number>(parsePageFromParams(searchParams));
  const [pageSize, setPageSize] = useState<number>(parsePageSizeFromParams(searchParams));

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setKeywordInput(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const trimmed = value.trim();
      setDebouncedKeyword(trimmed);
      setPage(1);
      syncToUrl(city, status, trimmed, 1, pageSize);
    }, 300);
  };

  const syncToUrl = (
    cityValue: string,
    statusValue: string,
    keywordValue: string,
    pageValue: number,
    pageSizeValue: number
  ) => {
    const params: Record<string, string> = {};
    if (cityValue) params.city = cityValue;
    if (statusValue) params.status = statusValue;
    if (keywordValue) params.keyword = keywordValue;
    if (pageValue > 1) params.page = String(pageValue);
    if (pageSizeValue !== DEFAULT_PAGE_SIZE) params.pageSize = String(pageSizeValue);
    setSearchParams(params);
  };

  const handleCityChange = (v: string) => {
    const newCity = v === "all" ? "" : v;
    setCity(newCity);
    setPage(1);
    syncToUrl(newCity, status, debouncedKeyword, 1, pageSize);
  };

  const handleStatusChange = (v: string) => {
    const newStatus = v === "all" ? "" : v;
    setStatus(newStatus);
    setPage(1);
    syncToUrl(city, newStatus, debouncedKeyword, 1, pageSize);
  };

  const handlePageSizeChange = (v: string) => {
    const newPageSize = Number(v);
    setPageSize(newPageSize);
    setPage(1);
    syncToUrl(city, status, debouncedKeyword, 1, newPageSize);
  };

  const { data: cities = [] } = useQuery({
    queryKey: ["cities"],
    queryFn: fetchCities,
  });

  const emptyResult: PaginatedResult<Booth> = { data: [], total: 0, page: 1, pageSize: DEFAULT_PAGE_SIZE };
  const { data: paginatedResult = emptyResult, isLoading, isError, isFetching } = useQuery({
    queryKey: ["booths", city, status, debouncedKeyword, page, pageSize],
    queryFn: () => fetchBooths(city || undefined, status || undefined, debouncedKeyword || undefined, page, pageSize),
  });

  const { data: booths = [], total = 0, page: currentPage, pageSize: currentPageSize } = paginatedResult;
  const totalPages = Math.max(1, Math.ceil(total / currentPageSize));

  useEffect(() => {
    document.title = "电话亭档案";
  }, []);

  useEffect(() => {
    const cityParam = searchParams.get("city");
    const statusParam = searchParams.get("status");
    const keywordParam = searchParams.get("keyword");
    const pageParam = parsePageFromParams(searchParams);
    const pageSizeParam = parsePageSizeFromParams(searchParams);
    if (cityParam !== city) setCity(cityParam || "");
    if (statusParam !== status) setStatus(statusParam || "");
    if (keywordParam !== debouncedKeyword) {
      setDebouncedKeyword(keywordParam || "");
      setKeywordInput(keywordParam || "");
    }
    if (pageParam !== page) setPage(pageParam);
    if (pageSizeParam !== pageSize) setPageSize(pageSizeParam);
  }, [searchParams]);

  useEffect(() => {
    if (!isLoading && page > 1 && currentPage < page) {
      setPage(1);
    }
  }, [isLoading, currentPage, page]);

  const createMutation = useMutation({
    mutationFn: createBooth,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booths"] });
      queryClient.invalidateQueries({ queryKey: ["cities"] });
      queryClient.invalidateQueries({ queryKey: ["statistics"] });
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBooth,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booths"] });
      queryClient.invalidateQueries({ queryKey: ["cities"] });
      queryClient.invalidateQueries({ queryKey: ["statistics"] });
    },
  });

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setPage(newPage);
      syncToUrl(city, status, debouncedKeyword, newPage, pageSize);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setPage(newPage);
      syncToUrl(city, status, debouncedKeyword, newPage, pageSize);
    }
  };

  const rangeStart = total === 0 ? 0 : (currentPage - 1) * currentPageSize + 1;
  const rangeEnd = Math.min(currentPage * currentPageSize, total);

  const showTableLoading = isFetching;

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">电话亭档案</h1>
        </div>
        <div className="flex gap-2">
          <Link to="/statistics">
            <Button variant="outline">
              <BarChart3 className="h-4 w-4" />
              数据统计
            </Button>
          </Link>
          <Button onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" />
            新增电话亭
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">新增电话亭</CardTitle>
          </CardHeader>
          <CardContent>
            <BoothForm
              onSubmit={(values) => createMutation.mutate(values)}
              onCancel={() => setShowForm(false)}
              submitLabel="创建"
              isSubmitting={createMutation.isPending}
            />
          </CardContent>
        </Card>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="w-48">
          <Select
            value={city || "all"}
            onValueChange={handleCityChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="筛选城市" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部城市</SelectItem>
              {cities.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <Select
            value={status || "all"}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="筛选状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              {(Object.keys(STATUS_LABELS) as BoothStatus[]).map((s) => (
                <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索地址..."
            value={keywordInput}
            onChange={handleKeywordChange}
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isError && <p className="p-6 text-destructive">加载失败，请确认后端已启动。</p>}
          {!isError && (
            <>
              <div className="relative">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>城市</TableHead>
                      <TableHead>地址</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>发现日期</TableHead>
                      <TableHead>备注</TableHead>
                      <TableHead className="w-24">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {showTableLoading && booths.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          加载中...
                        </TableCell>
                      </TableRow>
                    ) : booths.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          {city || status || debouncedKeyword ? "未找到匹配地址" : "暂无数据"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      booths.map((booth) => (
                        <TableRow key={booth.id}>
                          <TableCell>{booth.city}</TableCell>
                          <TableCell>
                            <Link
                              to={`/booths/${booth.id}`}
                              className="hover:underline"
                            >
                              <HighlightText
                                text={booth.address}
                                keyword={keywordInput.trim()}
                              />
                            </Link>
                          </TableCell>
                          <TableCell>{STATUS_LABELS[booth.status]}</TableCell>
                          <TableCell>{booth.discovery_date}</TableCell>
                          <TableCell>
                            {booth.remark ? (
                              <TooltipProvider delayDuration={200}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="cursor-default">
                                      {booth.remark.length > 30 ? booth.remark.slice(0, 30) + "..." : booth.remark}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    {booth.remark}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm("确认删除该电话亭？")) {
                                  deleteMutation.mutate(booth.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                {showTableLoading && booths.length > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                    <p className="text-sm text-muted-foreground">加载中...</p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-t border-border">
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span>
                    共 <span className="font-medium text-foreground">{total}</span> 条，
                    显示 <span className="font-medium text-foreground">{rangeStart}</span>
                    {" - "}
                    <span className="font-medium text-foreground">{rangeEnd}</span> 条
                  </span>
                  <div className="flex items-center gap-2">
                    <span>每页</span>
                    <Select
                      value={String(currentPageSize)}
                      onValueChange={handlePageSizeChange}
                    >
                      <SelectTrigger className="w-20 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAGE_SIZE_OPTIONS.map((size) => (
                          <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span>条</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    第 <span className="font-medium text-foreground">{currentPage}</span> / {totalPages} 页
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={currentPage <= 1}
                    className="h-8 gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    上一页
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages}
                    className="h-8 gap-1"
                  >
                    下一页
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
