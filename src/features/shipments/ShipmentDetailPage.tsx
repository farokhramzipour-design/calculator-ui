import React from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { mockData, useMocks } from "@/lib/mock";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toaster";

interface ShipmentDetail {
  id: string;
  status: string;
  direction: string;
  destination_country: string | null;
  origin_country_default: string;
  incoterm: string;
  currency: string;
  items: Array<{ id: string; description: string; hs_code: string; quantity: string; unit_price: string; origin_country: string }>;
  costs?: {
    freight_amount?: string | null;
    insurance_amount?: string | null;
    insurance_is_estimated?: boolean;
    brokerage_amount?: string | null;
    port_fees_amount?: string | null;
    inland_transport_amount?: string | null;
    other_incidental_amount?: string | null;
  } | null;
}

interface InvoiceRead {
  id: string;
  shipment_id: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  supplier_name: string | null;
  buyer_name: string | null;
  currency: string | null;
  subtotal: string | null;
  freight: string | null;
  insurance: string | null;
  total: string | null;
  items: Array<{
    id: string;
    description: string;
    hs_code: string | null;
    origin_country: string | null;
    quantity: string | null;
    unit_price: string | null;
    total_price: string | null;
  }>;
}

const formatNumber = (value?: string | number | null) => {
  if (value === null || value === undefined || value === "") return "-";
  const num = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(num)) return String(value);
  return num.toLocaleString("en-GB", { maximumFractionDigits: 6 });
};

export function ShipmentDetailPage() {
  const { push } = useToast();
  const { id } = useParams();
  const [selectedInvoiceId, setSelectedInvoiceId] = React.useState("");
  const [selectedInvoiceItemId, setSelectedInvoiceItemId] = React.useState("");
  const detailQuery = useQuery({
    queryKey: ["shipment", id],
    queryFn: () => api.get<ShipmentDetail>(`/shipments/${id}`),
    enabled: !!id
  });

  const invoicesQuery = useQuery({
    queryKey: ["invoices"],
    queryFn: () => api.get<InvoiceRead[]>("/invoices"),
    enabled: !useMocks,
    initialData: useMocks ? mockData.invoices : undefined
  });

  const passportQuery = useQuery({
    queryKey: ["passport"],
    queryFn: () => api.get<Array<{ id: string; name: string; hs_code: string | null }>>("/passport"),
    enabled: !useMocks,
    initialData: useMocks ? mockData.passportItems : undefined
  });

  const itemForm = useForm({
    defaultValues: { description: "", hs_code: "", quantity: 0, unit_price: 0, origin_country: "" }
  });

  const addItem = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.post(`/shipments/${id}/items`, payload),
    onSuccess: () => detailQuery.refetch()
  });

  const updateItem = useMutation({
    mutationFn: (payload: { itemId: string; data: Record<string, unknown> }) =>
      api.put(`/shipments/${id}/items/${payload.itemId}`, payload.data),
    onSuccess: () => {
      push({ title: "Updated", description: "Shipment item updated", variant: "success" });
      detailQuery.refetch();
    },
    onError: (error: Error) => {
      push({ title: "Update failed", description: error.message, variant: "error" });
    }
  });

  const deleteItem = useMutation({
    mutationFn: (itemId: string) => api.delete(`/shipments/${id}/items/${itemId}`),
    onSuccess: () => {
      push({ title: "Deleted", description: "Shipment item removed", variant: "success" });
      detailQuery.refetch();
    },
    onError: (error: Error) => {
      push({ title: "Delete failed", description: error.message, variant: "error" });
    }
  });

  const addFromPassport = useMutation({
    mutationFn: (payload: { passportItemId: string; quantity: string; unitPrice: string }) =>
      api.post(`/shipments/${id}/items/from-passport?passport_item_id=${payload.passportItemId}&quantity=${payload.quantity}&unit_price=${payload.unitPrice}`),
    onSuccess: () => {
      push({ title: "Added", description: "Passport item added to shipment", variant: "success" });
      detailQuery.refetch();
    },
    onError: (error: Error) => {
      push({ title: "Failed", description: error.message, variant: "error" });
    }
  });

  const costsForm = useForm({
    defaultValues: {
      freight_amount: "",
      insurance_amount: "",
      insurance_is_estimated: false,
      brokerage_amount: "",
      port_fees_amount: "",
      inland_transport_amount: "",
      other_incidental_amount: ""
    }
  });

  const passportForm = useForm({
    defaultValues: { passport_item_id: "", quantity: "", unit_price: "" }
  });

  const upsertCosts = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.put(`/shipments/${id}/costs`, payload),
    onSuccess: () => detailQuery.refetch()
  });

  const shipment = detailQuery.data;
  const invoices = useMocks ? mockData.invoices : invoicesQuery.data ?? [];
  const linkedInvoice = invoices.find((inv) => inv.shipment_id === id) ?? null;
  const passportItems = passportQuery.data ?? [];
  const invoiceForFill = invoices.find((inv) => inv.id === selectedInvoiceId) ?? null;
  const invoiceItems = invoiceForFill?.items ?? [];
  const activeInvoiceItem = invoiceItems.find((item) => item.id === selectedInvoiceItemId) ?? invoiceItems[0];

  const freightIncludedTerms = new Set(["CFR", "CIF", "CPT", "CIP", "DAP", "DPU", "DDP"]);
  const insuranceIncludedTerms = new Set(["CIF", "CIP", "DDP"]);
  const freightLocked = shipment ? freightIncludedTerms.has(shipment.incoterm) : false;
  const insuranceLocked = shipment ? insuranceIncludedTerms.has(shipment.incoterm) : false;

  React.useEffect(() => {
    if (!shipment) return;
    if (freightLocked) costsForm.setValue("freight_amount", "0");
    if (insuranceLocked) costsForm.setValue("insurance_amount", "0");
    if (shipment.costs) {
      costsForm.reset({
        freight_amount: shipment.costs.freight_amount ?? (freightLocked ? "0" : ""),
        insurance_amount: shipment.costs.insurance_amount ?? (insuranceLocked ? "0" : ""),
        insurance_is_estimated: shipment.costs.insurance_is_estimated ?? false,
        brokerage_amount: shipment.costs.brokerage_amount ?? "",
        port_fees_amount: shipment.costs.port_fees_amount ?? "",
        inland_transport_amount: shipment.costs.inland_transport_amount ?? "",
        other_incidental_amount: shipment.costs.other_incidental_amount ?? ""
      });
    }
  }, [shipment, freightLocked, insuranceLocked, costsForm]);

  React.useEffect(() => {
    if (!invoiceForFill || invoiceItems.length === 0) return;
    const item = activeInvoiceItem ?? invoiceItems[0];
    if (item) {
      setSelectedInvoiceItemId(item.id);
      itemForm.reset({
        description: item.description ?? "",
        hs_code: item.hs_code ?? "",
        quantity: Number(item.quantity ?? 0),
        unit_price: Number(item.unit_price ?? 0),
        origin_country: item.origin_country ?? ""
      });
    }
  }, [invoiceForFill, invoiceItems, activeInvoiceItem, itemForm]);

  const applyInvoiceToShipment = () => {
    if (!linkedInvoice) return;
    const firstItem = linkedInvoice.items[0];
    if (firstItem) {
      itemForm.reset({
        description: firstItem.description,
        hs_code: firstItem.hs_code ?? "",
        quantity: Number(firstItem.quantity ?? 0),
        unit_price: Number(firstItem.unit_price ?? 0),
        origin_country: firstItem.origin_country ?? ""
      });
    }
    costsForm.reset({
      freight_amount: linkedInvoice.freight ?? "",
      insurance_amount: linkedInvoice.insurance ?? ""
    });
  };

  if (!shipment) return <div className="text-slate-200">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Shipment {shipment.id}</h1>
        <p className="text-sm text-slate-400">Direction: {shipment.direction} · Incoterm {shipment.incoterm}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge>{shipment.status}</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>HS code</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit price</TableHead>
                <TableHead>Origin</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shipment.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Input defaultValue={item.description} onChange={(e) => (item.description = e.target.value)} />
                  </TableCell>
                  <TableCell>
                    <Input defaultValue={item.hs_code} onChange={(e) => (item.hs_code = e.target.value)} />
                  </TableCell>
                  <TableCell>
                    <Input defaultValue={formatNumber(item.quantity)} onChange={(e) => (item.quantity = e.target.value)} />
                  </TableCell>
                  <TableCell>
                    <Input defaultValue={formatNumber(item.unit_price)} onChange={(e) => (item.unit_price = e.target.value)} />
                  </TableCell>
                  <TableCell>
                    <Input defaultValue={item.origin_country} onChange={(e) => (item.origin_country = e.target.value)} />
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        updateItem.mutate({
                          itemId: item.id,
                          data: {
                            description: item.description,
                            hs_code: item.hs_code,
                            origin_country: item.origin_country,
                            quantity: item.quantity,
                            unit_price: item.unit_price
                          }
                        })
                      }
                    >
                      Update
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteItem.mutate(item.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <form className="grid gap-4 md:grid-cols-5" onSubmit={itemForm.handleSubmit((values) => addItem.mutate(values))}>
            <Input placeholder="Description" {...itemForm.register("description")} />
            <Input placeholder="HS code" {...itemForm.register("hs_code")} />
            <Input type="number" placeholder="Qty" {...itemForm.register("quantity")} />
            <Input type="number" step="0.01" placeholder="Unit price" {...itemForm.register("unit_price")} />
            <Input placeholder="Origin" {...itemForm.register("origin_country")} />
            <Button type="submit" className="md:col-span-5">Add item</Button>
          </form>

          <div className="grid gap-3 md:grid-cols-3">
            <Select value={selectedInvoiceId} onChange={(e) => setSelectedInvoiceId(e.target.value)}>
              <option value="">Load items from invoice</option>
              {invoices.map((invoice) => (
                <option key={invoice.id} value={invoice.id}>
                  {invoice.invoice_number ?? invoice.id} · {invoice.supplier_name ?? "-"}
                </option>
              ))}
            </Select>
            <Select
              value={selectedInvoiceItemId}
              onChange={(e) => setSelectedInvoiceItemId(e.target.value)}
              disabled={!selectedInvoiceId}
            >
              <option value="">Select invoice item</option>
              {invoiceItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.description} {item.hs_code ? `· ${item.hs_code}` : ""}
                </option>
              ))}
            </Select>
            <Button
              variant="secondary"
              onClick={() => {
                if (!selectedInvoiceId || !activeInvoiceItem) {
                  push({ title: "Select invoice item", description: "Choose an invoice and item to load", variant: "error" });
                  return;
                }
                itemForm.reset({
                  description: activeInvoiceItem.description ?? "",
                  hs_code: activeInvoiceItem.hs_code ?? "",
                  quantity: Number(activeInvoiceItem.quantity ?? 0),
                  unit_price: Number(activeInvoiceItem.unit_price ?? 0),
                  origin_country: activeInvoiceItem.origin_country ?? ""
                });
              }}
            >
              Fill from invoice
            </Button>
          </div>

          <form
            className="grid gap-4 md:grid-cols-4"
            onSubmit={passportForm.handleSubmit((values) => {
              if (!values.passport_item_id || !values.quantity || !values.unit_price) {
                push({ title: "Missing fields", description: "Select passport item, quantity, unit price", variant: "error" });
                return;
              }
              addFromPassport.mutate({
                passportItemId: values.passport_item_id,
                quantity: values.quantity,
                unitPrice: values.unit_price
              });
            })}
          >
            <Select {...passportForm.register("passport_item_id")}>
              <option value="">Add from passport</option>
              {passportItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} {item.hs_code ? `· ${item.hs_code}` : ""}
                </option>
              ))}
            </Select>
            <Input placeholder="Quantity" {...passportForm.register("quantity")} />
            <Input type="number" step="0.01" placeholder="Unit price" {...passportForm.register("unit_price")} />
            <Button type="submit" variant="secondary">Add from passport</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Costs</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={costsForm.handleSubmit((values) => upsertCosts.mutate(values))}>
            <Input
              placeholder={freightLocked ? "Freight included (0)" : "Freight amount"}
              readOnly={freightLocked}
              {...costsForm.register("freight_amount")}
            />
            <Input
              placeholder={insuranceLocked ? "Insurance included (0)" : "Insurance amount"}
              readOnly={insuranceLocked}
              {...costsForm.register("insurance_amount")}
            />
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" {...costsForm.register("insurance_is_estimated")} disabled={insuranceLocked} />
              Insurance is estimated
            </label>
            <div />
            <Input placeholder="Brokerage amount" {...costsForm.register("brokerage_amount")} />
            <Input placeholder="Port fees amount" {...costsForm.register("port_fees_amount")} />
            <Input placeholder="Inland transport amount" {...costsForm.register("inland_transport_amount")} />
            <Input placeholder="Other incidental amount" {...costsForm.register("other_incidental_amount")} />
            <Button type="submit" className="md:col-span-2">Save costs</Button>
          </form>
        </CardContent>
      </Card>

      {linkedInvoice && (
        <Card>
          <CardHeader>
            <CardTitle>Linked invoice</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-xs text-slate-500">Invoice #</p>
                <p className="text-sm font-medium">{linkedInvoice.invoice_number ?? linkedInvoice.id}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Supplier</p>
                <p className="text-sm font-medium">{linkedInvoice.supplier_name ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Total</p>
                <p className="text-sm font-medium">{linkedInvoice.total ?? "-"}</p>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>HS code</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linkedInvoice.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.hs_code ?? "-"}</TableCell>
                  <TableCell>{formatNumber(item.quantity)}</TableCell>
                  <TableCell>{formatNumber(item.unit_price)}</TableCell>
                </TableRow>
              ))}
              </TableBody>
            </Table>
            <Button variant="secondary" onClick={applyInvoiceToShipment}>Load invoice data into shipment</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Linked documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          <p>Invoice: Not linked</p>
          <p>Calculation: Not linked</p>
        </CardContent>
      </Card>
    </div>
  );
}
