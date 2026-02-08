import { Outlet } from "react-router-dom";
import { Sidebar } from "./sidebar";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="flex min-h-screen bg-radial">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-10">
          <div className="mx-auto max-w-6xl space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
