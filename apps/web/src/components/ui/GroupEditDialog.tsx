"use client";

import { useEffect, useState, type KeyboardEvent } from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Plus, Trash2, Undo2 } from "lucide-react";

import type {
  AdminGroupDetails,
  AdminGroupMember,
  AdminGroupMembersChanges,
  AdminGroupSummary,
  AdminGroupType,
  AdminGroupRsvpStatus,
  AdminUpdateGroupInput,
} from "@/types/admin";

type GroupEditDialogProps = {
  open: boolean;
  group: AdminGroupSummary | null;
  onClose: () => void;
  loadGroupDetails: (groupId: string) => Promise<AdminGroupDetails>;
  onSave: (
    values: AdminUpdateGroupInput,
    members: AdminGroupMembersChanges
  ) => Promise<void>;
};

type NewGuestDraft = {
  id: string;
  nome: string;
};

const groupTypes: Array<{ value: AdminGroupType; label: string }> = [
  { value: "CERIMONIA", label: "Cerimônia" },
  { value: "CERIMONIA_JANTAR", label: "Cerimônia + jantar" },
  { value: "VIP", label: "VIP" },
];

const rsvpStatuses: Array<{ value: AdminGroupRsvpStatus; label: string }> = [
  { value: "PENDENTE", label: "Pendente" },
  { value: "RESPONDIDO", label: "Respondido" },
];

function makeDraftId() {
  return (
    globalThis.crypto?.randomUUID?.() ?? `new-${Math.random().toString(36).slice(2, 10)}`
  );
}

function getMemberStatusLabel(status: AdminGroupMember["status"]) {
  switch (status) {
    case "CERIMONIA_E_JANTAR":
      return "Cerimônia + jantar";
    case "SOMENTE_CERIMONIA":
      return "Apenas cerimônia";
    case "AUSENTE":
      return "Não irá";
    default:
      return "Pendente";
  }
}

export function GroupEditDialog({
  open,
  group,
  onClose,
  loadGroupDetails,
  onSave,
}: GroupEditDialogProps) {
  const [nomeGrupo, setNomeGrupo] = useState("");
  const [tipoConvite, setTipoConvite] = useState<AdminGroupType>("CERIMONIA_JANTAR");
  const [observacoes, setObservacoes] = useState("");
  const [rsvpStatus, setRsvpStatus] = useState<AdminGroupRsvpStatus>("PENDENTE");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [members, setMembers] = useState<AdminGroupMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [membersReloadKey, setMembersReloadKey] = useState(0);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [newGuests, setNewGuests] = useState<NewGuestDraft[]>([]);
  const [newGuestName, setNewGuestName] = useState("");

  useEffect(() => {
    if (!open || !group) {
      return;
    }

    setNomeGrupo(group.nome_grupo);
    setTipoConvite(group.tipo_convite);
    setObservacoes(group.observacoes ?? "");
    setRsvpStatus(group.rsvp_status);
    setError(null);
    setRemovedIds([]);
    setNewGuests([]);
    setNewGuestName("");
  }, [group, open]);

  useEffect(() => {
    if (!open || !group) {
      return;
    }

    let cancelled = false;
    setMembersLoading(true);
    setMembersError(null);

    loadGroupDetails(group.id)
      .then((details) => {
        if (!cancelled) {
          setMembers(details.members);
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setMembers([]);
          setMembersError(
            loadError instanceof Error
              ? loadError.message
              : "Não foi possível carregar os convidados."
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setMembersLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [group, open, loadGroupDetails, membersReloadKey]);

  function addNewGuest() {
    const nome = newGuestName.trim();
    if (!nome) {
      return;
    }

    setNewGuests((current) => [...current, { id: makeDraftId(), nome }]);
    setNewGuestName("");
  }

  function handleNewGuestKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      addNewGuest();
    }
  }

  function removeNewGuest(draftId: string) {
    setNewGuests((current) => current.filter((guest) => guest.id !== draftId));
  }

  function toggleRemoveMember(member: AdminGroupMember) {
    if (removedIds.includes(member.id)) {
      setRemovedIds((current) => current.filter((id) => id !== member.id));
      return;
    }

    if (member.status) {
      const confirmed = window.confirm(
        `"${member.nome}" já respondeu ao RSVP. Remover mesmo assim? A resposta dessa pessoa será descartada.`
      );
      if (!confirmed) {
        return;
      }
    }

    setRemovedIds((current) => [...current, member.id]);
  }

  function buildGroupChanges(currentGroup: AdminGroupSummary): AdminUpdateGroupInput {
    // Envia apenas o que mudou: o token nunca é enviado e o rsvp_status só vai
    // quando alterado, evitando a checagem de prazo em edições simples.
    const changes: AdminUpdateGroupInput = {};
    const trimmedName = nomeGrupo.trim();
    const trimmedNotes = observacoes.trim();

    if (trimmedName !== currentGroup.nome_grupo) {
      changes.nome_grupo = trimmedName;
    }
    if (tipoConvite !== currentGroup.tipo_convite) {
      changes.tipo_convite = tipoConvite;
    }
    if (trimmedNotes !== (currentGroup.observacoes ?? "")) {
      changes.observacoes = trimmedNotes;
    }
    if (rsvpStatus !== currentGroup.rsvp_status) {
      changes.rsvp_status = rsvpStatus;
    }

    return changes;
  }

  async function handleSubmit() {
    if (!group) {
      return;
    }

    if (!nomeGrupo.trim()) {
      setError("Informe o nome do grupo.");
      return;
    }

    // Um nome digitado mas ainda não adicionado também é salvo.
    const pendingName = newGuestName.trim();
    const added = [...newGuests.map((guest) => guest.nome), ...(pendingName ? [pendingName] : [])];

    setSubmitting(true);
    setError(null);

    try {
      await onSave(buildGroupChanges(group), { added, removedIds });
      onClose();
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : "Não foi possível salvar o grupo.";
      setError(
        `${message} Parte das alterações pode ter sido aplicada; a lista de convidados foi recarregada.`
      );
      setRemovedIds([]);
      setNewGuests([]);
      setNewGuestName("");
      setMembersReloadKey((current) => current + 1);
    } finally {
      setSubmitting(false);
    }
  }

  const keptCount = members.length - removedIds.length;
  const pendingCount = newGuestName.trim() ? 1 : 0;
  const finalCount = keptCount + newGuests.length + pendingCount;

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Stack spacing={0.5}>
          <Typography variant="h6" component="h6" sx={{ fontWeight: 700 }}>
            Editar grupo
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Ajuste os dados do grupo e os convidados. O link do convite não muda.
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}

          <TextField
            label="Token"
            value={group?.token ?? ""}
            fullWidth
            helperText="O token é fixo para manter o link do convite já enviado."
            slotProps={{ input: { readOnly: true } }}
          />

          <TextField
            label="Nome do grupo"
            value={nomeGrupo}
            onChange={(event) => setNomeGrupo(event.target.value)}
            fullWidth
            required
          />

          <TextField
            select
            label="Tipo de convite"
            value={tipoConvite}
            onChange={(event) => setTipoConvite(event.target.value as AdminGroupType)}
            fullWidth
          >
            {groupTypes.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="RSVP"
            value={rsvpStatus}
            onChange={(event) => setRsvpStatus(event.target.value as AdminGroupRsvpStatus)}
            fullWidth
          >
            {rsvpStatuses.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Observações"
            value={observacoes}
            onChange={(event) => setObservacoes(event.target.value)}
            fullWidth
            multiline
            minRows={3}
          />

          <Divider />

          <Stack spacing={1.5}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Convidados ({finalCount})
              </Typography>
              <Typography variant="body2" color="text.secondary">
                As inclusões e remoções são aplicadas ao clicar em “Salvar alterações”.
              </Typography>
            </Box>

            {membersError ? <Alert severity="error">{membersError}</Alert> : null}

            {membersLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Stack spacing={1} component="ul" sx={{ listStyle: "none", p: 0, m: 0 }}>
                {members.map((member) => {
                  const removed = removedIds.includes(member.id);

                  return (
                    <Box
                      component="li"
                      key={member.id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        px: 1.5,
                        py: 0.75,
                        borderRadius: 2,
                        border: "1px solid rgba(0,0,0,0.08)",
                        bgcolor: removed ? "rgba(211,47,47,0.06)" : "transparent",
                      }}
                    >
                      <Typography
                        sx={{
                          flex: 1,
                          textDecoration: removed ? "line-through" : "none",
                          color: removed ? "text.secondary" : "text.primary",
                        }}
                      >
                        {member.nome}
                      </Typography>

                      <Chip
                        size="small"
                        label={removed ? "Será removido" : getMemberStatusLabel(member.status)}
                        color={removed ? "error" : member.status ? "success" : "default"}
                        variant={removed ? "outlined" : "filled"}
                      />

                      <IconButton
                        size="small"
                        aria-label={
                          removed ? `Desfazer remoção de ${member.nome}` : `Remover ${member.nome}`
                        }
                        onClick={() => toggleRemoveMember(member)}
                        disabled={submitting}
                      >
                        {removed ? <Undo2 size={16} /> : <Trash2 size={16} />}
                      </IconButton>
                    </Box>
                  );
                })}

                {newGuests.map((guest) => (
                  <Box
                    component="li"
                    key={guest.id}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      px: 1.5,
                      py: 0.75,
                      borderRadius: 2,
                      border: "1px dashed rgba(46,125,50,0.5)",
                      bgcolor: "rgba(46,125,50,0.05)",
                    }}
                  >
                    <Typography sx={{ flex: 1 }}>{guest.nome}</Typography>
                    <Chip size="small" label="Novo" color="info" variant="outlined" />
                    <IconButton
                      size="small"
                      aria-label={`Descartar ${guest.nome}`}
                      onClick={() => removeNewGuest(guest.id)}
                      disabled={submitting}
                    >
                      <Trash2 size={16} />
                    </IconButton>
                  </Box>
                ))}

                {members.length === 0 && newGuests.length === 0 && !membersError ? (
                  <Typography component="li" variant="body2" color="text.secondary">
                    Nenhum convidado neste grupo.
                  </Typography>
                ) : null}
              </Stack>
            )}

            <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
              <TextField
                label="Novo convidado"
                placeholder="Nome do convidado"
                value={newGuestName}
                onChange={(event) => setNewGuestName(event.target.value)}
                onKeyDown={handleNewGuestKeyDown}
                fullWidth
                size="small"
                disabled={submitting || membersLoading}
              />
              <Button
                type="button"
                variant="outlined"
                startIcon={<Plus size={16} />}
                onClick={addNewGuest}
                disabled={submitting || membersLoading || !newGuestName.trim()}
                sx={{ flexShrink: 0, height: 40 }}
              >
                Adicionar
              </Button>
            </Box>
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit" disabled={submitting}>
          Cancelar
        </Button>
        <Button
          onClick={() => void handleSubmit()}
          variant="contained"
          disabled={submitting || membersLoading}
        >
          {submitting ? "Salvando..." : "Salvar alterações"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
