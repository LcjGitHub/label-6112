import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Booth, BoothStatus } from "@/types/booth";
import { STATUS_LABELS } from "@/types/booth";

const boothSchema = z.object({
  city: z.string().min(1, "请输入城市"),
  address: z.string().min(1, "请输入地址"),
  longitude: z.coerce.number({ invalid_type_error: "请输入有效经度" }),
  latitude: z.coerce.number({ invalid_type_error: "请输入有效纬度" }),
  status: z.enum(["available", "damaged", "demolished"]),
  discovery_date: z.string().min(1, "请输入发现日期"),
  photo_url: z.string().url("请输入有效 URL").or(z.literal("")),
  remark: z.string().max(200, "备注不能超过200字").or(z.literal("")).nullable(),
});

type BoothFormValues = z.infer<typeof boothSchema>;

interface BoothFormProps {
  defaultValues?: Partial<Booth>;
  onSubmit: (values: BoothFormValues) => void;
  onCancel?: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  serverErrors?: Record<string, string>;
}

export function BoothForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = "保存",
  isSubmitting,
  serverErrors,
}: BoothFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm<BoothFormValues>({
    resolver: zodResolver(boothSchema),
    defaultValues: {
      city: defaultValues?.city ?? "",
      address: defaultValues?.address ?? "",
      longitude: defaultValues?.longitude ?? 0,
      latitude: defaultValues?.latitude ?? 0,
      status: defaultValues?.status ?? "available",
      discovery_date: defaultValues?.discovery_date ?? "",
      photo_url: defaultValues?.photo_url ?? "",
      remark: defaultValues?.remark ?? "",
    },
  });

  const serverErrorRef = React.useRef(serverErrors);
  React.useEffect(() => {
    if (serverErrors && serverErrors !== serverErrorRef.current) {
      serverErrorRef.current = serverErrors;
      for (const [field, message] of Object.entries(serverErrors)) {
        setError(field as keyof BoothFormValues, { type: "server", message });
      }
    }
  }, [serverErrors, setError]);

  const status = watch("status");
  const remarkValue = watch("remark") || "";
  const REMARK_MAX = 200;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="city">城市</Label>
          <Input id="city" {...register("city")} />
          {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">状态</Label>
          <Select
            value={status}
            onValueChange={(v) => setValue("status", v as BoothStatus)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(STATUS_LABELS) as BoothStatus[]).map((s) => (
                <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.status && <p className="text-sm text-destructive">{errors.status.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">地址</Label>
        <Input id="address" {...register("address")} />
        {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="longitude">经度</Label>
          <Input id="longitude" type="number" step="any" {...register("longitude")} />
          {errors.longitude && <p className="text-sm text-destructive">{errors.longitude.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="latitude">纬度</Label>
          <Input id="latitude" type="number" step="any" {...register("latitude")} />
          {errors.latitude && <p className="text-sm text-destructive">{errors.latitude.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="discovery_date">发现日期</Label>
        <Input id="discovery_date" type="date" {...register("discovery_date")} />
        {errors.discovery_date && <p className="text-sm text-destructive">{errors.discovery_date.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="photo_url">照片 URL</Label>
        <Input id="photo_url" {...register("photo_url")} placeholder="https://..." />
        {errors.photo_url && <p className="text-sm text-destructive">{errors.photo_url.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="remark">备注</Label>
        <textarea
          id="remark"
          rows={4}
          maxLength={REMARK_MAX}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
          placeholder="请输入备注信息（选填，最多200字）"
          {...register("remark")}
        />
        <div className="flex items-center justify-between">
          {errors.remark && <p className="text-sm text-destructive">{errors.remark.message}</p>}
          <p className={`text-xs ml-auto ${(REMARK_MAX - remarkValue.length) < 20 ? "text-destructive" : "text-muted-foreground"}`}>
            剩余 {REMARK_MAX - remarkValue.length} 字
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>{submitLabel}</Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>取消</Button>
        )}
      </div>
    </form>
  );
}
