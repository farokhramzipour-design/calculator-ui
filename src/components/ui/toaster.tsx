import * as React from "react";
import { cn } from "@/lib/utils";

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "success" | "error";
}

interface ToastContextValue {
  push: (message: Omit<ToastMessage, "id">) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const variantStyles: Record<NonNullable<ToastMessage["variant"]>, string> = {
  default: "bg-slate-900 text-white",
  success: "bg-emerald-600 text-white",
  error: "bg-rose-600 text-white"
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [messages, setMessages] = React.useState<ToastMessage[]>([]);

  const push = React.useCallback((message: Omit<ToastMessage, "id">) => {
    const id = crypto.randomUUID();
    setMessages((prev) => [...prev, { id, variant: "default", ...message }]);
    setTimeout(() => setMessages((prev) => prev.filter((msg) => msg.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
        {messages.map((msg) => (
          <div key={msg.id} className={cn("rounded-lg px-4 py-3 shadow-lg", variantStyles[msg.variant ?? "default"])}>
            <p className="text-sm font-semibold">{msg.title}</p>
            {msg.description && <p className="text-xs opacity-90">{msg.description}</p>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const Toaster = () => null;
