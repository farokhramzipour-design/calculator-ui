import * as React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api, apiUpload } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toaster";
import { mockData, useMocks } from "@/lib/mock";

interface InvoiceItemRead {
  id: string;
  description: string;
  hs_code: string | null;
  origin_country: string | null;
  quantity: string | null;
  unit_price: string | null;
  total_price: string | null;
}

interface InvoiceRead {
  id: string;
  shipment_id: string | null;
  file_type: string;
  invoice_number: string | null;
  invoice_date: string | null;
  supplier_name: string | null;
  buyer_name: string | null;
  currency: string | null;
  subtotal: string | null;
  freight: string | null;
  insurance: string | null;
  tax_total: string | null;
  total: string | null;
  status: "UPLOADED" | "EXTRACTED" | "REVIEWED" | "CONFIRMED";
  items: InvoiceItemRead[];
}

export function InvoicesPage() {
  const { push } = useToast();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [shipmentId, setShipmentId] = React.useState("");
  const [draft, setDraft] = React.useState<InvoiceRead | null>(null);

  const listQuery = useQuery({
    queryKey: ["invoices"],
    queryFn: () => api.get<InvoiceRead[]>("/invoices"),
    enabled: !useMocks,
    initialData: useMocks ? mockData.invoices : undefined
  });

  const shipmentsQuery = useQuery({
    queryKey: ["shipments"],
    queryFn: () => api.get<{ shipments: Array<{ id: string; origin_country_default: string; destination_country: string | null; status: string }> }>("/shipments"),
    enabled: !useMocks,
    initialData: useMocks ? mockData.shipments : undefined
  });

  const selectedInvoice = (useMocks ? mockData.invoices : listQuery.data)?.find((inv) => inv.id === selectedId) ?? null;

  const invoiceQuery = useQuery({
    queryKey: ["invoice", selectedId],
    queryFn: () => api.get<InvoiceRead>(`/invoices/${selectedId}`),
    enabled: !!selectedId && !useMocks
  });

  const invoice = useMocks ? selectedInvoice : invoiceQuery.data ?? selectedInvoice;
  const shipments = (useMocks ? mockData.shipments.shipments : shipmentsQuery.data?.shipments) ?? [];

  React.useEffect(() => {
    if (invoice) {
      setDraft(invoice);
      setShipmentId(invoice.shipment_id ?? "");
    }
  }, [invoice]);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return apiUpload<InvoiceRead>("/invoices/upload", form);
    },
    onSuccess: (data) => {
      push({ title: "Uploaded", description: `Invoice ${data.invoice_number ?? data.id} ready for review`, variant: "success" });
      setSelectedId(data.id);
      listQuery.refetch();
    },
    onError: (error: Error) => push({ title: "Upload failed", description: error.message, variant: "error" })
  });

  const reviewMutation = useMutation({
    mutationFn: (payload: { id: string; status: InvoiceRead["status"] }) =>
      api.post<InvoiceRead>(`/invoices/${payload.id}/review`, { status: payload.status }),
    onSuccess: (data) => {
      push({ title: "Invoice updated", description: `Status set to ${data.status}`, variant: "success" });
      listQuery.refetch();
    }
  });

  const assignMutation = useMutation({
    mutationFn: (payload: { invoice_id: string; shipment_id: string }) =>
      api.post<InvoiceRead>(`/invoices/assign?shipment_id=${payload.shipment_id}`, { invoice_id: payload.invoice_id }),
    onSuccess: () => {
      push({ title: "Assigned", description: "Invoice linked to shipment", variant: "success" });
      listQuery.refetch();
    }
  });

  const updateField = (field: keyof InvoiceRead, value: string | null) => {
    setDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const updateItemField = (id: string, field: keyof InvoiceItemRead, value: string | null) => {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((item) => (item.id === id ? { ...item, [field]: value } : item))
          }
        : prev
    );
  };

  const saveEdits = () => {
    push({ title: "Edits saved", description: "Invoice edits are staged in the UI.", variant: "success" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Invoices</h1>
        <p className="text-sm text-slate-400">Upload, review, and assign invoices to shipments.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload invoice</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          <Input type="file" accept=".pdf,.doc,.docx" onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) uploadMutation.mutate(file);
          }} />
          <Button variant="outline" onClick={() => setSelectedId(mockData.invoices[0]?.id ?? null)}>Use demo invoice</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Shipment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(useMocks ? mockData.invoices : listQuery.data)?.map((inv) => (
                <TableRow key={inv.id} className="cursor-pointer" onClick={() => setSelectedId(inv.id)}>
                  <TableCell>{inv.invoice_number ?? inv.id}</TableCell>
                  <TableCell>{inv.supplier_name ?? "-"}</TableCell>
                  <TableCell><Badge>{inv.status}</Badge></TableCell>
                  <TableCell>{inv.shipment_id ?? "Unassigned"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {draft && (
        <Card>
          <CardHeader>
            <CardTitle>Invoice review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-xs text-slate-500">Supplier</p>
                <Input value={draft.supplier_name ?? ""} onChange={(e) => updateField("supplier_name", e.target.value)} />
              </div>
              <div>
                <p className="text-xs text-slate-500">Buyer</p>
                <Input value={draft.buyer_name ?? ""} onChange={(e) => updateField("buyer_name", e.target.value)} />
              </div>
              <div>
                <p className="text-xs text-slate-500">Invoice #</p>
                <Input value={draft.invoice_number ?? ""} onChange={(e) => updateField("invoice_number", e.target.value)} />
              </div>
              <div>
                <p className="text-xs text-slate-500">Date</p>
                <Input type="date" value={draft.invoice_date ?? ""} onChange={(e) => updateField("invoice_date", e.target.value)} />
              </div>
              <div>
                <p className="text-xs text-slate-500">Currency</p>
                <Input value={draft.currency ?? ""} onChange={(e) => updateField("currency", e.target.value)} />
              </div>
              <div>
                <p className="text-xs text-slate-500">Subtotal</p>
                <Input value={draft.subtotal ?? ""} onChange={(e) => updateField("subtotal", e.target.value)} />
              </div>
              <div>
                <p className="text-xs text-slate-500">Freight</p>
                <Input value={draft.freight ?? ""} onChange={(e) => updateField("freight", e.target.value)} />
              </div>
              <div>
                <p className="text-xs text-slate-500">Insurance</p>
                <Input value={draft.insurance ?? ""} onChange={(e) => updateField("insurance", e.target.value)} />
              </div>
              <div>
                <p className="text-xs text-slate-500">Tax total</p>
                <Input value={draft.tax_total ?? ""} onChange={(e) => updateField("tax_total", e.target.value)} />
              </div>
              <div>
                <p className="text-xs text-slate-500">Total</p>
                <Input value={draft.total ?? ""} onChange={(e) => updateField("total", e.target.value)} />
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>HS code</TableHead>
                  <TableHead>Origin</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit price</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {draft.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Input value={item.description} onChange={(e) => updateItemField(item.id, "description", e.target.value)} />
                    </TableCell>
                    <TableCell>
                      <Input value={item.hs_code ?? ""} onChange={(e) => updateItemField(item.id, "hs_code", e.target.value)} />
                    </TableCell>
                    <TableCell>
                      <Input value={item.origin_country ?? ""} onChange={(e) => updateItemField(item.id, "origin_country", e.target.value)} />
                    </TableCell>
                    <TableCell>
                      <Input value={item.quantity ?? ""} onChange={(e) => updateItemField(item.id, "quantity", e.target.value)} />
                    </TableCell>
                    <TableCell>
                      <Input value={item.unit_price ?? ""} onChange={(e) => updateItemField(item.id, "unit_price", e.target.value)} />
                    </TableCell>
                    <TableCell>
                      <Input value={item.total_price ?? ""} onChange={(e) => updateItemField(item.id, "total_price", e.target.value)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {!draft.items.some((item) => item.hs_code) && (
              <Alert variant="warning">No HS code found. Please enter HS code or select from Passport Library.</Alert>
            )}

            <div className="flex items-center justify-between gap-3">
              <Button variant="outline" onClick={saveEdits}>
                Save edits
              </Button>
              <Badge>Edits staged</Badge>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <Select
                value={draft.status}
                onChange={(e) => {
                  const status = e.target.value as InvoiceRead["status"];
                  setDraft((prev) => (prev ? { ...prev, status } : prev));
                  reviewMutation.mutate({ id: draft.id, status });
                }}
              >
                <option value="UPLOADED">Uploaded</option>
                <option value="EXTRACTED">Extracted</option>
                <option value="REVIEWED">Reviewed</option>
                <option value="CONFIRMED">Confirmed</option>
              </Select>

              <Select value={shipmentId} onChange={(e) => setShipmentId(e.target.value)}>
                <option value="">Select shipment</option>
                {shipments.map((shipment) => (
                  <option key={shipment.id} value={shipment.id}>
                    {shipment.id} · {shipment.origin_country_default} → {shipment.destination_country ?? "-"} · {shipment.status}
                  </option>
                ))}
              </Select>
              <Button
                variant="secondary"
                onClick={() => {
                  if (!shipmentId) {
                    push({ title: "Shipment required", description: "Enter shipment ID", variant: "error" });
                    return;
                  }
                  assignMutation.mutate({ invoice_id: invoice.id, shipment_id: shipmentId });
                }}
              >
                Assign to shipment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
