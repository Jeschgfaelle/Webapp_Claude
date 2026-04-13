import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";

interface RunwayIndicatorProps {
  months: number; // -1 means no breach within horizon
  horizonMonths: number;
}

export function RunwayIndicator({ months, horizonMonths }: RunwayIndicatorProps) {
  const isInfinite = months === -1;
  const isDangerous = !isInfinite && months <= 3;
  const isWarning = !isInfinite && months > 3 && months <= 6;

  const variant = isInfinite ? "success" : isDangerous ? "danger" : isWarning ? "warning" : "success";

  const icons = {
    success: CheckCircle,
    warning: AlertTriangle,
    danger: XCircle,
  };

  const colors = {
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
  };

  const bgColors = {
    success: "bg-success/10",
    warning: "bg-warning/10",
    danger: "bg-danger/10",
  };

  const Icon = icons[variant];
  const displayValue = isInfinite ? `${horizonMonths}+` : String(months);
  const displayLabel = isInfinite
    ? "No runway breach projected"
    : months === 0
      ? "Cash buffer breached now!"
      : `${months} month${months !== 1 ? "s" : ""} until buffer breach`;

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-5 shadow-sm animate-fade-in",
        isDangerous && "border-l-4 border-l-danger",
        isWarning && "border-l-4 border-l-warning",
        isInfinite && "border-l-4 border-l-success"
      )}
    >
      <div className="flex items-center gap-4">
        <div className={cn("rounded-full p-3", bgColors[variant])}>
          <Icon className={cn("h-8 w-8", colors[variant])} />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Financial Runway
          </p>
          <p className="text-3xl font-bold tracking-tight">
            {displayValue}{" "}
            <span className="text-lg font-normal text-muted-foreground">
              months
            </span>
          </p>
          <p className={cn("text-sm font-medium mt-0.5", colors[variant])}>
            {displayLabel}
          </p>
        </div>
      </div>
    </div>
  );
}
