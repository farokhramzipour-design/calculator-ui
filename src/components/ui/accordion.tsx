import * as React from "react";
import { cn } from "@/lib/utils";

export const Accordion = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("space-y-2", className)} {...props} />
);

export const AccordionItem = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("rounded-lg border border-slate-200", className)} {...props} />
);

export const AccordionTrigger = ({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={cn("flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-slate-700", className)}
    {...props}
  />
);

export const AccordionContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("border-t border-slate-200 px-4 py-3 text-sm text-slate-600", className)} {...props} />
);
