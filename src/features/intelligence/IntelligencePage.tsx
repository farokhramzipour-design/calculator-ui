import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { mockData, useMocks } from "@/lib/mock";

interface Insight {
  id: string;
  title: string;
  summary: string;
  date: string;
}

export function IntelligencePage() {
  const listQuery = useQuery({
    queryKey: ["insights"],
    queryFn: () => api.get<Insight[]>("/intelligence/market-insights"),
    enabled: !useMocks,
    initialData: useMocks ? mockData.marketInsights : undefined
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Market insights</h1>
          <p className="text-sm text-slate-400">Trade intelligence feed with region and sector filters.</p>
        </div>
        <div className="flex gap-2">
          <Select>
            <option>Region: EU</option>
            <option>Region: UK</option>
          </Select>
          <Select>
            <option>Sector: Metals</option>
            <option>Sector: Energy</option>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {listQuery.data?.map((insight) => (
          <Card key={insight.id}>
            <CardHeader>
              <CardTitle>{insight.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">{insight.summary}</p>
              <p className="mt-3 text-xs text-slate-400">{insight.date}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
