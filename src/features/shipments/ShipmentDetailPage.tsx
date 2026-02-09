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
  costs?: { freight_amount?: string | null; insurance_amount?: string | null } | null;
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

export function ShipmentDetailPage() {
  const { push } = useToast();
  const { id } = useParams();
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
    defaultValues: { freight_amount: "", insurance_amount: "" }
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {shipment.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.hs_code}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.unit_price}</TableCell>
                  <TableCell>{item.origin_country}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <form className="grid gap-4 md:grid-cols-5" onSubmit={itemForm.handleSubmit((values) => addItem.mutate(values))}>
            <Input placeholder="Description" {...itemForm.register("description")} />
            <Input placeholder="HS code" {...itemForm.register("hs_code")} />
            <Input type="number" placeholder="Qty" {...itemForm.register("quantity")} />
            <Input type="number" placeholder="Unit price" {...itemForm.register("unit_price")} />
            <Input placeholder="Origin" {...itemForm.register("origin_country")} />
            <Button type="submit" className="md:col-span-5">Add item</Button>
          </form>

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
            <Input placeholder="Unit price" {...passportForm.register("unit_price")} />
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
            <Input placeholder="Freight amount" {...costsForm.register("freight_amount")} />
            <Input placeholder="Insurance amount" {...costsForm.register("insurance_amount")} />
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
                    <TableCell>{item.quantity ?? "-"}</TableCell>
                    <TableCell>{item.unit_price ?? "-"}</TableCell>
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
