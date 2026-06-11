import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { MapPin, Plus, Trash2, BarChart3 } from "lucide-react";
import { fetchBooths, fetchCities, createBooth, deleteBooth, invalidateStatisticsCache } from "@/api/booths";
import { BoothForm } from "@/components/BoothForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { BoothStatus } from "@/types/booth";
import { STATUS_LABELS } from "@/types/booth";

export function BoothListPage() {
  const queryClient = useQueryClient();
  const [city, setCity] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [showForm, setShowForm] = useState(false);

  const { data: cities = [] } = useQuery({
    queryKey: ["cities"],
    queryFn: fetchCities,
  });

  const { data: booths = [], isLoading, isError } = useQuery({
    queryKey: ["booths", city, status],
    queryFn: () => fetchBooths(city || undefined, status || undefined),
  });

  const createMutation = useMutation({
    mutationFn: createBooth,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booths"] });
      queryClient.invalidateQueries({ queryKey: ["cities"] });
      queryClient.invalidateQueries({ queryKey: ["statistics"] });
      invalidateStatisticsCache();
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBooth,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booths"] });
      queryClient.invalidateQueries({ queryKey: ["cities"] });
      queryClient.invalidateQueries({ queryKey: ["statistics"] });
      invalidateStatisticsCache();
    },
  });

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

      <div className="mb-4 flex flex-wrap gap-4">
        <div className="w-48">
          <Select
            value={city || "all"}
            onValueChange={(v) => setCity(v === "all" ? "" : v)}
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
            onValueChange={(v) => setStatus(v === "all" ? "" : v)}
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
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading && <p className="p-6 text-muted-foreground">加载中...</p>}
          {isError && <p className="p-6 text-destructive">加载失败，请确认后端已启动。</p>}
          {!isLoading && !isError && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>城市</TableHead>
                  <TableHead>地址</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>发现日期</TableHead>
                  <TableHead className="w-24">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {booths.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      暂无数据
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
