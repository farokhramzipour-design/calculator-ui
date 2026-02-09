import { useMutation, useQuery } from "@tanstack/react-query";
import { api, apiUpload } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { mockData, useMocks } from "@/lib/mock";
import { useToast } from "@/components/ui/toaster";
import React, { useState } from "react";
import { useForm } from "react-hook-form";

interface LicenseItem {
  id: string;
  user_id: string;
  license_type: string;
  license_number: string | null;
  issuer: string | null;
  expires_on: string | null;
  file_type: string;
  notes: string | null;
}

interface ShipmentList {
  shipments: Array<{ id: string; origin_country_default: string; destination_country: string | null; status: string }>;
}

export function CollaborationPage() {
  const { push } = useToast();
  const [shipmentId, setShipmentId] = useState("");
  const [selectedLicenseId, setSelectedLicenseId] = useState("");
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<LicenseItem>>({});
  const [bulkShipmentId, setBulkShipmentId] = useState("");
  const [selectedBulkIds, setSelectedBulkIds] = useState<string[]>([]);

  const uploadForm = useForm({
    defaultValues: {
      license_type: "",
      license_number: "",
      issuer: "",
      expires_on: "",
      notes: ""
    }
  });

  const listQuery = useQuery({
    queryKey: ["licenses"],
    queryFn: () => api.get<LicenseItem[]>("/licenses"),
    enabled: !useMocks,
    initialData: useMocks ? mockData.licenses : undefined
  });

  const shipmentsQuery = useQuery({
    queryKey: ["shipments"],
    queryFn: () => api.get<ShipmentList>("/shipments"),
    enabled: !useMocks,
    initialData: useMocks ? mockData.shipments : undefined
  });

  const uploadMutation = useMutation({
    mutationFn: (payload: { file: File; license_type: string; license_number?: string; issuer?: string; expires_on?: string; notes?: string }) => {
      const form = new FormData();
      form.append("file", payload.file);
      form.append("license_type", payload.license_type);
      if (payload.license_number) form.append("license_number", payload.license_number);
      if (payload.issuer) form.append("issuer", payload.issuer);
      if (payload.expires_on) form.append("expires_on", payload.expires_on);
      if (payload.notes) form.append("notes", payload.notes);
      return apiUpload<LicenseItem>("/licenses/upload", form);
    },
    onSuccess: () => {
      push({ title: "Uploaded", description: "License stored", variant: "success" });
      listQuery.refetch();
      uploadForm.reset();
      setLicenseFile(null);
    }
  });

  const assignMutation = useMutation({
    mutationFn: (payload: { license_id: string; shipment_id: string }) =>
      api.post<LicenseItem>(`/licenses/assign?shipment_id=${payload.shipment_id}`, { license_id: payload.license_id }),
    onSuccess: () => {
      push({ title: "Assigned", description: "License linked to shipment", variant: "success" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; data: Partial<LicenseItem> }) =>
      api.patch<LicenseItem>(`/licenses/${payload.id}`, payload.data),
    onSuccess: () => {
      push({ title: "Updated", description: "License updated", variant: "success" });
      setEditingId(null);
      setEditValues({});
      listQuery.refetch();
    },
    onError: (error: Error) => {
      push({ title: "Update failed", description: error.message, variant: "error" });
    }
  });

  const bulkAssignMutation = useMutation({
    mutationFn: (payload: { shipment_id: string; license_ids: string[] }) =>
      api.post<LicenseItem[]>(`/licenses/assign/bulk?shipment_id=${payload.shipment_id}`, { license_ids: payload.license_ids }),
    onSuccess: () => {
      push({ title: "Assigned", description: "Licenses linked to shipment", variant: "success" });
      setSelectedBulkIds([]);
    },
    onError: (error: Error) => {
      push({ title: "Assign failed", description: error.message, variant: "error" });
    }
  });

  const bulkUnassignMutation = useMutation({
    mutationFn: async (payload: { shipment_id: string; license_ids: string[] }) => {
      await Promise.all(
        payload.license_ids.map((licenseId) =>
          api.delete(`/licenses/assign?shipment_id=${payload.shipment_id}&license_id=${licenseId}`)
        )
      );
    },
    onSuccess: () => {
      push({ title: "Unassigned", description: "Licenses removed from shipment", variant: "success" });
      setSelectedBulkIds([]);
    },
    onError: (error: Error) => {
      push({ title: "Unassign failed", description: error.message, variant: "error" });
    }
  });

  const startEdit = (license: LicenseItem) => {
    setEditingId(license.id);
    setEditValues({ ...license });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">License Manager</h1>
        <p className="text-sm text-slate-400">Upload licenses and attach to shipments.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload license</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 md:grid-cols-3"
            onSubmit={uploadForm.handleSubmit((values) => {
              if (!licenseFile) {
                push({ title: "Missing file", description: "Attach a license file", variant: "error" });
                return;
              }
              if (!values.license_type) {
                push({ title: "Missing license type", description: "Enter license type", variant: "error" });
                return;
              }
              uploadMutation.mutate({
                file: licenseFile,
                license_type: values.license_type,
                license_number: values.license_number || undefined,
                issuer: values.issuer || undefined,
                expires_on: values.expires_on || undefined,
                notes: values.notes || undefined
              });
            })}
          >
            <Input placeholder="License type" {...uploadForm.register("license_type")} />
            <Input placeholder="License number (optional)" {...uploadForm.register("license_number")} />
            <Input placeholder="Issuer (optional)" {...uploadForm.register("issuer")} />
            <Input type="date" placeholder="Expiry" {...uploadForm.register("expires_on")} />
            <Input placeholder="Notes (optional)" {...uploadForm.register("notes")} />
            <Input type="file" onChange={(e) => setLicenseFile(e.target.files?.[0] ?? null)} />
            <Button type="submit" className="md:col-span-3">Upload license</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assign license to shipment</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Select value={selectedLicenseId} onChange={(e) => setSelectedLicenseId(e.target.value)}>
            <option value="">Select license</option>
            {listQuery.data?.map((license) => (
              <option key={license.id} value={license.id}>
                {license.license_type} {license.license_number ? `· ${license.license_number}` : ""}
              </option>
            ))}
          </Select>
          <Select value={shipmentId} onChange={(e) => setShipmentId(e.target.value)}>
            <option value="">Select shipment</option>
            {shipmentsQuery.data?.shipments?.map((shipment) => (
              <option key={shipment.id} value={shipment.id}>
                {shipment.id} · {shipment.origin_country_default} → {shipment.destination_country ?? "-"} · {shipment.status}
              </option>
            ))}
          </Select>
          <Button
            variant="secondary"
            onClick={() => {
              if (!selectedLicenseId || !shipmentId) {
                push({ title: "Missing fields", description: "Select license and shipment", variant: "error" });
                return;
              }
              assignMutation.mutate({ license_id: selectedLicenseId, shipment_id: shipmentId });
            }}
          >
            Assign
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bulk license attach / detach</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={bulkShipmentId} onChange={(e) => setBulkShipmentId(e.target.value)}>
            <option value="">Select shipment</option>
            {shipmentsQuery.data?.shipments?.map((shipment) => (
              <option key={shipment.id} value={shipment.id}>
                {shipment.id} · {shipment.origin_country_default} → {shipment.destination_country ?? "-"} · {shipment.status}
              </option>
            ))}
          </Select>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                if (!bulkShipmentId || selectedBulkIds.length === 0) {
                  push({ title: "Missing fields", description: "Select shipment and licenses", variant: "error" });
                  return;
                }
                bulkAssignMutation.mutate({ shipment_id: bulkShipmentId, license_ids: selectedBulkIds });
              }}
            >
              Bulk assign
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (!bulkShipmentId || selectedBulkIds.length === 0) {
                  push({ title: "Missing fields", description: "Select shipment and licenses", variant: "error" });
                  return;
                }
                bulkUnassignMutation.mutate({ shipment_id: bulkShipmentId, license_ids: selectedBulkIds });
              }}
            >
              Bulk unassign
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Licenses</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <span className="text-xs">Select</span>
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Number</TableHead>
                <TableHead>Issuer</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listQuery.data?.map((license) => (
                <TableRow key={license.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedBulkIds.includes(license.id)}
                      onChange={(e) => {
                        setSelectedBulkIds((prev) =>
                          e.target.checked ? [...prev, license.id] : prev.filter((id) => id !== license.id)
                        );
                      }}
                    />
                  </TableCell>
                  {editingId === license.id ? (
                    <>
                      <TableCell>
                        <Input
                          value={editValues.license_type ?? ""}
                          onChange={(e) => setEditValues((prev) => ({ ...prev, license_type: e.target.value }))}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={editValues.license_number ?? ""}
                          onChange={(e) => setEditValues((prev) => ({ ...prev, license_number: e.target.value }))}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={editValues.issuer ?? ""}
                          onChange={(e) => setEditValues((prev) => ({ ...prev, issuer: e.target.value }))}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          value={editValues.expires_on ?? ""}
                          onChange={(e) => setEditValues((prev) => ({ ...prev, expires_on: e.target.value }))}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={editValues.notes ?? ""}
                          onChange={(e) => setEditValues((prev) => ({ ...prev, notes: e.target.value }))}
                        />
                      </TableCell>
                      <TableCell className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateMutation.mutate({ id: license.id, data: editValues })}
                        >
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>{license.license_type}</TableCell>
                      <TableCell>{license.license_number ?? "-"}</TableCell>
                      <TableCell>{license.issuer ?? "-"}</TableCell>
                      <TableCell>{license.expires_on ?? "-"}</TableCell>
                      <TableCell>{license.notes ?? "-"}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => startEdit(license)}>
                          Edit
                        </Button>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
