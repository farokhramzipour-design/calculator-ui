import React from "react";
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

interface Country {
  id: string;
  code: string;
  name: string;
  region: string;
}

export function ShipmentsPage() {
  const form = useForm<ShipmentFormValues>({ resolver: zodResolver(shipmentSchema) });

  const listQuery = useQuery({
    queryKey: ["shipments"],
    queryFn: () => api.get<ShipmentList>("/shipments"),
    enabled: !useMocks,
    initialData: useMocks ? mockData.shipments : undefined
  });

  const countriesQuery = useQuery({
    queryKey: ["countries"],
    queryFn: () => api.get<{ countries: Country[] }>("/countries"),
    enabled: !useMocks,
    initialData: useMocks ? mockData.countries : undefined
  });

  const createMutation = useMutation({
    mutationFn: (payload: ShipmentFormValues) => api.post("/shipments", payload),
    onSuccess: () => listQuery.refetch()
  });

  const direction = form.watch("direction");
  const incoterm = form.watch("incoterm");
  const countries = countriesQuery.data?.countries ?? [];
  const ukCode = countries.find((c) => c.name.toLowerCase().includes("united kingdom"))?.code ?? "GB";

  const incotermHints: Record<string, string> = {
    EXW: "Seller makes goods available; buyer pays freight + insurance.",
    FCA: "Seller delivers to carrier; buyer pays main transport/insurance.",
    CPT: "Seller pays freight; risk transfers early; insurance not included.",
    CIP: "Seller pays freight + insurance to destination.",
    DAP: "Seller delivers to place; buyer pays import duty/VAT.",
    DPU: "Seller delivers and unloads; buyer handles import clearance.",
    DDP: "Seller pays freight, insurance, duty, VAT.",
    FAS: "Sea/inland only. Seller places goods alongside vessel.",
    FOB: "Sea/inland only. Risk transfers onboard.",
    CFR: "Sea/inland only. Seller pays freight; insurance not included.",
    CIF: "Sea/inland only. Seller pays freight + insurance."
  };

  React.useEffect(() => {
    if (direction === "IMPORT_UK") {
      form.setValue("destination_country", ukCode);
    }
    if (direction === "IMPORT_EU") {
      form.setValue("origin_country_default", ukCode);
    }
  }, [direction, form, ukCode]);

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
              {direction === "IMPORT_EU" ? (
                <Select {...form.register("destination_country")}>
                  <option value="">Select destination</option>
                  {countries.map((country) => (
                    <option key={country.id} value={country.code}>
                      {country.name} ({country.code})
                    </option>
                  ))}
                </Select>
              ) : (
                <Input readOnly value={form.watch("destination_country") ?? ""} />
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Origin country</label>
              {direction === "IMPORT_UK" ? (
                <Select {...form.register("origin_country_default")}>
                  <option value="">Select origin</option>
                  {countries.map((country) => (
                    <option key={country.id} value={country.code}>
                      {country.name} ({country.code})
                    </option>
                  ))}
                </Select>
              ) : (
                <Input readOnly value={form.watch("origin_country_default") ?? ""} />
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Incoterm</label>
              <Select {...form.register("incoterm")}>
                <option value="EXW">EXW</option>
                <option value="FCA">FCA</option>
                <option value="CPT">CPT</option>
                <option value="CIP">CIP</option>
                <option value="DAP">DAP</option>
                <option value="DPU">DPU</option>
                <option value="DDP">DDP</option>
                <option value="FAS">FAS</option>
                <option value="FOB">FOB</option>
                <option value="CFR">CFR</option>
                <option value="CIF">CIF</option>
              </Select>
              {incotermHints[incoterm] && (
                <p className="mt-2 text-xs text-slate-500">{incotermHints[incoterm]}</p>
              )}
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
