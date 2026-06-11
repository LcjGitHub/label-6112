import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Pencil, Trash2, Plus, ClipboardList, User, Calendar, MessageSquare, CheckCircle2, XCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { fetchBooth, updateBooth, deleteBooth, fetchInspections, createInspection, deleteInspection, updateInspection } from "@/api/booths";
import { BoothForm } from "@/components/BoothForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { STATUS_LABELS } from "@/types/booth";
import type { InspectionRecordInput, InspectionRecord } from "@/types/booth";

const inspectionSchema = z.object({
  inspector_name: z.string().min(1, "请输入巡检人姓名"),
  inspection_date: z.string().min(1, "请选择巡检日期"),
  remarks: z.string().min(1, "请输入备注说明").max(500, "备注不能超过500字"),
});

type InspectionFormValues = z.infer<typeof inspectionSchema>;

const inspectionEditSchema = z.object({
  inspector_name: z.string().min(1, "请输入巡检人姓名"),
  remarks: z.string().min(1, "请输入备注说明").max(500, "备注不能超过500字"),
});

type InspectionEditFormValues = z.infer<typeof inspectionEditSchema>;

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

interface DeleteDialogState {
  open: boolean;
  target: "booth" | "inspection";
  record?: InspectionRecord;
}

export function BoothDetailPage() {
  const { id } = useParams<{ id: string }>();
  const boothId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [editingRecordId, setEditingRecordId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<InspectionEditFormValues>({ inspector_name: "", remarks: "" });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    open: false,
    target: "booth",
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InspectionFormValues>({
    resolver: zodResolver(inspectionSchema),
    defaultValues: {
      inspector_name: "",
      inspection_date: new Date().toISOString().slice(0, 10),
      remarks: "",
    },
  });

  const { data: booth, isLoading, isError } = useQuery({
    queryKey: ["booth", boothId],
    queryFn: () => fetchBooth(boothId),
    enabled: !Number.isNaN(boothId),
  });

  const {
    data: inspections = [],
    isLoading: inspectionsLoading,
  } = useQuery({
    queryKey: ["inspections", boothId],
    queryFn: () => fetchInspections(boothId),
    enabled: !Number.isNaN(boothId) && !!booth,
  });

  function showToast(message: string) {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type: "success" }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2000);
  }

  function showErrorToast(message: string) {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type: "error" }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2000);
  }

  function extractFieldDetails(error: unknown): Record<string, string> | undefined {
    try {
      const axiosErr = error as { response?: { data?: { details?: Record<string, string> } } };
      if (axiosErr.response?.data?.details && typeof axiosErr.response.data.details === "object") {
        return axiosErr.response.data.details;
      }
    } catch {
      // ignore
    }
    return undefined;
  }

  const updateMutation = useMutation({
    mutationFn: (values: Parameters<typeof updateBooth>[1]) => updateBooth(boothId, values),
    onSuccess: (updated) => {
      queryClient.setQueryData(["booth", boothId], updated);
      queryClient.invalidateQueries({ queryKey: ["booths"] });
      queryClient.invalidateQueries({ queryKey: ["cities"] });
      queryClient.invalidateQueries({ queryKey: ["statistics"] });
      setEditing(false);
      showToast("电话亭信息已更新");
    },
  });

  const deleteBoothMutation = useMutation({
    mutationFn: () => deleteBooth(boothId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booths"] });
      queryClient.invalidateQueries({ queryKey: ["cities"] });
      queryClient.invalidateQueries({ queryKey: ["statistics"] });
      navigate("/");
    },
  });

  const createInspectionMutation = useMutation({
    mutationFn: (values: InspectionRecordInput) => createInspection(boothId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspections", boothId] });
      reset({
        inspector_name: "",
        inspection_date: new Date().toISOString().slice(0, 10),
        remarks: "",
      });
      showToast("巡检记录已添加");
    },
  });

  const deleteInspectionMutation = useMutation({
    mutationFn: (recordId: number) => deleteInspection(boothId, recordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspections", boothId] });
      setDeleteDialog({ open: false, target: "booth" });
      showToast("巡检记录已删除");
    },
  });

  const updateInspectionMutation = useMutation({
    mutationFn: ({ recordId, values }: { recordId: number; values: InspectionEditFormValues }) =>
      updateInspection(boothId, recordId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspections", boothId] });
      setEditingRecordId(null);
      setEditErrors({});
      showToast("巡检记录已更新");
    },
    onError: (error) => {
      const details = extractFieldDetails(error);
      if (details) {
        setEditErrors(details);
        showErrorToast("更新失败：请检查字段内容");
      } else {
        showErrorToast("更新失败，请稍后重试");
      }
    },
  });

  function handleConfirmDelete() {
    if (deleteDialog.target === "booth") {
      deleteBoothMutation.mutate();
    } else if (deleteDialog.target === "inspection" && deleteDialog.record) {
      deleteInspectionMutation.mutate(deleteDialog.record.id);
    }
  }

  function startEditRecord(record: InspectionRecord) {
    setEditingRecordId(record.id);
    setEditForm({ inspector_name: record.inspector_name, remarks: record.remarks });
    setEditErrors({});
  }

  function cancelEditRecord() {
    setEditingRecordId(null);
    setEditErrors({});
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingRecordId === null) return;
    const result = inspectionEditSchema.safeParse(editForm);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setEditErrors(fieldErrors);
      return;
    }
    updateInspectionMutation.mutate({ recordId: editingRecordId, values: result.data });
  }

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

  const isDeletePending = deleteBoothMutation.isPending || deleteInspectionMutation.isPending;

  return (
    <div className="container mx-auto max-w-3xl py-8 px-4">
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={
              toast.type === "success"
                ? "flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-50 px-4 py-3 text-sm text-green-800 shadow-lg animate-in slide-in-from-right fade-in"
                : "flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-lg animate-in slide-in-from-right fade-in"
            }
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            {toast.message}
          </div>
        ))}
      </div>

      {deleteDialog.open && (
        <ConfirmDialog
          title={deleteDialog.target === "booth" ? "删除电话亭" : "删除巡检记录"}
          description={
            deleteDialog.target === "booth"
              ? "确认删除该电话亭？此操作将同时删除所有关联的巡检记录，且无法恢复。"
              : `确认删除「${deleteDialog.record?.inspector_name}」在 ${deleteDialog.record?.inspection_date} 的巡检记录？此操作无法撤销。`
          }
          confirmLabel="确认删除"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteDialog({ open: false, target: "booth" })}
          isPending={isDeletePending}
        />
      )}

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
            disabled={deleteBoothMutation.isPending}
            onClick={() => setDeleteDialog({ open: true, target: "booth" })}
          >
            <Trash2 className="h-4 w-4" />
            删除
          </Button>
        </div>
      </div>

      <div className="space-y-6">
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
          <>
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
                <div className="pt-3 border-t">
                  <div className="text-sm">
                    <span className="text-muted-foreground">备注：</span>
                    {booth.remark ? (
                      <p className="mt-1 text-foreground whitespace-pre-wrap">{booth.remark}</p>
                    ) : (
                      <p className="mt-1 text-muted-foreground italic">暂无备注</p>
                    )}
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
          </>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="h-5 w-5 text-primary" />
              新增巡检记录
            </CardTitle>
            <CardDescription>填写以下信息添加一条新的巡检记录</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit((values) => createInspectionMutation.mutate(values))}
              className="space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="inspector_name">
                    <User className="h-4 w-4 inline mr-1" />
                    巡检人姓名 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="inspector_name"
                    placeholder="请输入巡检人姓名"
                    {...register("inspector_name")}
                  />
                  {errors.inspector_name && (
                    <p className="text-sm text-destructive">{errors.inspector_name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inspection_date">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    巡检日期 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="inspection_date"
                    type="date"
                    {...register("inspection_date")}
                  />
                  {errors.inspection_date && (
                    <p className="text-sm text-destructive">{errors.inspection_date.message}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="remarks">
                  <MessageSquare className="h-4 w-4 inline mr-1" />
                  备注说明 <span className="text-destructive">*</span>
                </Label>
                <textarea
                  id="remarks"
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                  placeholder="请输入巡检备注（最多500字）"
                  {...register("remarks")}
                />
                {errors.remarks && (
                  <p className="text-sm text-destructive">{errors.remarks.message}</p>
                )}
              </div>
              <Button
                type="submit"
                disabled={createInspectionMutation.isPending}
              >
                <Plus className="h-4 w-4 mr-1" />
                {createInspectionMutation.isPending ? "提交中..." : "提交巡检记录"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="h-5 w-5 text-primary" />
              巡检记录列表
              <span className="ml-auto text-sm font-normal text-muted-foreground">
                共 {inspections.length} 条
              </span>
            </CardTitle>
            <CardDescription>该电话亭的历史巡检记录</CardDescription>
          </CardHeader>
          <CardContent>
            {inspectionsLoading ? (
              <p className="text-sm text-muted-foreground py-4">加载巡检记录中...</p>
            ) : inspections.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <ClipboardList className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-sm">暂无巡检记录</p>
              </div>
            ) : (
              <div className="space-y-3">
                {inspections.map((record) => (
                  <div
                    key={record.id}
                    className="p-4 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
                  >
                    {editingRecordId === record.id ? (
                      <form onSubmit={handleEditSubmit} className="space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1">
                            <Label htmlFor={`edit-inspector-${record.id}`} className="text-xs">
                              <User className="h-3 w-3 inline mr-1" />
                              巡检人姓名 <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id={`edit-inspector-${record.id}`}
                              value={editForm.inspector_name}
                              onChange={(e) => setEditForm((f) => ({ ...f, inspector_name: e.target.value }))}
                              placeholder="请输入巡检人姓名"
                            />
                            {editErrors.inspector_name && (
                              <p className="text-xs text-destructive">{editErrors.inspector_name}</p>
                            )}
                          </div>
                          <div className="flex items-end text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{record.inspection_date}</span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`edit-remarks-${record.id}`} className="text-xs">
                            <MessageSquare className="h-3 w-3 inline mr-1" />
                            备注说明 <span className="text-destructive">*</span>
                          </Label>
                          <textarea
                            id={`edit-remarks-${record.id}`}
                            rows={2}
                            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                            value={editForm.remarks}
                            onChange={(e) => setEditForm((f) => ({ ...f, remarks: e.target.value }))}
                            placeholder="请输入备注说明"
                          />
                          {editErrors.remarks && (
                            <p className="text-xs text-destructive">{editErrors.remarks}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" size="sm" disabled={updateInspectionMutation.isPending}>
                            {updateInspectionMutation.isPending ? "保存中..." : "保存"}
                          </Button>
                          <Button type="button" variant="outline" size="sm" onClick={cancelEditRecord}>
                            取消
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{record.inspector_name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">{record.inspection_date}</span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-muted-foreground hover:text-foreground hover:bg-accent"
                              onClick={() => startEditRecord(record)}
                              title="编辑巡检记录"
                            >
                              <Pencil className="h-4 w-4 mr-1" />
                              <span className="text-xs">编辑</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                              disabled={deleteInspectionMutation.isPending}
                              onClick={() =>
                                setDeleteDialog({ open: true, target: "inspection", record })
                              }
                              title="删除巡检记录"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              <span className="text-xs">删除</span>
                            </Button>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t">
                          {record.remarks ? (
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {record.remarks}
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">暂无备注</p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
