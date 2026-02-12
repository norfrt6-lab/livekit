"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

interface DonutChartProps {
  data: Array<{ name: string; value: number; color?: string }>;
  height?: number;
  className?: string;
  innerRadius?: number;
  outerRadius?: number;
  showLabels?: boolean;
}

const defaultColors = [
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(217.2 32.6% 25%)",
  "hsl(217.2 32.6% 35%)",
  "hsl(217.2 32.6% 45%)",
];

export function DonutChart({
  data,
  height = 200,
  className,
  innerRadius = 60,
  outerRadius = 80,
  showLabels = false,
}: DonutChartProps) {
  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey="value"
            label={
              showLabels
                ? ({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                : undefined
            }
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || defaultColors[index % defaultColors.length]}
                className="stroke-background"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value: number) => [
              value.toLocaleString(),
              "Viewers",
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
