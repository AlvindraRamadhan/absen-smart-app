"use client";

import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ChartData {
  name: string;
  hadir: number;
  terlambat: number;
}

export const AttendanceChart = ({ data }: { data: ChartData[] }) => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Aktivitas Mingguan</h3>
      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <BarChart
            data={data}
            margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
          >
            <XAxis dataKey="name" stroke="#888888" fontSize={12} />
            <YAxis stroke="#888888" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #ccc",
                borderRadius: "0.5rem",
              }}
            />
            <Legend iconType="circle" />
            <Bar
              dataKey="hadir"
              fill="#22c55e"
              name="Tepat Waktu"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="terlambat"
              fill="#f59e0b"
              name="Terlambat"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
