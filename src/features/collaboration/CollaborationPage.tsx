import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockData, useMocks } from "@/lib/mock";

interface LicenseItem {
  id: string;
  name: string;
  expiry: string;
  status: string;
}

export function CollaborationPage() {
  const listQuery = useQuery({
    queryKey: ["collaboration"],
    queryFn: () => api.get<LicenseItem[]>("/collaboration/licenses"),
    enabled: !useMocks,
    initialData: useMocks ? mockData.collaborationLicenses : undefined
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">License Manager</h1>
        <p className="text-sm text-slate-400">Manage collaboration licenses and attach to shipments.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload license</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Input type="file" />
          <Button variant="secondary">Attach to shipment</Button>
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
                <TableHead>Name</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listQuery.data?.map((license) => (
                <TableRow key={license.id}>
                  <TableCell>{license.name}</TableCell>
                  <TableCell>{license.expiry}</TableCell>
                  <TableCell>{license.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
