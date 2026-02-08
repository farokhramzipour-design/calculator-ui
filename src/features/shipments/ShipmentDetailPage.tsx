import { useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";

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

export function ShipmentDetailPage() {
  const { id } = useParams();
  const detailQuery = useQuery({
    queryKey: ["shipment", id],
    queryFn: () => api.get<ShipmentDetail>(`/shipments/${id}`),
    enabled: !!id
  });

  const itemForm = useForm({
    defaultValues: { description: "", hs_code: "", quantity: 0, unit_price: 0, origin_country: "" }
  });

  const addItem = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.post(`/shipments/${id}/items`, payload),
    onSuccess: () => detailQuery.refetch()
  });

  const costsForm = useForm({
    defaultValues: { freight_amount: "", insurance_amount: "" }
  });

  const upsertCosts = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.put(`/shipments/${id}/costs`, payload),
    onSuccess: () => detailQuery.refetch()
  });

  const shipment = detailQuery.data;

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
