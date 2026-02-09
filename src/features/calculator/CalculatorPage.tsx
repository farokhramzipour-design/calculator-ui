import * as React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toaster";
import { mockData, useMocks } from "@/lib/mock";
import { Navigate } from "react-router-dom";

interface ShipmentRead {
  id: string;
  direction: string;
  destination_country: string | null;
  origin_country_default: string;
  incoterm: string;
  currency: string;
  import_date: string | null;
  status: string;
}

interface ShipmentList {
  shipments: ShipmentRead[];
}

interface CalculationResponse {
  status: string;
  required_fields?: string[];
  message?: string | null;
  breakdown?: Record<string, unknown> | null;
  per_item?: Array<Record<string, unknown>> | null;
  assumptions?: string[];
  warnings?: string[];
}

export function CalculatorPage() {
  const { push } = useToast();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const shipmentsQuery = useQuery({
    queryKey: ["shipments"],
    queryFn: () => api.get<ShipmentList>("/shipments"),
    enabled: !useMocks,
    initialData: useMocks ? mockData.shipments : undefined
  });

  const calculateMutation = useMutation({
    mutationFn: (shipmentId: string) => api.post<CalculationResponse>(`/shipments/${shipmentId}/calculate`, {}),
    onSuccess: () => push({ title: "Calculated", description: "Landed cost calculated", variant: "success" }),
    onError: (error: Error) => push({ title: "Calculation failed", description: error.message, variant: "error" })
  });

  const shipments = shipmentsQuery.data?.shipments ?? [];

  if (!shipmentsQuery.isLoading && shipments.length === 0) {
    return <Navigate to="/shipments" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Landed Cost</h1>
          <p className="text-sm text-slate-400">Select a shipment and run calculation.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shipments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Origin</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Incoterm</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shipments.map((shipment) => (
                <TableRow key={shipment.id}>
                  <TableCell>{shipment.id}</TableCell>
                  <TableCell>{shipment.origin_country_default}</TableCell>
                  <TableCell>{shipment.destination_country ?? "-"}</TableCell>
                  <TableCell>{shipment.incoterm}</TableCell>
                  <TableCell><Badge>{shipment.status}</Badge></TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedId(shipment.id);
                        calculateMutation.mutate(shipment.id);
                      }}
                      disabled={calculateMutation.isPending && selectedId === shipment.id}
                    >
                      {calculateMutation.isPending && selectedId === shipment.id ? "Calculating..." : "Calculate"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {shipments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>No shipments yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {calculateMutation.data && (
        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-sm text-slate-600">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-xs text-slate-500">Customs value</p>
                <p className="text-lg font-semibold">{calculateMutation.data.breakdown?.customs_value ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Duty total</p>
                <p className="text-lg font-semibold">{calculateMutation.data.breakdown?.duty_total ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">VAT total</p>
                <p className="text-lg font-semibold">{calculateMutation.data.breakdown?.vat_total ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">VAT base</p>
                <p className="text-lg font-semibold">{calculateMutation.data.breakdown?.vat_base ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Authorities total</p>
                <p className="text-lg font-semibold">{calculateMutation.data.breakdown?.authorities_total ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Other duties</p>
                <p className="text-lg font-semibold">{calculateMutation.data.breakdown?.other_duties_total ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Landed cost total</p>
                <p className="text-lg font-semibold">{calculateMutation.data.breakdown?.landed_cost_total ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Cost per unit</p>
                <p className="text-lg font-semibold">{calculateMutation.data.breakdown?.landed_cost_per_unit ?? "-"}</p>
              </div>
            </div>

            <div>
              <p className="font-medium text-slate-700">Per item</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item ID</TableHead>
                    <TableHead>HS Code</TableHead>
                    <TableHead>Customs Value</TableHead>
                    <TableHead>Duty Rate</TableHead>
                    <TableHead>Duty Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calculateMutation.data.per_item?.map((item, idx) => (
                    <TableRow key={item.item_id ?? idx}>
                      <TableCell>{item.item_id ?? "-"}</TableCell>
                      <TableCell>{item.hs_code ?? "-"}</TableCell>
                      <TableCell>{item.customs_value ?? "-"}</TableCell>
                      <TableCell>{item.duty_rate ?? "-"}</TableCell>
                      <TableCell>{item.duty_amount ?? "-"}</TableCell>
                    </TableRow>
                  )) ?? (
                    <TableRow>
                      <TableCell colSpan={5}>No per-item data.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {calculateMutation.data.assumptions?.length ? (
              <div>
                <p className="font-medium text-slate-700">Assumptions</p>
                <ul className="list-disc pl-4">
                  {calculateMutation.data.assumptions.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {calculateMutation.data.warnings?.length ? (
              <div>
                <p className="font-medium text-slate-700">Warnings</p>
                <ul className="list-disc pl-4">
                  {calculateMutation.data.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
