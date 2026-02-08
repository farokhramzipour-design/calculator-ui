import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { mockData, useMocks } from "@/lib/mock";

interface PassportItem {
  id: string;
  name: string;
  code: string;
  description: string;
  weight: number;
  supplier: string;
  notes: string;
}

export function PassportPage() {
  const listQuery = useQuery({
    queryKey: ["passport"],
    queryFn: () => api.get<PassportItem[]>("/passport/items"),
    enabled: !useMocks,
    initialData: useMocks ? mockData.passportItems : undefined
  });

  const form = useForm({
    defaultValues: { name: "", code: "", description: "", weight: "", supplier: "", notes: "" }
  });

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.post("/passport/items", payload),
    onSuccess: () => listQuery.refetch()
  });

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
            <Input placeholder="HS/TARIC code" {...form.register("code")} />
            <Input placeholder="Description" {...form.register("description")} />
            <Input placeholder="Weight per unit" {...form.register("weight")} />
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
                <TableHead>Code</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listQuery.data?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.code}</TableCell>
                  <TableCell>{item.weight}</TableCell>
                  <TableCell>{item.supplier}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">Use in calculator</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
