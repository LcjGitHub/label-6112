import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { MapPin, Plus, Trash2, BarChart3, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchBooths, fetchCities, createBooth, deleteBooth } from "@/api/booths";
import { BoothForm } from "@/components/BoothForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { Booth, BoothStatus, PaginatedResult } from "@/types/booth";
import { STATUS_LABELS } from "@/types/booth";

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

export function BoothListPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [city, setCity] = useState<string>(searchParams.get("city") || "");
  const [status, setStatus] = useState<string>("");
  const [keywordInput, setKeywordInput] = useState<string>("");
  const [debouncedKeyword, setDebouncedKeyword] = useState<string>("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedKeyword(keywordInput.trim());
      setPage(1);
    }, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [keywordInput]);

  const handleCityChange = (v: string) => {
    const newCity = v === "all" ? "" : v;
    setCity(newCity);
    setPage(1);
    if (newCity) {
      setSearchParams({ city: newCity });
    } else {
      setSearchParams({});
    }
  };

  const handleStatusChange = (v: string) => {
    setStatus(v === "all" ? "" : v);
    setPage(1);
  };

  const handlePageSizeChange = (v: string) => {
    setPageSize(Number(v));
    setPage(1);
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
    const cityParam = searchParams.get("city");
    if (cityParam !== null && cityParam !== city) {
      setCity(cityParam);
      setPage(1);
    }
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
    if (currentPage > 1) setPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setPage(currentPage + 1);
  };

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
            onChange={(e) => setKeywordInput(e.target.value)}
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
                              className="text-primary hover:underline"
                            >
                              {booth.address}
                            </Link>
                          </TableCell>
                          <TableCell>{STATUS_LABELS[booth.status]}</TableCell>
                          <TableCell>{booth.discovery_date}</TableCell>
                          <TableCell title={booth.remark || undefined}>
                            {booth.remark && booth.remark.length > 30
                              ? booth.remark.slice(0, 30) + "..."
                              : booth.remark || "-"}
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
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>共 <span className="font-medium text-foreground">{total}</span> 条</span>
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
