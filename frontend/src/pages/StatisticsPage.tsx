import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { BarChart3, ArrowLeft, MapPin, Phone } from "lucide-react";
import { fetchStatistics } from "@/api/booths";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STATUS_LABELS } from "@/types/booth";
import type { BoothStatus } from "@/types/booth";

const STATUS_ICONS: Record<BoothStatus, string> = {
  available: "✅",
  damaged: "⚠️",
  demolished: "🏚️",
};

export function StatisticsPage() {
  const navigate = useNavigate();
  const { data: statistics, isLoading, isError } = useQuery({
    queryKey: ["statistics"],
    queryFn: fetchStatistics,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const handleCityClick = (city: string) => {
    navigate(`/?city=${encodeURIComponent(city)}`);
  };

  const handleStatusClick = (status: BoothStatus) => {
    navigate(`/?status=${encodeURIComponent(status)}`);
  };

  useEffect(() => {
    document.title = "数据统计概览";
  }, []);

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">数据统计概览</h1>
        </div>
        <Link to="/">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" />
            返回列表
          </Button>
        </Link>
      </div>

      {isLoading && <p className="p-6 text-muted-foreground">加载中...</p>}
      {isError && <p className="p-6 text-destructive">加载失败，请确认后端已启动。</p>}

      {statistics && !isLoading && !isError && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">总数统计</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Phone className="h-10 w-10 text-primary" />
                <div>
                  <p className="text-4xl font-bold">{statistics.total}</p>
                  <p className="text-sm text-muted-foreground">电话亭总数</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">按状态分组</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {(Object.keys(STATUS_LABELS) as BoothStatus[]).map((status) => (
                  <button
                    key={status}
                    type="button"
                    className="flex w-full items-center gap-3 rounded-lg border p-4 text-left hover:border-primary hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all"
                    onClick={() => handleStatusClick(status)}
                    title={`点击查看${STATUS_LABELS[status]}的电话亭列表`}
                  >
                    <span className="text-3xl shrink-0">{STATUS_ICONS[status]}</span>
                    <div className="min-w-0">
                      <p className="text-2xl font-bold">
                        {statistics.byStatus[status]}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {STATUS_LABELS[status]}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">点击查看列表</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">按城市分组</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(statistics.byCity).length === 0 ? (
                <p className="text-center text-muted-foreground">暂无城市数据</p>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {Object.entries(statistics.byCity).map(([city, count]) => (
                    <button
                      key={city}
                      type="button"
                      className="flex w-full items-start gap-3 rounded-lg border p-4 text-left hover:border-primary hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all"
                      onClick={() => handleCityClick(city)}
                      title={`点击查看${city}的电话亭列表`}
                    >
                      <MapPin className="h-6 w-6 text-primary shrink-0 mt-1" />
                      <div className="min-w-0">
                        <p className="text-2xl font-bold">{count}</p>
                        <p className="text-sm text-muted-foreground truncate">{city}</p>
                        <p className="text-xs text-muted-foreground mt-1">点击查看列表</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
