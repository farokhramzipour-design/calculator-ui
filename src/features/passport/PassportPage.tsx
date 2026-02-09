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

export function PassportPage() {
  const { push } = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const navigate = useNavigate();
  const listQuery = useQuery({
    queryKey: ["passport"],
    queryFn: () => api.get<PassportItem[]>("/passport"),
    enabled: !useMocks,
    initialData: useMocks ? mockData.passportItems : undefined
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

  const selected = listQuery.data?.find((item) => item.id === selectedId) ?? null;

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
    </div>
  );
}
