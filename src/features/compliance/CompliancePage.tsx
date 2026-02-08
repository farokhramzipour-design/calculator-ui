import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { mockData, useMocks } from "@/lib/mock";

interface ComplianceTask {
  id: string;
  title: string;
  due: string;
  severity: string;
  status: string;
}

export function CompliancePage() {
  const listQuery = useQuery({
    queryKey: ["compliance"],
    queryFn: () => api.get<ComplianceTask[]>("/compliance/tasks"),
    enabled: !useMocks,
    initialData: useMocks ? mockData.complianceTasks : undefined
  });

  const form = useForm({
    defaultValues: { title: "", due: "", severity: "Medium" }
  });

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.post("/compliance/tasks", payload),
    onSuccess: () => listQuery.refetch()
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Compliance tasks</h1>
        <p className="text-sm text-slate-400">Track duty requirements, certificates, and audit tasks.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create task</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-3" onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}>
            <Input placeholder="Task title" {...form.register("title")} />
            <Input type="date" {...form.register("due")} />
            <Select {...form.register("severity")}>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </Select>
            <Button type="submit" className="md:col-span-3">Add task</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Open tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listQuery.data?.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>{task.title}</TableCell>
                  <TableCell>{task.due}</TableCell>
                  <TableCell>{task.severity}</TableCell>
                  <TableCell><Badge>{task.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
