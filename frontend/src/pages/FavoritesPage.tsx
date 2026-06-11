import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { MapPin, Star, ArrowLeft, Trash2, Calendar, Eye } from "lucide-react";
import { fetchFavorites, removeFavorite } from "@/api/booths";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { FavoriteBooth } from "@/types/booth";
import { STATUS_LABELS } from "@/types/booth";

export function FavoritesPage() {
  const queryClient = useQueryClient();
  const [unfavoriteDialog, setUnfavoriteDialog] = useState<{ open: boolean; booth: FavoriteBooth | null }>({
    open: false,
    booth: null,
  });

  const { data: favorites = [], isLoading, isError } = useQuery({
    queryKey: ["favorites"],
    queryFn: fetchFavorites,
  });

  const removeMutation = useMutation({
    mutationFn: (boothId: number) => removeFavorite(boothId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      queryClient.invalidateQueries({ queryKey: ["favoriteIds"] });
      setUnfavoriteDialog({ open: false, booth: null });
    },
  });

  const handleConfirmUnfavorite = () => {
    if (unfavoriteDialog.booth) {
      removeMutation.mutate(unfavoriteDialog.booth.id);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      {unfavoriteDialog.open && unfavoriteDialog.booth && (
        <ConfirmDialog
          title="取消收藏"
          description={`确认取消收藏「${unfavoriteDialog.booth.address}」？可随时再次添加收藏。`}
          confirmLabel="确认取消"
          onConfirm={handleConfirmUnfavorite}
          onCancel={() => setUnfavoriteDialog({ open: false, booth: null })}
          isPending={removeMutation.isPending}
        />
      )}

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mr-4">
            <ArrowLeft className="h-4 w-4" />
            返回列表
          </Link>
          <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
          <h1 className="text-2xl font-bold">我的收藏</h1>
        </div>
        <div className="text-sm text-muted-foreground">
          共 <span className="font-medium text-foreground">{favorites.length}</span> 条收藏
        </div>
      </div>

      {isError && (
        <Card>
          <CardContent className="p-6 text-destructive">
            加载失败，请确认后端已启动。
          </CardContent>
        </Card>
      )}

      {!isError && (
        isLoading ? (
          <Card>
            <CardContent className="p-6 text-muted-foreground text-center">
              加载中...
            </CardContent>
          </Card>
        ) : favorites.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Star className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-lg mb-2">暂无收藏</p>
              <p className="text-sm">前往电话亭列表，点击星形图标添加收藏</p>
              <Link to="/" className="mt-4">
                <Button>
                  <MapPin className="h-4 w-4 mr-2" />
                  浏览电话亭
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {favorites.map((booth) => (
              <Card key={booth.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <Link to={`/booths/${booth.id}`} className="hover:underline">
                          {booth.address}
                        </Link>
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {booth.city} · {STATUS_LABELS[booth.status]}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Link to={`/booths/${booth.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 gap-1 text-muted-foreground hover:text-foreground">
                          <Eye className="h-4 w-4" />
                          详情
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setUnfavoriteDialog({ open: true, booth })}
                        title="取消收藏"
                      >
                        <Trash2 className="h-4 w-4" />
                        取消
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-3">
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <span className="text-muted-foreground">发现日期：</span>
                      <span>{booth.discovery_date}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">巡检次数：</span>
                      <span>{booth.inspection_count ?? 0} 次</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-muted-foreground">收藏时间：</span>
                      <span className="flex items-center gap-1 inline-flex">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(booth.favorited_at)}
                      </span>
                    </div>
                    {booth.remark && (
                      <div className="sm:col-span-2 pt-2 border-t">
                        <span className="text-muted-foreground">备注：</span>
                        <p className="mt-1 text-foreground line-clamp-2">{booth.remark}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  );
}
