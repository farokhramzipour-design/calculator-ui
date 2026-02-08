import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { shipmentSchema, ShipmentFormValues } from "./schema";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { mockData, useMocks } from "@/lib/mock";
import { Link } from "react-router-dom";

interface ShipmentList {
  shipments: Array<{ id: string; destination_country: string | null; origin_country_default: string; incoterm: string; currency: string; status: string }>;
}

export function ShipmentsPage() {
  const form = useForm<ShipmentFormValues>({ resolver: zodResolver(shipmentSchema) });

  const listQuery = useQuery({
    queryKey: ["shipments"],
    queryFn: () => api.get<ShipmentList>("/shipments"),
    enabled: !useMocks,
    initialData: useMocks ? mockData.shipments : undefined
  });

  const createMutation = useMutation({
    mutationFn: (payload: ShipmentFormValues) => api.post("/shipments", payload),
    onSuccess: () => listQuery.refetch()
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Shipments</h1>
        <p className="text-sm text-slate-400">Create and manage inbound shipments with cost tracking.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New shipment</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-3" onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}>
            <div>
              <label className="text-xs font-medium text-slate-600">Direction</label>
              <Select {...form.register("direction")}>
                <option value="IMPORT_EU">Import into EU</option>
                <option value="IMPORT_UK">Import into UK</option>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Destination country</label>
              <Input placeholder="DE" {...form.register("destination_country")} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Origin country</label>
              <Input placeholder="CN" {...form.register("origin_country_default")} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Incoterm</label>
              <Select {...form.register("incoterm")}>
                <option value="CIF">CIF</option>
                <option value="FOB">FOB</option>
                <option value="EXW">EXW</option>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Currency</label>
              <Input placeholder="EUR" {...form.register("currency")} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">ETA</label>
              <Input type="date" {...form.register("import_date")} />
            </div>
            <div className="md:col-span-3">
              <Button type="submit">Create shipment</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active shipments</CardTitle>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {listQuery.data?.shipments?.map((shipment) => (
                <TableRow key={shipment.id}>
                  <TableCell>
                    <Link className="text-brand-600" to={`/shipments/${shipment.id}`}>{shipment.id}</Link>
                  </TableCell>
                  <TableCell>{shipment.origin_country_default}</TableCell>
                  <TableCell>{shipment.destination_country ?? "-"}</TableCell>
                  <TableCell>{shipment.incoterm}</TableCell>
                  <TableCell><Badge>{shipment.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
