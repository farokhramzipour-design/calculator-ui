import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { calculatorSchema, CalculatorFormValues } from "./schema";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/toaster";
import { mockData, useMocks } from "@/lib/mock";
import { Link } from "react-router-dom";

interface TaricResolveResponse {
  goods_code: string;
  matched_goods_code: string | null;
  duties: Array<{ measure_uid: string; measure_type_code: string; expression: string; kind: string; rate: string | null; uom: string | null; requires_additional_code: boolean }>;
  requirements: Array<Record<string, unknown>>;
  legal_refs: string[];
  effective_duty_rate: string | null;
  notes: string[];
}

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

interface ShipmentDetail extends ShipmentRead {
  costs?: {
    freight_amount?: string | null;
    insurance_amount?: string | null;
    brokerage_amount?: string | null;
    port_fees_amount?: string | null;
    inland_transport_amount?: string | null;
    other_incidental_amount?: string | null;
    notes?: string | null;
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

export function CalculatorPage() {
  const { push } = useToast();
  const [step, setStep] = React.useState(1);
  const [showFreightDialog, setShowFreightDialog] = React.useState(false);
  const [insuranceMode, setInsuranceMode] = React.useState<"manual" | "estimate">("manual");
  const [resolveQuery, setResolveQuery] = React.useState({ goods_code: "", origin: "", date: "", additional_code: "" });
  const [selectedShipmentId, setSelectedShipmentId] = React.useState("");

  const form = useForm<CalculatorFormValues>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: {
      direction: "IMPORT_EU",
      destination_country: "DE",
      origin_country: "CN",
      import_date: new Date().toISOString().slice(0, 10),
      incoterm: "CIF",
      currency: "EUR",
      goods_value: 0,
      goods_code: "",
      vat_rate: 20
    }
  });

  const incoterm = form.watch("incoterm");
  const goodsValue = form.watch("goods_value");
  const destinationCountry = form.watch("destination_country");

  const shipmentsQuery = useQuery({
    queryKey: ["shipments"],
    queryFn: () => api.get<{ shipments: ShipmentRead[] }>("/shipments"),
    enabled: !useMocks,
    initialData: useMocks ? mockData.shipments : undefined
  });

  const shipmentDetailQuery = useQuery({
    queryKey: ["shipment", selectedShipmentId],
    queryFn: () => api.get<ShipmentDetail>(`/shipments/${selectedShipmentId}`),
    enabled: !!selectedShipmentId && !useMocks
  });

  const invoicesQuery = useQuery({
    queryKey: ["invoices"],
    queryFn: () => api.get<InvoiceRead[]>("/invoices"),
    enabled: !useMocks,
    initialData: useMocks ? mockData.invoices : undefined
  });

  const shipments = shipmentsQuery.data?.shipments ?? [];
  const shipmentDetail = useMocks
    ? shipments.find((s) => s.id === selectedShipmentId) ?? null
    : shipmentDetailQuery.data ?? null;
  const invoices = useMocks ? mockData.invoices : invoicesQuery.data ?? [];
  const shipmentInvoice = invoices.find((inv) => inv.shipment_id === selectedShipmentId) ?? null;

  React.useEffect(() => {
    if (!shipmentDetail) return;
    form.setValue("direction", shipmentDetail.direction);
    form.setValue("destination_country", shipmentDetail.destination_country ?? "");
    form.setValue("origin_country", shipmentDetail.origin_country_default);
    form.setValue("incoterm", shipmentDetail.incoterm);
    form.setValue("currency", shipmentDetail.currency);
    if (shipmentDetail.import_date) form.setValue("import_date", shipmentDetail.import_date);
    if (shipmentDetail.costs?.freight_amount) form.setValue("freight_cost", Number(shipmentDetail.costs.freight_amount));
    if (shipmentDetail.costs?.insurance_amount) form.setValue("insurance_amount", Number(shipmentDetail.costs.insurance_amount));
    if (shipmentDetail.costs?.brokerage_amount) form.setValue("brokerage_cost", Number(shipmentDetail.costs.brokerage_amount));
    if (shipmentDetail.costs?.port_fees_amount) form.setValue("handling_cost", Number(shipmentDetail.costs.port_fees_amount));
    if (shipmentDetail.costs?.other_incidental_amount) form.setValue("other_fees", Number(shipmentDetail.costs.other_incidental_amount));
  }, [shipmentDetail, form]);

  React.useEffect(() => {
    if (!shipmentInvoice) return;
    if (shipmentInvoice.currency) form.setValue("currency", shipmentInvoice.currency);
    if (shipmentInvoice.subtotal) form.setValue("goods_value", Number(shipmentInvoice.subtotal));
    if (shipmentInvoice.freight) form.setValue("freight_cost", Number(shipmentInvoice.freight));
    if (shipmentInvoice.insurance) form.setValue("insurance_amount", Number(shipmentInvoice.insurance));
    const itemWithHs = shipmentInvoice.items.find((item) => item.hs_code);
    if (itemWithHs?.hs_code) form.setValue("goods_code", itemWithHs.hs_code);
    if (itemWithHs?.origin_country) form.setValue("origin_country", itemWithHs.origin_country);
    if (itemWithHs?.quantity) form.setValue("quantity", Number(itemWithHs.quantity));
  }, [shipmentInvoice, form]);

  React.useEffect(() => {
    const raw = localStorage.getItem("passport_prefill");
    if (!raw) return;
    try {
      const data = JSON.parse(raw) as { hs_code?: string | null; weight_per_unit?: string | null };
      if (data.hs_code) form.setValue("goods_code", data.hs_code);
      if (data.weight_per_unit) form.setValue("net_mass", Number(data.weight_per_unit));
      push({ title: "Passport item loaded", description: "Fields prefilled from passport library", variant: "success" });
    } catch {
      // ignore parse errors
    } finally {
      localStorage.removeItem("passport_prefill");
    }
  }, [form, push]);

  React.useEffect(() => {
    if (incoterm === "EXW" || incoterm === "FOB") {
      setShowFreightDialog(true);
    }
  }, [incoterm]);

  React.useEffect(() => {
    const subscription = form.watch((values) => {
      if (values.goods_code && values.origin_country) {
        const timeout = setTimeout(() => {
          setResolveQuery({
            goods_code: values.goods_code,
            origin: values.origin_country,
            date: values.import_date ?? "",
            additional_code: values.additional_code ?? ""
          });
        }, 500);
        return () => clearTimeout(timeout);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const taricResolve = useQuery({
    queryKey: ["taric-resolve", resolveQuery],
    queryFn: () =>
      api.get<TaricResolveResponse>(
        `/taric/resolve?goods_code=${resolveQuery.goods_code}&origin=${resolveQuery.origin}&as_of=${resolveQuery.date}&additional_code=${resolveQuery.additional_code}`
      ),
    enabled: resolveQuery.goods_code.length >= 6 && !!resolveQuery.origin
  });

  const vatQuery = useQuery({
    queryKey: ["vat-rate", destinationCountry],
    queryFn: () => api.get<{ rate: string | null }>(`/rates/vat?country=${destinationCountry}`),
    enabled: !!destinationCountry
  });

  React.useEffect(() => {
    if (vatQuery.data?.rate) {
      form.setValue("vat_rate", Number(vatQuery.data.rate));
    }
  }, [vatQuery.data, form]);

  const calcMutation = useMutation({
    mutationFn: (payload: CalculatorFormValues) => api.post("/calculator/landed-cost", payload),
    onSuccess: () => push({ title: "Calculation ready", description: "Landed cost breakdown updated", variant: "success" }),
    onError: (error: Error) => push({ title: "Calculation failed", description: error.message, variant: "error" })
  });

  const estimateInsurance = () => {
    const estimate = Number(goodsValue || 0) * 0.005;
    form.setValue("insurance_amount", Number(estimate.toFixed(2)));
    setInsuranceMode("estimate");
  };

  const onSubmit = (values: CalculatorFormValues) => {
    calcMutation.mutate(values);
  };

  const exportJson = () => {
    const payload = calcMutation.data ?? {};
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "landed-cost.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const duties = taricResolve.data?.duties ?? [];
  const requiresAdditional = duties.some((d) => d.requires_additional_code);
  const requiresWeight = duties.some((d) => d.uom && d.uom.toLowerCase().includes("kg"));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Landed Cost Calculator</h1>
          <p className="text-sm text-slate-400">Step-by-step trade costing with TARIC duty resolution.</p>
        </div>
        <Badge variant="default">Step {step} of 5</Badge>
      </div>

      <Tabs defaultValue="calculator">
        <TabsList>
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="assumptions">Assumptions</TabsTrigger>
        </TabsList>
        <TabsContent value="calculator">
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle>Load from shipment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {shipments.length === 0 ? (
                  <Alert variant="warning">
                    No shipments available. Please create a shipment first.
                    <div className="mt-2">
                      <Link to="/shipments">
                        <Button variant="outline" size="sm">Create shipment</Button>
                      </Link>
                    </div>
                  </Alert>
                ) : (
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="md:col-span-2">
                      <label className="text-xs font-medium text-slate-600">Select shipment</label>
                      <Select value={selectedShipmentId} onChange={(e) => setSelectedShipmentId(e.target.value)}>
                        <option value="">Choose shipment</option>
                        {shipments.map((shipment) => (
                          <option key={shipment.id} value={shipment.id}>
                            {shipment.id} · {shipment.origin_country_default} → {shipment.destination_country ?? "-"} · {shipment.status}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="flex items-end">
                      {shipmentInvoice ? (
                        <Badge variant="success">Invoice linked</Badge>
                      ) : (
                        <Badge>Invoice not linked</Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Step 1: Shipment basics</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">Direction</label>
                  <Select {...form.register("direction")}>
                    <option value="IMPORT_UK">Import into UK</option>
                    <option value="IMPORT_EU">Import into EU</option>
                    <option value="EXPORT_UK">Export from UK</option>
                    <option value="EXPORT_EU">Export from EU</option>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Destination country</label>
                  <Input placeholder="DE" {...form.register("destination_country")} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Origin country</label>
                  <Input placeholder="CN" {...form.register("origin_country")} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Import date</label>
                  <Input type="date" {...form.register("import_date")} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Incoterm</label>
                  <Select {...form.register("incoterm")}>
                    <option value="EXW">EXW</option>
                    <option value="FOB">FOB</option>
                    <option value="FAS">FAS</option>
                    <option value="CFR">CFR</option>
                    <option value="CIF">CIF</option>
                    <option value="DDP">DDP</option>
                    <option value="FCA">FCA</option>
                    <option value="CPT">CPT</option>
                    <option value="CIP">CIP</option>
                    <option value="DAP">DAP</option>
                    <option value="DPU">DPU</option>
                  </Select>
                  {incotermHints[incoterm] && (
                    <Alert className="mt-2" variant="default">
                      <p className="font-medium">{incotermHints[incoterm].title}</p>
                      <p>{incotermHints[incoterm].detail}</p>
                    </Alert>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Currency</label>
                  <Input placeholder="EUR" {...form.register("currency")} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Exchange rate</label>
                  <Input placeholder="Manual override" {...form.register("exchange_rate")} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Step 2: Invoice & value</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">Goods value</label>
                  <Input type="number" step="0.01" {...form.register("goods_value")} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Quantity</label>
                  <Input type="number" step="0.01" {...form.register("quantity")} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Net mass (kg)</label>
                  <Input type="number" step="0.01" {...form.register("net_mass")} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Gross mass (kg)</label>
                  <Input type="number" step="0.01" {...form.register("gross_mass")} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Discount</label>
                  <Input type="number" step="0.01" {...form.register("discount")} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Other charges</label>
                  <Input type="number" step="0.01" {...form.register("other_charges")} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Step 3: Freight & Insurance</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">Freight cost</label>
                  <Input type="number" step="0.01" {...form.register("freight_cost")} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Insurance amount</label>
                  <Input type="number" step="0.01" {...form.register("insurance_amount")} />
                </div>
                <div className="flex items-end gap-2">
                  <Button type="button" variant={insuranceMode === "estimate" ? "secondary" : "outline"} onClick={estimateInsurance}>
                    Estimate insurance (0.5%)
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Step 4: TARIC / Duties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600">Goods code</label>
                    <Input placeholder="Use 10 digits for best accuracy" {...form.register("goods_code")} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">Additional code</label>
                    <Input placeholder="Optional" {...form.register("additional_code")} />
                  </div>
                  <div className="flex items-end">
                    {taricResolve.isLoading ? <Badge>Resolving...</Badge> : <Badge variant="success">Preview ready</Badge>}
                  </div>
                </div>
                {requiresAdditional && (
                  <Alert variant="warning">Some measures require an additional code.</Alert>
                )}
                {requiresWeight && (
                  <Alert variant="warning">Specific duty needs net mass or quantity.</Alert>
                )}
                {taricResolve.isError && (
                  <Alert variant="danger">Unable to resolve duties. Check goods code and origin.</Alert>
                )}

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Measure type</TableHead>
                      <TableHead>Expression</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>UOM</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {duties.map((duty) => (
                      <TableRow key={duty.measure_uid}>
                        <TableCell>{duty.measure_type_code}</TableCell>
                        <TableCell>{duty.expression}</TableCell>
                        <TableCell>{duty.rate ?? "-"}</TableCell>
                        <TableCell>{duty.uom ?? "-"}</TableCell>
                      </TableRow>
                    ))}
                    {duties.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4}>No TARIC duties yet.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Step 5: VAT + other costs</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">VAT rate</label>
                  <Input type="number" step="0.01" {...form.register("vat_rate")} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Logistics cost</label>
                  <Input type="number" step="0.01" {...form.register("logistics_cost")} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Handling cost</label>
                  <Input type="number" step="0.01" {...form.register("handling_cost")} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Brokerage cost</label>
                  <Input type="number" step="0.01" {...form.register("brokerage_cost")} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Other fees</label>
                  <Input type="number" step="0.01" {...form.register("other_fees")} />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1))}>Previous</Button>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={() => setStep((s) => Math.min(5, s + 1))}>Next</Button>
                <Button type="submit">Calculate landed cost</Button>
              </div>
            </div>
          </form>

          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm text-slate-500">Customs value base</p>
                  <p className="text-2xl font-semibold">{formatCurrency(goodsValue, form.watch("currency"))}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-slate-500">Effective duty rate</p>
                  <p className="text-2xl font-semibold">{taricResolve.data?.effective_duty_rate ?? "-"}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-slate-500">VAT amount</p>
                  <p className="text-2xl font-semibold">{formatCurrency(calcMutation.data?.vat_amount ?? 0, form.watch("currency"))}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-slate-500">Total landed cost</p>
                  <p className="text-2xl font-semibold">{formatCurrency(calcMutation.data?.total ?? goodsValue, form.watch("currency"))}</p>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-semibold text-slate-700">Duty breakdown</h4>
                <ul className="mt-2 text-sm text-slate-600">
                  {duties.map((duty) => (
                    <li key={duty.measure_uid}>
                      {duty.measure_type_code} - {duty.expression} ({duty.rate ?? "-"})
                    </li>
                  ))}
                  {duties.length === 0 && <li>No duty breakdown available.</li>}
                </ul>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-semibold text-slate-700">Assumptions</h4>
                <ul className="mt-2 text-sm text-slate-600">
                  <li>Incoterm: {incoterm}</li>
                  <li>Insurance: {insuranceMode === "estimate" ? "Estimated" : "Manual"}</li>
                  <li>Missing weights: {form.watch("net_mass") ? "No" : "Yes"}</li>
                </ul>
              </div>

              <div className="mt-6 flex gap-3">
                <Button type="button" variant="outline" onClick={exportJson}>
                  Export JSON
                </Button>
                <Button type="button" variant="secondary" onClick={() => window.print()}>
                  Print view
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="assumptions">
          <Card>
            <CardHeader>
              <CardTitle>Assumptions & warnings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Alert>Incoterm {incoterm} applied to customs base.</Alert>
              {taricResolve.data?.notes?.map((note, idx) => (
                <Alert key={idx} variant="warning">{note}</Alert>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showFreightDialog} onOpenChange={setShowFreightDialog}>
        <DialogTrigger className="hidden">Trigger</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <CardTitle>Shipping costs not included</CardTitle>
          </DialogHeader>
          <div className="p-5">
            <p className="text-sm text-slate-600">
              Your incoterm requires freight & insurance to calculate duty. Please enter estimated values.
            </p>
          </div>
          <DialogFooter className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setShowFreightDialog(false)}>
              I will enter manually
            </Button>
            <Button onClick={() => { estimateInsurance(); setShowFreightDialog(false); }}>
              Estimate insurance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
  const incotermHints: Record<string, { title: string; detail: string }> = {
    EXW: { title: "EXW — Ex Works", detail: "Seller makes goods available at origin. Buyer handles export, freight, insurance. Add freight + insurance to customs value." },
    FCA: { title: "FCA — Free Carrier", detail: "Seller delivers to carrier and clears export. Buyer pays main transport and insurance." },
    CPT: { title: "CPT — Carriage Paid To", detail: "Seller pays freight, risk transfers at carrier. Insurance usually not included." },
    CIP: { title: "CIP — Carriage & Insurance Paid To", detail: "Seller pays freight + insurance to destination. Risk transfers at carrier." },
    DAP: { title: "DAP — Delivered At Place", detail: "Seller delivers ready for unloading. Buyer pays import duty/VAT/clearance." },
    DPU: { title: "DPU — Delivered At Place Unloaded", detail: "Seller delivers and unloads at destination. Buyer handles import clearance/duties." },
    DDP: { title: "DDP — Delivered Duty Paid", detail: "Seller pays freight, insurance, duty, VAT. Avoid double-counting duties." },
    FAS: { title: "FAS — Free Alongside Ship", detail: "Sea/inland only. Seller places goods alongside vessel. Buyer loads and pays main transport/insurance." },
    FOB: { title: "FOB — Free On Board", detail: "Sea/inland only. Risk transfers onboard. Often misused for containers; confirm." },
    CFR: { title: "CFR — Cost & Freight", detail: "Sea/inland only. Seller pays freight, risk transfers at port of origin. Insurance not included." },
    CIF: { title: "CIF — Cost, Insurance, Freight", detail: "Sea/inland only. Seller pays freight + insurance; risk transfers at port of origin." }
  };
