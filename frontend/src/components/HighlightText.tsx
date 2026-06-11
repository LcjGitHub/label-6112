import { cn } from "@/lib/utils";

interface HighlightTextProps {
  text: string;
  keyword: string;
  className?: string;
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function HighlightText({ text, keyword, className }: HighlightTextProps) {
  const trimmedKeyword = keyword?.trim();

  if (!trimmedKeyword) {
    return <span className={className}>{text}</span>;
  }

  const regex = new RegExp(`(${escapeRegExp(trimmedKeyword)})`, "gi");
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        const isMatch = part.toLowerCase() === trimmedKeyword.toLowerCase();
        if (isMatch) {
          return (
            <mark
              key={index}
              className={cn(
                "bg-yellow-300 text-foreground font-semibold px-0.5 rounded-sm",
                "dark:bg-yellow-600 dark:text-foreground"
              )}
            >
              {part}
            </mark>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}
