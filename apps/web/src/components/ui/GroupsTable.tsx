"use client";

import { Fragment, useEffect, useState } from "react";

import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import {
  Alert,
  Box,
  Chip,
  Collapse,
  Divider,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import { CopyInviteLinkButton } from "@/components/ui/CopyInviteLinkButton";
import type {
  AdminGroupDetails,
  AdminGroupMember,
  AdminGroupSummary,
} from "@/types/admin";

type GroupsTableProps = {
  groups: AdminGroupSummary[];
  loadGroupDetails: (groupId: string) => Promise<AdminGroupDetails>;
  /** Ao mudar, descarta os detalhes em cache e recarrega o grupo expandido. */
  refreshKey?: number;
  onDelete?: (group: AdminGroupSummary) => Promise<void> | void;
  onEdit?: (group: AdminGroupSummary) => void;
};

type ChipColor = "default" | "success" | "warning" | "error" | "info";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function getGroupTypeLabel(type: AdminGroupSummary["tipo_convite"]) {
  switch (type) {
    case "CERIMONIA":
      return "Cerimônia";
    case "CERIMONIA_JANTAR":
      return "Cerimônia + jantar";
    case "VIP":
      return "VIP";
    default:
      return type;
  }
}

function getGroupStatusColor(status: AdminGroupSummary["rsvp_status"]) {
  switch (status) {
    case "RESPONDIDO":
      return "success";
    case "PENDENTE":
    default:
      return "warning";
  }
}

function getGroupStatusLabel(status: AdminGroupSummary["rsvp_status"]) {
  switch (status) {
    case "RESPONDIDO":
      return "Respondido";
    case "PENDENTE":
    default:
      return "Pendente";
  }
}

function getMemberStatusColor(status?: AdminGroupMember["status"]): ChipColor {
  switch (status) {
    case "CERIMONIA_E_JANTAR":
    case "SOMENTE_CERIMONIA":
      return "success";
    case "AUSENTE":
      return "error";
    default:
      return "warning";
  }
}

function getMemberStatusLabel(status?: AdminGroupMember["status"]) {
  switch (status) {
    case "CERIMONIA_E_JANTAR":
      return "Confirmado cerimônia + jantar";
    case "SOMENTE_CERIMONIA":
      return "Apenas cerimônia";
    case "AUSENTE":
      return "Não irá";
    default:
      return "Pendente";
  }
}

export function GroupsTable({
  groups,
  loadGroupDetails,
  refreshKey = 0,
  onDelete,
  onEdit,
}: GroupsTableProps) {
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [detailsById, setDetailsById] = useState<Record<string, AdminGroupDetails>>({});
  const [errorsById, setErrorsById] = useState<Record<string, string>>({});
  const [cacheKey, setCacheKey] = useState(refreshKey);

  // Invalida o cache quando o pai sinaliza alteração (ex.: convidados editados).
  if (cacheKey !== refreshKey) {
    setCacheKey(refreshKey);
    setDetailsById({});
    setErrorsById({});
  }

  const needsDetails =
    expandedGroupId !== null &&
    !detailsById[expandedGroupId] &&
    !errorsById[expandedGroupId];

  useEffect(() => {
    if (!expandedGroupId || !needsDetails) {
      return;
    }

    let cancelled = false;

    loadGroupDetails(expandedGroupId)
      .then((details) => {
        if (!cancelled) {
          setDetailsById((current) => ({ ...current, [expandedGroupId]: details }));
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setErrorsById((current) => ({
            ...current,
            [expandedGroupId]:
              loadError instanceof Error
                ? loadError.message
                : "Não foi possível carregar os convidados.",
          }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [expandedGroupId, needsDetails, loadGroupDetails]);

  function handleToggle(group: AdminGroupSummary) {
    if (expandedGroupId === group.id) {
      setExpandedGroupId(null);
      return;
    }

    // Permite nova tentativa caso o carregamento anterior tenha falhado.
    setErrorsById((current) => {
      if (!current[group.id]) {
        return current;
      }
      const next = { ...current };
      delete next[group.id];
      return next;
    });
    setExpandedGroupId(group.id);
  }

  if (!groups.length) {
    return (
      <Paper sx={{ p: 3, borderRadius: 4 }}>
        <Typography variant="h6">Nenhum grupo encontrado</Typography>
        <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
          Cadastre o primeiro grupo para começar a gerenciar os convites.
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ borderRadius: 4, overflow: "hidden" }}>
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: "rgba(184,155,103,0.08)" }}>
            <TableCell width={56} />
            <TableCell>Nome grupo</TableCell>
            <TableCell>Tipo</TableCell>
            <TableCell>Token</TableCell>
            <TableCell>RSVP Status</TableCell>
            <TableCell>Data criação</TableCell>
            <TableCell align="right">Ações</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {groups.map((group) => {
            const expanded = expandedGroupId === group.id;
            const details = detailsById[group.id];
            const members = details?.members ?? [];
            const detailsError = errorsById[group.id];
            const loadingDetails = expanded && !details && !detailsError;

            return (
              <Fragment key={group.id}>
                <TableRow hover sx={{ verticalAlign: "top" }}>
                  <TableCell sx={{ width: 56 }}>
                    <IconButton
                      aria-label={expanded ? "Recolher" : "Expandir"}
                      onClick={() => void handleToggle(group)}
                      size="small"
                    >
                      <KeyboardArrowDownIcon
                        sx={{
                          transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform 160ms ease",
                        }}
                      />
                    </IconButton>
                  </TableCell>

                  <TableCell>
                    <Stack spacing={0.25}>
                      <Typography fontWeight={700}>{group.nome_grupo}</Typography>
                      {group.observacoes ? (
                        <Typography variant="body2" color="text.secondary">
                          {group.observacoes}
                        </Typography>
                      ) : null}
                    </Stack>
                  </TableCell>

                  <TableCell>
                    <Chip label={getGroupTypeLabel(group.tipo_convite)} size="small" />
                  </TableCell>

                  <TableCell>
                    {group.token ? (
                      <Typography sx={{ fontFamily: "monospace" }}>{group.token}</Typography>
                    ) : (
                      <Typography color="text.secondary">Sem token</Typography>
                    )}
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={getGroupStatusLabel(group.rsvp_status)}
                      color={getGroupStatusColor(group.rsvp_status)}
                      size="small"
                    />
                  </TableCell>

                  <TableCell>{formatDate(group.created_at)}</TableCell>

                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <CopyInviteLinkButton token={group.token} />

                      {onEdit ? (
                        <IconButton
                          aria-label="Editar grupo"
                          onClick={() => onEdit(group)}
                          size="small"
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      ) : null}

                      {onDelete ? (
                        <IconButton
                          aria-label="Excluir grupo"
                          onClick={() => void onDelete(group)}
                          size="small"
                        >
                          <DeleteOutlinedIcon fontSize="small" />
                        </IconButton>
                      ) : null}
                    </Stack>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell
                    colSpan={7}
                    sx={{ py: 0, borderBottom: expanded ? undefined : 0 }}
                  >
                    <Collapse in={expanded} timeout="auto" unmountOnExit>
                      <Box sx={{ px: 3, py: 2.5, bgcolor: "rgba(184,155,103,0.05)" }}>
                        <Stack spacing={1.5}>
                          <Box>
                            <Typography variant="subtitle1" fontWeight={700}>
                              Convidados do grupo
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {loadingDetails
                                ? "Carregando detalhes do grupo..."
                                : `${members.length} convidado${members.length === 1 ? "" : "s"}`}
                            </Typography>
                          </Box>

                          <Divider />

                          {detailsError ? (
                            <Alert severity="error">{detailsError}</Alert>
                          ) : loadingDetails ? (
                            <Typography variant="body2" color="text.secondary">
                              Buscando membros na API...
                            </Typography>
                          ) : members.length > 0 ? (
                            <Stack spacing={1}>
                              {members.map((member) => (
                                <Box
                                  key={member.id}
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 2,
                                    p: 1.25,
                                    borderRadius: 2,
                                    bgcolor: "rgba(255,255,255,0.72)",
                                    border: "1px solid rgba(0,0,0,0.06)",
                                  }}
                                >
                                  <Typography fontWeight={600}>{member.nome}</Typography>
                                  <Chip
                                    label={getMemberStatusLabel(member.status)}
                                    color={getMemberStatusColor(member.status)}
                                    size="small"
                                  />
                                </Box>
                              ))}
                            </Stack>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Este grupo ainda não possui convidados cadastrados.
                            </Typography>
                          )}
                        </Stack>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
