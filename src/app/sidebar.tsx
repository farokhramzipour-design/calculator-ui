import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Calculator,
  FileText,
  Truck,
  ShieldCheck,
  Library,
  Users,
  Sparkles,
  Shield,
  Crown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/useAuth";

const navItemClass = "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition";

export function Sidebar() {
  const { user, logout } = useAuth();
  return (
    <aside className="sticky top-0 h-screen w-72 border-r border-slate-900/30 bg-slate-950/90 px-4 py-6 text-slate-200">
      <div className="flex items-center gap-2 px-2">
        <div className="h-10 w-10 rounded-xl bg-brand-600"></div>
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Trade Ops</p>
          <p className="text-lg font-semibold">Landed Cost Suite</p>
        </div>
      </div>

      <div className="mt-6">
        <NavLink
          to="/"
          className={({ isActive }) =>
            cn(navItemClass, isActive ? "bg-white text-slate-900" : "text-slate-200 hover:bg-slate-900/60")
          }
        >
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>
      </div>

      <div className="mt-6 space-y-6">
        <div className="space-y-1">
          <NavLink to="/calculator" className={({ isActive }) => cn(navItemClass, isActive ? "bg-slate-900 text-white" : "hover:bg-slate-900/60")}>
            <Calculator size={18} />
            Landed Cost
          </NavLink>
          <NavLink to="/invoices" className={({ isActive }) => cn(navItemClass, isActive ? "bg-slate-900 text-white" : "hover:bg-slate-900/60")}>
            <FileText size={18} />
            Invoices
          </NavLink>
          <NavLink to="/shipments" className={({ isActive }) => cn(navItemClass, isActive ? "bg-slate-900 text-white" : "hover:bg-slate-900/60")}>
            <Truck size={18} />
            New Shipments
          </NavLink>
          <NavLink to="/compliance" className={({ isActive }) => cn(navItemClass, isActive ? "bg-slate-900 text-white" : "hover:bg-slate-900/60")}>
            <ShieldCheck size={18} />
            Compliance Tasks
          </NavLink>
        </div>

        <div>
          <p className="px-3 text-xs uppercase tracking-[0.2em] text-slate-500">Metal Importers</p>
          <NavLink to="/passport" className={({ isActive }) => cn(navItemClass, isActive ? "bg-slate-900 text-white" : "hover:bg-slate-900/60")}>
            <Library size={18} />
            Passport Library
          </NavLink>
        </div>

        <div>
          <p className="px-3 text-xs uppercase tracking-[0.2em] text-slate-500">Collaboration</p>
          <NavLink to="/collaboration" className={({ isActive }) => cn(navItemClass, isActive ? "bg-slate-900 text-white" : "hover:bg-slate-900/60")}>
            <Users size={18} />
            License Manager
          </NavLink>
        </div>

        <div>
          <p className="px-3 text-xs uppercase tracking-[0.2em] text-slate-500">Intelligence</p>
          <NavLink to="/intelligence" className={({ isActive }) => cn(navItemClass, isActive ? "bg-slate-900 text-white" : "hover:bg-slate-900/60")}>
            <Sparkles size={18} />
            Market Insights
          </NavLink>
        </div>

        {user?.role === "admin" && (
          <div>
            <p className="px-3 text-xs uppercase tracking-[0.2em] text-slate-500">Admin</p>
            <NavLink to="/admin/taric-import" className={({ isActive }) => cn(navItemClass, isActive ? "bg-slate-900 text-white" : "hover:bg-slate-900/60")}>
              <Shield size={18} />
              TARIC Import
            </NavLink>
          </div>
        )}
      </div>

      <div className="mt-6">
        <Button variant="pro" className="w-full gap-2">
          <Crown size={16} />
          Become a Pro User
        </Button>
      </div>

      <div className="mt-8 border-t border-slate-800 pt-4 text-xs text-slate-500">
        <p>{user?.email ?? "Signed out"}</p>
        <button className="mt-2 text-slate-300 hover:text-white" onClick={logout}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
