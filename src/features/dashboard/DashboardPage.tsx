import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockData, useMocks } from "@/lib/mock";
import { formatDate } from "@/lib/utils";
import { Link } from "react-router-dom";

interface ShipmentList {
  shipments: Array<{ id: string; status: string; import_date?: string | null }>;
}

interface ComplianceTask {
  id: string;
  title: string;
  due: string;
  severity: string;
  status: string;
}

export function DashboardPage() {
  const shipmentsQuery = useQuery({
    queryKey: ["shipments"],
    queryFn: () => api.get<ShipmentList>("/shipments"),
    enabled: !useMocks,
    initialData: useMocks ? mockData.shipments : undefined
  });

  const complianceQuery = useQuery({
    queryKey: ["compliance"],
    queryFn: () => api.get<ComplianceTask[]>("/compliance/tasks"),
    enabled: !useMocks,
    initialData: useMocks ? mockData.complianceTasks : undefined
  });

  const shipments = shipmentsQuery.data?.shipments ?? [];
  const compliance = complianceQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Operations Dashboard</h1>
          <p className="text-sm text-slate-400">Snapshot of your compliance readiness and landed cost activity.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/calculator"><Button>New Calculation</Button></Link>
          <Link to="/invoices"><Button variant="outline">Upload Invoice</Button></Link>
          <Link to="/shipments"><Button variant="secondary">Create Shipment</Button></Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Shipments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Open / Ready</span>
              <span className="text-lg font-semibold">{shipments.filter((s) => s.status !== "CALCULATED").length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">In Transit</span>
              <span className="text-lg font-semibold">{shipments.filter((s) => s.status === "READY").length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Delivered</span>
              <span className="text-lg font-semibold">{shipments.filter((s) => s.status === "CALCULATED").length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compliance Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Due soon</span>
              <span className="text-lg font-semibold">{compliance.filter((t) => t.status !== "Completed").length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Overdue</span>
              <span className="text-lg font-semibold">{compliance.filter((t) => new Date(t.due) < new Date()).length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Calculations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {shipments.slice(0, 3).map((shipment) => (
              <div key={shipment.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Shipment {shipment.id}</p>
                  <p className="text-xs text-slate-500">{formatDate(shipment.import_date)}</p>
                </div>
                <Badge variant="default">{shipment.status}</Badge>
              </div>
            ))}
            {shipments.length === 0 && <p className="text-sm text-slate-500">No activity yet.</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Investor-ready overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-slate-500">Compliance coverage</p>
              <p className="text-2xl font-semibold">92%</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Avg. landed cost variance</p>
              <p className="text-2xl font-semibold">1.6%</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Last updated</p>
              <p className="text-2xl font-semibold">Today</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
