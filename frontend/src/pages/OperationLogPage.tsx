import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchOperationLogs } from "@/api/booths";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OperationLog, PaginatedResult } from "@/types/booth";
import { OPERATION_TYPE_LABELS } from "@/types/booth";

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

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getOperationTypeColor(type: string): string {
  switch (type) {
    case "create":
      return "text-green-600 bg-green-50 border-green-200";
    case "update":
      return "text-blue-600 bg-blue-50 border-blue-200";
    case "delete":
      return "text-red-600 bg-red-50 border-red-200";
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
  }
}

export function OperationLogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState<number>(parsePageFromParams(searchParams));
  const [pageSize, setPageSize] = useState<number>(parsePageSizeFromParams(searchParams));

  const emptyResult: PaginatedResult<OperationLog> = { data: [], total: 0, page: 1, pageSize: DEFAULT_PAGE_SIZE };
  const { data: paginatedResult = emptyResult, isLoading, isError, isFetching } = useQuery({
    queryKey: ["operation-logs", page, pageSize],
    queryFn: () => fetchOperationLogs(page, pageSize),
  });

  const { data: logs = [], total = 0, page: currentPage, pageSize: currentPageSize } = paginatedResult;
  const totalPages = Math.max(1, Math.ceil(total / currentPageSize));

  useEffect(() => {
    document.title = "操作日志";
  }, []);

  useEffect(() => {
    const pageParam = parsePageFromParams(searchParams);
    const pageSizeParam = parsePageSizeFromParams(searchParams);
    if (pageParam !== page) setPage(pageParam);
    if (pageSizeParam !== pageSize) setPageSize(pageSizeParam);
  }, [searchParams]);

  useEffect(() => {
    if (!isLoading && page > 1 && currentPage < page) {
      setPage(1);
    }
  }, [isLoading, currentPage, page]);

  const syncToUrl = (pageValue: number, pageSizeValue: number) => {
    const params: Record<string, string> = {};
    if (pageValue > 1) params.page = String(pageValue);
    if (pageSizeValue !== DEFAULT_PAGE_SIZE) params.pageSize = String(pageSizeValue);
    setSearchParams(params);
  };

  const handlePageSizeChange = (v: string) => {
    const newPageSize = Number(v);
    setPageSize(newPageSize);
    setPage(1);
    syncToUrl(1, newPageSize);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setPage(newPage);
      syncToUrl(newPage, pageSize);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setPage(newPage);
      syncToUrl(newPage, pageSize);
    }
  };

  const rangeStart = total === 0 ? 0 : (currentPage - 1) * currentPageSize + 1;
  const rangeEnd = Math.min(currentPage * currentPageSize, total);

  const showTableLoading = isFetching;

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/">
            <Button variant="outline" size="sm" className="h-8 gap-1">
              <ArrowLeft className="h-4 w-4" />
              返回列表
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">操作日志</h1>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isError && <p className="p-6 text-destructive">加载失败，请确认后端已启动。</p>}
          {!isError && (
            <div className="relative">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">操作类型</TableHead>
                    <TableHead className="w-24">电话亭ID</TableHead>
                    <TableHead>电话亭地址</TableHead>
                    <TableHead>操作摘要</TableHead>
                    <TableHead className="w-48">操作时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {showTableLoading && logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        加载中...
                      </TableCell>
                    </TableRow>
                  ) : logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        暂无操作日志
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getOperationTypeColor(log.operation_type)}`}>
                            {OPERATION_TYPE_LABELS[log.operation_type]}
                          </span>
                        </TableCell>
                        <TableCell>{log.booth_id}</TableCell>
                        <TableCell>{log.booth_address}</TableCell>
                        <TableCell>{log.summary}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDateTime(log.created_at)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {showTableLoading && logs.length > 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                  <p className="text-sm text-muted-foreground">加载中...</p>
                </div>
              )}
            </div>
          )}

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
        </CardContent>
      </Card>
    </div>
  );
}
