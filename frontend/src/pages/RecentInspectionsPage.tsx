import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ClipboardList, ArrowLeft, MapPin, User, Calendar, MessageSquare } from "lucide-react";
import { fetchRecentInspections } from "@/api/booths";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecentInspection } from "@/types/booth";

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function RecentInspectionsPage() {
  const { data: inspections = [], isLoading, isError } = useQuery({
    queryKey: ["recentInspections"],
    queryFn: () => fetchRecentInspections(50),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    document.title = "最近巡检";
  }, []);

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">最近巡检</h1>
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

      {!isLoading && !isError && (
        <>
          {inspections.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                暂无巡检记录
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {inspections.map((inspection: RecentInspection) => (
                <Card key={inspection.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        {inspection.inspector_name}
                      </CardTitle>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground shrink-0">
                        <Calendar className="h-3.5 w-3.5" />
                        {inspection.inspection_date}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <Link
                            to={`/booths/${inspection.booth_id}`}
                            className="text-sm text-primary hover:underline font-medium"
                          >
                            {inspection.city} · {inspection.address}
                          </Link>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <p
                          className="text-sm text-muted-foreground leading-relaxed"
                          title={inspection.remarks}
                        >
                          {inspection.remarks ? truncateText(inspection.remarks, 100) : "无备注"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
