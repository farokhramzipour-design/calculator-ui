import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { apiUpload } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";

interface ImportLog {
  id: string;
  date: string;
  status: string;
}

export function AdminTaricImportPage() {
  const [logs, setLogs] = React.useState<ImportLog[]>([]);
  const [files, setFiles] = React.useState<Record<string, File | null>>({
    goods_file: null,
    measures_file: null,
    add_codes_file: null,
    certificates_file: null,
    footnotes_file: null
  });

  const [snapshot, setSnapshot] = React.useState(new Date().toISOString().slice(0, 10));
  const [force, setForce] = React.useState(false);

  const importMutation = useMutation({
    mutationFn: async () => {
      const form = new FormData();
      if (files.goods_file) form.append("goods_file", files.goods_file);
      if (files.measures_file) form.append("measures_file", files.measures_file);
      if (files.add_codes_file) form.append("add_codes_file", files.add_codes_file);
      if (files.certificates_file) form.append("certificates_file", files.certificates_file);
      if (files.footnotes_file) form.append("footnotes_file", files.footnotes_file);
      form.append("snapshot_date", snapshot);
      form.append("force", String(force));
      return apiUpload("/admin/taric/import", form);
    },
    onSuccess: () => {
      setLogs((prev) => [
        { id: crypto.randomUUID(), date: snapshot, status: "Imported" },
        ...prev
      ]);
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">TARIC Import</h1>
        <p className="text-sm text-slate-400">Upload TARIC data packages and validate duty resolution.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload packages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input type="file" onChange={(e) => setFiles((prev) => ({ ...prev, goods_file: e.target.files?.[0] ?? null }))} />
            <Input type="file" onChange={(e) => setFiles((prev) => ({ ...prev, measures_file: e.target.files?.[0] ?? null }))} />
            <Input type="file" onChange={(e) => setFiles((prev) => ({ ...prev, add_codes_file: e.target.files?.[0] ?? null }))} />
            <Input type="file" onChange={(e) => setFiles((prev) => ({ ...prev, certificates_file: e.target.files?.[0] ?? null }))} />
            <Input type="file" onChange={(e) => setFiles((prev) => ({ ...prev, footnotes_file: e.target.files?.[0] ?? null }))} />
          </div>
          <div className="flex items-center gap-4">
            <div>
              <label className="text-xs font-medium text-slate-600">Snapshot date</label>
              <Input type="date" value={snapshot} onChange={(e) => setSnapshot(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} />
              Force re-import
            </label>
          </div>
          <Button onClick={() => importMutation.mutate()} disabled={importMutation.isPending}>
            {importMutation.isPending ? "Importing..." : "Submit"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import report</CardTitle>
        </CardHeader>
        <CardContent>
          {importMutation.isSuccess && <Alert variant="default">Import completed. Verify resolver output below.</Alert>}
          <div className="mt-4 space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                <div>
                  <p className="text-sm font-medium">Snapshot {log.date}</p>
                  <p className="text-xs text-slate-500">Manual import</p>
                </div>
                <Badge variant="success">{log.status}</Badge>
              </div>
            ))}
            {logs.length === 0 && <p className="text-sm text-slate-500">No imports yet.</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test resolver</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Input placeholder="Goods code" />
          <Input placeholder="Origin" />
          <Input placeholder="Additional code" />
          <Button className="md:col-span-3">Run resolve</Button>
        </CardContent>
      </Card>
    </div>
  );
}
