import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsContextValue {
  value: string;
  setValue: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

export function Tabs({ value: valueProp, defaultValue, onValueChange, children }: {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}) {
  const [value, setValue] = React.useState(defaultValue ?? valueProp ?? "");

  React.useEffect(() => {
    if (valueProp !== undefined) setValue(valueProp);
  }, [valueProp]);

  const handleSet = (next: string) => {
    setValue(next);
    onValueChange?.(next);
  };

  return (
    <TabsContext.Provider value={{ value, setValue: handleSet }}>
      <div>{children}</div>
    </TabsContext.Provider>
  );
}

export const TabsList = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("inline-flex items-center gap-2 rounded-lg bg-slate-100 p-1", className)} {...props} />
);

export const TabsTrigger = ({ value, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) => {
  const ctx = React.useContext(TabsContext);
  if (!ctx) return null;
  const active = ctx.value === value;
  return (
    <button
      className={cn(
        "rounded-md px-3 py-1.5 text-sm font-medium transition",
        active ? "bg-white text-slate-900 shadow" : "text-slate-600 hover:text-slate-900",
        className
      )}
      onClick={() => ctx.setValue(value)}
      {...props}
    />
  );
};

export const TabsContent = ({ value, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { value: string }) => {
  const ctx = React.useContext(TabsContext);
  if (!ctx || ctx.value !== value) return null;
  return <div className={cn("mt-4", className)} {...props} />;
};
