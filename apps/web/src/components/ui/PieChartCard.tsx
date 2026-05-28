"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

import {
  Box,
  Paper,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

import type { AdminPieChartSlice } from "@/types/admin";

type PieChartCardProps = {
  title: string;
  description?: string;
  data: AdminPieChartSlice[];
  height?: number;
  emptyLabel?: string;
};

export function PieChartCard({
  title,
  description,
  data,
  height = 260,
  emptyLabel = "Sem dados para exibir",
}: PieChartCardProps) {
  const theme = useTheme();
  const hasData = data.some((item) => item.value > 0);
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Paper sx={{ p: 3, borderRadius: 4, minWidth: 0 }}>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            {title}
          </Typography>
          {description ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {description}
            </Typography>
          ) : null}
        </Box>

        <Box sx={{ height }}>
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={66}
                  outerRadius={92}
                  paddingAngle={3}
                  stroke="transparent"
                >
                  {data.map((slice) => (
                    <Cell key={slice.label} fill={slice.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [value, name]}
                  contentStyle={{
                    borderRadius: 12,
                    border: `1px solid ${theme.palette.divider}`,
                    boxShadow: theme.shadows[4],
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <Box
              sx={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 3,
                border: "1px dashed rgba(0,0,0,0.12)",
                bgcolor: "rgba(0,0,0,0.02)",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {emptyLabel}
              </Typography>
            </Box>
          )}
        </Box>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1.5,
            alignItems: "center",
          }}
        >
          {data.map((slice) => (
            <Box
              key={slice.label}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
                px: 1.5,
                py: 0.75,
                borderRadius: 999,
                bgcolor: "rgba(0,0,0,0.03)",
              }}
            >
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  bgcolor: slice.color,
                  flexShrink: 0,
                }}
              />
              <Typography variant="body2" component="span">
                {slice.label}
              </Typography>
              <Typography variant="body2" component="span" fontWeight={700}>
                {slice.value}
              </Typography>
            </Box>
          ))}
          <Box sx={{ ml: "auto" }}>
            <Typography variant="body2" color="text.secondary">
              Total: {total}
            </Typography>
          </Box>
        </Box>
      </Stack>
    </Paper>
  );
}
