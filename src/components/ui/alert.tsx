import * as React from "react";
import { cn } from "@/lib/utils";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "warning" | "danger";
}

const variantStyles: Record<NonNullable<AlertProps["variant"]>, string> = {
  default: "bg-slate-50 text-slate-700 border-slate-200",
  warning: "bg-amber-50 text-amber-800 border-amber-200",
  danger: "bg-rose-50 text-rose-800 border-rose-200"
};

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-lg border px-4 py-3 text-sm", variantStyles[variant], className)}
      {...props}
    />
  )
);
Alert.displayName = "Alert";
