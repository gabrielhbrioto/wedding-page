"use client";

import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import { GroupsTable } from "@/components/ui/GroupsTable";
import { PieChartCard } from "@/components/ui/PieChartCard";
import { SummaryCard } from "@/components/ui/SummaryCard";
import { apiFetch } from "@/lib/api";
import type {
  AdminDashboardSummary,
  AdminGroupDetails,
  AdminGroupSummary,
  AdminPieChartSlice,
  AdminPresenceStats,
  AdminRsvpListItem,
} from "@/types/admin";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function Dashboard() {
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [stats, setStats] = useState<AdminPresenceStats | null>(null);
  const [groups, setGroups] = useState<AdminGroupSummary[]>([]);
  const [rsvps, setRsvps] = useState<AdminRsvpListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const presenceChartData: AdminPieChartSlice[] = stats
    ? [
        { label: "Confirmados", value: stats.dinner_confirmed, color: "#8D6E63" },
        { label: "Só cerimônia", value: stats.ceremony_only, color: "#B08968" },
        { label: "Ausentes", value: stats.absent, color: "#D1495B" },
      ]
    : [];

  const ceremonyDinnerGroups = groups.filter(
    (group) => group.tipo_convite === "CERIMONIA_JANTAR"
  );
  const ceremonyOnlyGroups = groups.filter((group) => group.tipo_convite === "CERIMONIA");
  const recentRsvps = rsvps.slice(0, 5);

  async function load(showLoading = false) {
    if (showLoading) {
      setLoading(true);
    }

    setError(null);

    try {
      const [dashboard, presence, rsvpList, groupList] = await Promise.all([
        apiFetch("/admin/dashboard"),
        apiFetch("/admin/stats/presence"),
        apiFetch("/admin/rsvps"),
        apiFetch("/admin/groups"),
      ]);

      setSummary(dashboard);
      setStats(presence);
      setRsvps(rsvpList);
      setGroups(groupList);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Não foi possível carregar o dashboard."
      );
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }

  async function loadGroupDetails(groupId: string) {
    return (await apiFetch(`/admin/groups/${groupId}`)) as AdminGroupDetails;
  }

  useEffect(() => {
    void load(true);
  }, []);

  if (loading && !summary) {
    return (
      <Box
        sx={{
          minHeight: 320,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error && !summary) {
    return (
      <Stack spacing={2}>
        <Alert severity="error">{error}</Alert>
        <Box>
          <Button variant="contained" onClick={() => void load(true)}>
            Tentar novamente
          </Button>
        </Box>
      </Stack>
    );
  }

  if (!summary || !stats) {
    return null;
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="overline" sx={{ letterSpacing: "0.22em" }}>
          Administração
        </Typography>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Visão executiva de grupos, presença e atividade recente dos convites.
        </Typography>
      </Box>

      {error ? <Alert severity="warning">{error}</Alert> : null}

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(3, minmax(0, 1fr))",
          },
        }}
      >
        <SummaryCard label="Total de grupos" value={summary.total_groups} />
        <SummaryCard label="Grupos respondidos" value={summary.confirmed} />
        <SummaryCard label="Grupos pendentes" value={summary.pending} />
        <SummaryCard label="Confirmados no jantar" value={summary.dinner_count} />
        <SummaryCard label="Cerimônia" value={summary.ceremony_groups} />
        <SummaryCard
          label="Taxa de resposta"
          value={`${summary.response_rate_percent.toFixed(1)}%`}
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: {
            xs: "1fr",
            lg: "minmax(0, 1.2fr) minmax(320px, 0.8fr)",
          },
        }}
      >
        <PieChartCard
          title="Presença para jantar"
          description={`${stats.total_members} membros cadastrados, ${stats.responded_members} respondidos e ${stats.pending_members} pendentes.`}
          data={presenceChartData}
        />

        <Paper sx={{ p: 3, borderRadius: 4, minWidth: 0 }}>
          <Stack spacing={2.25}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Resumo dos convidados
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {stats.total_members} membros cadastrados, {stats.responded_members} respondidos e {" "}
                {stats.pending_members} pendentes.
              </Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Chip label={`Cerimônia ${summary.ceremony_groups}`} size="small" />
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Últimos RSVPs
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {recentRsvps.length
                  ? "Respostas recebidas recentemente pelo sistema."
                  : "Ainda não existem respostas registradas."}
              </Typography>

              <Stack spacing={1.25} sx={{ mt: 2 }}>
                {recentRsvps.map((rsvp) => (
                  <Box
                    key={rsvp.id}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: "rgba(0,0,0,0.03)",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 2,
                        flexWrap: "wrap",
                      }}
                    >
                      <Box>
                        <Typography sx={{ fontWeight: 700 }}>{rsvp.nome_grupo}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatDateTime(rsvp.created_at)}
                        </Typography>
                      </Box>
                      <Chip
                        label={`${rsvp.total_confirmados ?? 0} confirmados`}
                        size="small"
                        color="primary"
                      />
                    </Box>
                  </Box>
                ))}

                {recentRsvps.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Nenhuma resposta para exibir.
                  </Typography>
                ) : null}
              </Stack>
            </Box>
          </Stack>
        </Paper>
      </Box>

      <Stack spacing={1}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Cerimônia + jantar
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {ceremonyDinnerGroups.length} grupo{ceremonyDinnerGroups.length === 1 ? "" : "s"}.
          </Typography>
        </Box>
        <GroupsTable groups={ceremonyDinnerGroups} loadGroupDetails={loadGroupDetails} />
      </Stack>

      <Stack spacing={1}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Cerimônia apenas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {ceremonyOnlyGroups.length} grupo{ceremonyOnlyGroups.length === 1 ? "" : "s"}.
          </Typography>
        </Box>
        <GroupsTable groups={ceremonyOnlyGroups} loadGroupDetails={loadGroupDetails} />
      </Stack>
    </Stack>
  );
}