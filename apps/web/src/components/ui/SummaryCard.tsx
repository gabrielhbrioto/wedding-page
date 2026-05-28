import { Paper, Typography } from "@mui/material";
import type { PaperProps, TypographyProps } from "@mui/material";
import type { ReactNode } from "react";

export type SummaryCardProps = Omit<PaperProps, "children"> & {
  label: ReactNode;
  value: ReactNode;
  labelVariant?: TypographyProps["variant"];
  valueVariant?: TypographyProps["variant"];
};

export function SummaryCard({
  label,
  value,
  labelVariant = "body2",
  valueVariant = "h5",
  sx,
  ...paperProps
}: SummaryCardProps) {
  const baseSx = { p: 2, minWidth: 120 };
  const extraSx = Array.isArray(sx) ? sx : sx ? [sx] : [];

  return (
    <Paper {...paperProps} sx={[baseSx, ...extraSx]}>
      <Typography variant={labelVariant}>{label}</Typography>
      <Typography variant={valueVariant}>{value}</Typography>
    </Paper>
  );
}