import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { BarChart3 } from "lucide-react";

type TopServicesChartProps = {
  data: Array<{
    name: string;
    leads: number;
    revenue: number;
  }>;
};

export default function TopServicesChart({ data }: TopServicesChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No calculator data yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} className="fill-gray-600 dark:fill-gray-400" />
          <YAxis tick={{ fontSize: 12 }} className="fill-gray-600 dark:fill-gray-400" />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--tooltip-bg, white)",
              border: "1px solid var(--tooltip-border, #e5e7eb)",
              borderRadius: "8px",
              fontSize: "12px"
            }}
          />
          <Bar dataKey="leads" fill="#2563eb" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
