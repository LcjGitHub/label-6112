import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Pencil, Trash2 } from "lucide-react";
import { fetchBooth, updateBooth, deleteBooth } from "@/api/booths";
import { BoothForm } from "@/components/BoothForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { STATUS_LABELS } from "@/types/booth";

export function BoothDetailPage() {
  const { id } = useParams<{ id: string }>();
  const boothId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { data: booth, isLoading, isError } = useQuery({
    queryKey: ["booth", boothId],
    queryFn: () => fetchBooth(boothId),
    enabled: !Number.isNaN(boothId),
  });

  const updateMutation = useMutation({
    mutationFn: (values: Parameters<typeof updateBooth>[1]) => updateBooth(boothId, values),
    onSuccess: (updated) => {
      queryClient.setQueryData(["booth", boothId], updated);
      queryClient.invalidateQueries({ queryKey: ["booths"] });
      queryClient.invalidateQueries({ queryKey: ["cities"] });
      queryClient.invalidateQueries({ queryKey: ["statistics"] });
      setEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteBooth(boothId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booths"] });
      queryClient.invalidateQueries({ queryKey: ["cities"] });
      queryClient.invalidateQueries({ queryKey: ["statistics"] });
      navigate("/");
    },
  });

  if (Number.isNaN(boothId)) {
    return <p className="p-8 text-destructive">无效 ID</p>;
  }

  if (isLoading) {
    return <p className="p-8 text-muted-foreground">加载中...</p>;
  }

  if (isError || !booth) {
    return (
      <div className="container mx-auto max-w-3xl py-8 px-4">
        <p className="text-destructive">电话亭不存在或加载失败。</p>
        <Link to="/" className="mt-4 text-primary hover:underline">返回列表</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl py-8 px-4">
      <div className="mb-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          返回列表
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing((v) => !v)}>
            <Pencil className="h-4 w-4" />
            {editing ? "取消编辑" : "编辑"}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={deleteMutation.isPending}
            onClick={() => {
              if (confirm("确认删除该电话亭？")) {
                deleteMutation.mutate();
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
            删除
          </Button>
        </div>
      </div>

      {editing ? (
        <Card>
          <CardHeader>
            <CardTitle>编辑电话亭</CardTitle>
          </CardHeader>
          <CardContent>
            <BoothForm
              defaultValues={booth}
              onSubmit={(values) => updateMutation.mutate(values)}
              onCancel={() => setEditing(false)}
              isSubmitting={updateMutation.isPending}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                {booth.address}
              </CardTitle>
              <CardDescription>{booth.city} · {STATUS_LABELS[booth.status]}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <span className="text-muted-foreground">经度：</span>
                  <span>{booth.longitude}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">纬度：</span>
                  <span>{booth.latitude}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">发现日期：</span>
                  <span>{booth.discovery_date}</span>
                </div>
              </div>
              {booth.photo_url && (
                <img
                  src={booth.photo_url}
                  alt={booth.address}
                  className="mt-4 rounded-md border max-h-64 object-cover"
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">地图区域</CardTitle>
              <CardDescription>地图组件占位（MVP 暂不接入真实地图）</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-48 items-center justify-center rounded-md border border-dashed bg-muted/30 text-muted-foreground">
                经度 {booth.longitude}，纬度 {booth.latitude}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
