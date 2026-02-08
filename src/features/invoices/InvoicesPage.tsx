import * as React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api, apiUpload } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert } from "@/components/ui/alert";
import { useToast } from "@/components/ui/toaster";
import { mockData, useMocks } from "@/lib/mock";

interface InvoiceDetail {
  id: string;
  supplier: string;
  buyer: string;
  incoterm: string;
  items: Array<{ id: string; description: string; hs_code?: string; quantity: number; price: number }>;
}

export function InvoicesPage() {
  const { push } = useToast();
  const [selected, setSelected] = React.useState<InvoiceDetail | null>(null);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return apiUpload<{ id: string }>("/invoices/upload", form);
    },
    onSuccess: (data) => push({ title: "Uploaded", description: `Invoice ${data.id} ready for review`, variant: "success" }),
    onError: (error: Error) => push({ title: "Upload failed", description: error.message, variant: "error" })
  });

  const invoiceQuery = useQuery({
    queryKey: ["invoice", selected?.id],
    queryFn: () => api.get<InvoiceDetail>(`/invoices/${selected?.id}`),
    enabled: !!selected?.id && !useMocks
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => api.post(`/invoices/${id}/confirm`, {}),
    onSuccess: () => push({ title: "Confirmed", description: "Invoice lines sent to calculator", variant: "success" })
  });

  const demoInvoice: InvoiceDetail = {
    id: "inv_demo",
    supplier: "Baltic Metals",
    buyer: "North Bridge",
    incoterm: "CIF",
    items: [{ id: "1", description: "Steel coils", hs_code: "72081000", quantity: 20, price: 12000 }]
  };

  const invoice = useMocks ? demoInvoice : invoiceQuery.data ?? selected;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Invoices</h1>
        <p className="text-sm text-slate-400">Upload trade documents and confirm extracted line items.</p>
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
          <Button variant="outline" onClick={() => setSelected(demoInvoice)}>Use demo invoice</Button>
        </CardContent>
      </Card>

      {invoice && (
        <Card>
          <CardHeader>
            <CardTitle>Extracted details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-xs text-slate-500">Supplier</p>
                <p className="text-sm font-medium">{invoice.supplier}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Buyer</p>
                <p className="text-sm font-medium">{invoice.buyer}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Incoterm</p>
                <p className="text-sm font-medium">{invoice.incoterm}</p>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>HS code</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.hs_code ?? "Missing"}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.price}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {!invoice.items.some((item) => item.hs_code) && (
              <Alert variant="warning">No HS code found. Please enter HS code or select from Passport Library.</Alert>
            )}

            <div className="flex gap-2">
              <Button onClick={() => confirmMutation.mutate(invoice.id)}>Confirm</Button>
              <Button variant="outline">Send to calculator</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
