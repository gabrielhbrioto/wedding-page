"use client";

import type { ReactNode } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import {
  Box,
  Button,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";

const drawerWidth = 292;

const navItems = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    helper: "Números, gráficos e presença",
    icon: DashboardOutlinedIcon,
  },
  {
    href: "/admin/convidados",
    label: "Cadastro de Convidados",
    helper: "Grupos, membros e convite",
    icon: GroupsOutlinedIcon,
  },
  {
    href: "/admin/evento",
    label: "Dados do Evento",
    helper: "Casamento, prazo e página pública",
    icon: EventOutlinedIcon,
  },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        bgcolor: "#f6f0e8",
      }}
    >
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            borderRight: "1px solid rgba(184, 155, 103, 0.22)",
            background:
              "linear-gradient(180deg, rgba(17,17,17,1) 0%, rgba(33,25,18,1) 100%)",
            color: "#fff",
          },
        }}
      >
        <Box sx={{ px: 3, pt: 3, pb: 2 }}>
          <Typography
            variant="overline"
            sx={{ letterSpacing: "0.28em", color: "#d8c29b" }}
          >
            Área admin
          </Typography>
          <Typography
            variant="h5"
            sx={{ mt: 1, fontFamily: "Georgia, serif", lineHeight: 1.1 }}
          >
            Gabriel & Débora
          </Typography>
          <Typography sx={{ mt: 1, color: "rgba(255,255,255,0.72)" }}>
            Gerenciamento de convidados, presença e convite.
          </Typography>
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

        <List sx={{ px: 1.5, py: 2 }}>
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));

            return (
              <ListItemButton
                key={item.href}
                component={Link}
                href={item.href}
                selected={active}
                sx={{
                  mb: 1,
                  borderRadius: 2,
                  alignItems: "flex-start",
                  px: 1.5,
                  py: 1.5,
                  color: active ? "#111" : "rgba(255,255,255,0.88)",
                  bgcolor: active
                    ? "#f4e7cf"
                    : "rgba(255,255,255,0.03)",
                  border: active
                    ? "1px solid rgba(184,155,103,0.35)"
                    : "1px solid transparent",
                  transition: "transform 140ms ease, background-color 140ms ease",
                  "&:hover": {
                    bgcolor: active
                      ? "#f4e7cf"
                      : "rgba(255,255,255,0.08)",
                    transform: "translateX(2px)",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: active ? "#111" : "#d8c29b",
                    mt: 0.25,
                  }}
                >
                  <item.icon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography component="span" sx={{ fontWeight: 700 }}>
                      {item.label}
                    </Typography>
                  }
                  secondary={
                    <Typography
                      component="span"
                      variant="body2"
                      sx={{
                        color: active
                          ? "rgba(17,17,17,0.72)"
                          : "rgba(255,255,255,0.68)",
                      }}
                    >
                      {item.helper}
                    </Typography>
                  }
                />
              </ListItemButton>
            );
          })}
        </List>

        <Box sx={{ mt: "auto", px: 3, pb: 3 }}>
          <Stack spacing={1.25}>
            <Typography
              variant="caption"
              sx={{ letterSpacing: "0.22em", color: "rgba(255,255,255,0.5)" }}
            >
              Painel interno
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.7)" }}>
              Layout compartilhado para dashboard e convidados.
            </Typography>
          </Stack>
        </Box>
      </Drawer>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box
          sx={{
            display: { xs: "flex", md: "none" },
            gap: 1,
            px: 2,
            py: 1.5,
            position: "sticky",
            top: 0,
            zIndex: 20,
            backdropFilter: "blur(14px)",
            bgcolor: "rgba(246,240,232,0.88)",
            borderBottom: "1px solid rgba(0,0,0,0.08)",
          }}
        >
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));

            return (
              <Button
                key={item.href}
                component={Link}
                href={item.href}
                variant={active ? "contained" : "outlined"}
                size="small"
                sx={{
                  borderRadius: 999,
                  textTransform: "none",
                  fontWeight: 700,
                  bgcolor: active ? "#111" : "transparent",
                  borderColor: "rgba(17,17,17,0.18)",
                  color: active ? "#fff" : "#111",
                  "&:hover": {
                    bgcolor: active ? "#111" : "rgba(17,17,17,0.04)",
                    borderColor: "rgba(17,17,17,0.28)",
                  },
                }}
              >
                {item.label}
              </Button>
            );
          })}
        </Box>

        <Box component="main" sx={{ p: { xs: 2, md: 4 }, minWidth: 0 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
