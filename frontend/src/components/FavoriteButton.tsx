import { Star } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleFavorite } from "@/api/booths";
import { Button } from "@/components/ui/button";

interface FavoriteButtonProps {
  boothId: number;
  isFavorited: boolean;
  size?: "sm" | "icon" | "default";
  variant?: "ghost" | "outline" | "default";
  showLabel?: boolean;
  className?: string;
}

export function FavoriteButton({
  boothId,
  isFavorited,
  size = "icon",
  variant = "ghost",
  showLabel = false,
  className = "",
}: FavoriteButtonProps) {
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: () => toggleFavorite(boothId, isFavorited),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favoriteIds"] });
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      queryClient.invalidateQueries({ queryKey: ["favorite", boothId] });
    },
  });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    toggleMutation.mutate();
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={toggleMutation.isPending}
      title={isFavorited ? "取消收藏" : "添加收藏"}
      className={`${className} ${isFavorited ? "text-yellow-500 hover:text-yellow-600 hover:bg-yellow-500/10" : "text-muted-foreground hover:text-yellow-500 hover:bg-yellow-500/10"}`}
    >
      <Star className={`${size === "sm" || showLabel ? "h-4 w-4" : "h-4 w-4"} ${isFavorited ? "fill-yellow-500" : ""}`} />
      {showLabel && <span className="ml-1">{isFavorited ? "已收藏" : "收藏"}</span>}
    </Button>
  );
}
