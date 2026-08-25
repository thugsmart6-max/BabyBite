import { cn } from "@/lib/utils";

export function EmptyPanel({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("empty-panel p-10 text-center", className)}>
      <p className="font-display text-lg md:text-xl mb-2">{title}</p>
      <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
