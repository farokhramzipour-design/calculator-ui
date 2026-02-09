import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { mockData, useMocks } from "@/lib/mock";
import { useToast } from "@/components/ui/toaster";
import { useNavigate } from "react-router-dom";
import { Select } from "@/components/ui/select";
import React, { useState } from "react";

interface PassportItem {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  hs_code: string | null;
  supplier: string | null;
  weight_per_unit: string | null;
  weight: string | null;
  notes: string | null;
}

interface ShipmentList {
  shipments: Array<{ id: string; origin_country_default: string; destination_country: string | null; status: string }>;
}

interface InvoiceRead {
  id: string;
  invoice_number: string | null;
  supplier_name: string | null;
}

export function PassportPage() {
  const { push } = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const navigate = useNavigate();
  const [shipmentId, setShipmentId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const listQuery = useQuery({
    queryKey: ["passport"],
    queryFn: () => api.get<PassportItem[]>("/passport"),
    enabled: !useMocks,
    initialData: useMocks ? mockData.passportItems : undefined
  });

  const shipmentsQuery = useQuery({
    queryKey: ["shipments"],
    queryFn: () => api.get<ShipmentList>("/shipments"),
    enabled: !useMocks,
    initialData: useMocks ? mockData.shipments : undefined
  });

  const invoicesQuery = useQuery({
    queryKey: ["invoices"],
    queryFn: () => api.get<InvoiceRead[]>("/invoices"),
    enabled: !useMocks,
    initialData: useMocks ? mockData.invoices : undefined
  });

  const form = useForm({
    defaultValues: { name: "", hs_code: "", description: "", weight_per_unit: "", weight: "", supplier: "", notes: "" }
  });

  const editForm = useForm({
    defaultValues: { name: "", hs_code: "", description: "", weight_per_unit: "", weight: "", supplier: "", notes: "" }
  });

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.post("/passport", payload),
    onSuccess: () => {
      push({ title: "Saved", description: "Passport item created", variant: "success" });
      listQuery.refetch();
      form.reset();
    }
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; data: Record<string, unknown> }) =>
      api.patch(`/passport/${payload.id}`, payload.data),
    onSuccess: () => {
      push({ title: "Updated", description: "Passport item updated", variant: "success" });
      listQuery.refetch();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/passport/${id}`),
    onSuccess: () => {
      push({ title: "Deleted", description: "Passport item removed", variant: "success" });
      listQuery.refetch();
      setSelectedId(null);
    }
  });

  const addToShipmentMutation = useMutation({
    mutationFn: (payload: { shipmentId: string; passportItemId: string; quantity: string; unitPrice: string }) =>
      api.post(
        `/shipments/${payload.shipmentId}/items/from-passport?passport_item_id=${payload.passportItemId}&quantity=${payload.quantity}&unit_price=${payload.unitPrice}`
      ),
    onSuccess: () => {
      push({ title: "Added", description: "Passport item added to shipment", variant: "success" });
    },
    onError: (error: Error) => {
      push({ title: "Failed", description: error.message, variant: "error" });
    }
  });

  const addToInvoiceMutation = useMutation({
    mutationFn: (payload: { invoiceId: string; passportItemId: string; quantity?: string; unitPrice?: string }) =>
      api.post(
        `/invoices/${payload.invoiceId}/items/from-passport?passport_item_id=${payload.passportItemId}${
          payload.quantity ? `&quantity=${payload.quantity}` : ""
        }${payload.unitPrice ? `&unit_price=${payload.unitPrice}` : ""}`
      ),
    onSuccess: () => {
      push({ title: "Added", description: "Passport item added to invoice", variant: "success" });
    },
    onError: (error: Error) => {
      push({ title: "Failed", description: error.message, variant: "error" });
    }
  });

  const selected = listQuery.data?.find((item) => item.id === selectedId) ?? null;
  const shipments = shipmentsQuery.data?.shipments ?? [];
  const invoices = invoicesQuery.data ?? [];

  React.useEffect(() => {
    if (selected) {
      editForm.reset({
        name: selected.name,
        hs_code: selected.hs_code ?? "",
        description: selected.description ?? "",
        weight_per_unit: selected.weight_per_unit ?? "",
        weight: selected.weight ?? "",
        supplier: selected.supplier ?? "",
        notes: selected.notes ?? ""
      });
    }
  }, [selected, editForm]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Passport Library</h1>
        <p className="text-sm text-slate-400">Store reusable commodity profiles for metal import flows.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add item</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-3" onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}>
            <Input placeholder="Name" {...form.register("name")} />
            <Input placeholder="HS/TARIC code" {...form.register("hs_code")} />
            <Input placeholder="Description" {...form.register("description")} />
            <Input placeholder="Weight per unit" {...form.register("weight_per_unit")} />
            <Input placeholder="Weight" {...form.register("weight")} />
            <Input placeholder="Supplier" {...form.register("supplier")} />
            <Input placeholder="Notes" {...form.register("notes")} />
            <Button type="submit" className="md:col-span-3">Save item</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saved items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>HS Code</TableHead>
                <TableHead>Weight/unit</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listQuery.data?.map((item) => (
                <TableRow key={item.id} className="cursor-pointer" onClick={() => setSelectedId(item.id)}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.hs_code ?? "-"}</TableCell>
                  <TableCell>{item.weight_per_unit ?? "-"}</TableCell>
                  <TableCell>{item.supplier ?? "-"}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        localStorage.setItem(
                          "passport_prefill",
                          JSON.stringify({
                            name: item.name,
                            hs_code: item.hs_code,
                            weight_per_unit: item.weight_per_unit,
                            supplier: item.supplier
                          })
                        );
                        push({ title: "Loaded", description: "Passport item ready in calculator", variant: "success" });
                        navigate("/calculator");
                      }}
                    >
                      Use in calculator
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selected && (
        <Card>
          <CardHeader>
            <CardTitle>Edit item</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 md:grid-cols-3"
              onSubmit={editForm.handleSubmit((values) =>
                updateMutation.mutate({ id: selected.id, data: values })
              )}
            >
              <Input placeholder="Name" {...editForm.register("name")} />
              <Input placeholder="HS/TARIC code" {...editForm.register("hs_code")} />
              <Input placeholder="Description" {...editForm.register("description")} />
              <Input placeholder="Weight per unit" {...editForm.register("weight_per_unit")} />
              <Input placeholder="Weight" {...editForm.register("weight")} />
              <Input placeholder="Supplier" {...editForm.register("supplier")} />
              <Input placeholder="Notes" {...editForm.register("notes")} />
              <div className="md:col-span-3 flex gap-2">
                <Button type="submit">Update</Button>
                <Button type="button" variant="destructive" onClick={() => deleteMutation.mutate(selected.id)}>
                  Delete
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {selected && (
        <Card>
          <CardHeader>
            <CardTitle>Use passport item</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-4">
            <Select value={shipmentId} onChange={(e) => setShipmentId(e.target.value)}>
              <option value="">Select shipment</option>
              {shipments.map((shipment) => (
                <option key={shipment.id} value={shipment.id}>
                  {shipment.id} · {shipment.origin_country_default} → {shipment.destination_country ?? "-"} · {shipment.status}
                </option>
              ))}
            </Select>
            <Input placeholder="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            <Input placeholder="Unit price" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
            <Button
              onClick={() => {
                if (!shipmentId || !quantity || !unitPrice) {
                  push({ title: "Missing fields", description: "Select shipment, quantity, unit price", variant: "error" });
                  return;
                }
                addToShipmentMutation.mutate({ shipmentId, passportItemId: selected.id, quantity, unitPrice });
              }}
            >
              Add to shipment
            </Button>
            <Select value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)} className="md:col-span-2">
              <option value="">Select invoice (optional)</option>
              {invoices.map((invoice) => (
                <option key={invoice.id} value={invoice.id}>
                  {invoice.invoice_number ?? invoice.id} · {invoice.supplier_name ?? "-"}
                </option>
              ))}
            </Select>
            <Button
              variant="secondary"
              onClick={() => {
                if (!invoiceId) {
                  push({ title: "Invoice required", description: "Select invoice", variant: "error" });
                  return;
                }
                addToInvoiceMutation.mutate({ invoiceId, passportItemId: selected.id, quantity, unitPrice });
              }}
            >
              Add to invoice
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
