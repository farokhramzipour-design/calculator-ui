import * as React from "react";
import { cn } from "@/lib/utils";

interface DialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue | null>(null);

export function Dialog({ open: openProp, onOpenChange, children }: { open?: boolean; onOpenChange?: (open: boolean) => void; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(!!openProp);

  React.useEffect(() => {
    if (openProp !== undefined) setOpen(openProp);
  }, [openProp]);

  const handleOpen = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };

  return <DialogContext.Provider value={{ open, setOpen: handleOpen }}>{children}</DialogContext.Provider>;
}

export const DialogTrigger = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const ctx = React.useContext(DialogContext);
  if (!ctx) return null;
  return (
    <button
      {...props}
      onClick={(event) => {
        props.onClick?.(event);
        ctx.setOpen(true);
      }}
    >
      {children}
    </button>
  );
};

export const DialogContent = ({ className, children }: React.HTMLAttributes<HTMLDivElement>) => {
  const ctx = React.useContext(DialogContext);
  if (!ctx || !ctx.open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className={cn("w-full max-w-xl rounded-xl bg-white shadow-panel", className)}>
        {children}
      </div>
    </div>
  );
};

export const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("border-b border-slate-100 p-5", className)} {...props} />
);

export const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("border-t border-slate-100 p-5", className)} {...props} />
);
