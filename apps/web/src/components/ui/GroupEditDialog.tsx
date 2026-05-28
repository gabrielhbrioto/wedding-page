"use client";

import { useEffect, useState } from "react";

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import type {
  AdminGroupSummary,
  AdminGroupType,
  AdminGroupRsvpStatus,
  AdminUpdateGroupInput,
} from "@/types/admin";

type GroupEditDialogProps = {
  open: boolean;
  group: AdminGroupSummary | null;
  onClose: () => void;
  onSave: (values: AdminUpdateGroupInput) => Promise<void>;
};

const groupTypes: Array<{ value: AdminGroupType; label: string }> = [
  { value: "CERIMONIA", label: "Cerimônia" },
  { value: "CERIMONIA_JANTAR", label: "Cerimônia + jantar" },
  { value: "JANTAR", label: "Apenas jantar" },
];

const rsvpStatuses: Array<{ value: AdminGroupRsvpStatus; label: string }> = [
  { value: "PENDENTE", label: "Pendente" },
  { value: "CONFIRMADO", label: "Confirmado" },
  { value: "RECUSADO", label: "Recusado" },
];

export function GroupEditDialog({ open, group, onClose, onSave }: GroupEditDialogProps) {
  const [token, setToken] = useState("");
  const [nomeGrupo, setNomeGrupo] = useState("");
  const [tipoConvite, setTipoConvite] = useState<AdminGroupType>("CERIMONIA");
  const [observacoes, setObservacoes] = useState("");
  const [rsvpStatus, setRsvpStatus] = useState<AdminGroupRsvpStatus>("PENDENTE");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !group) {
      return;
    }

    setToken(group.token ?? "");
    setNomeGrupo(group.nome_grupo);
    setTipoConvite(group.tipo_convite);
    setObservacoes(group.observacoes ?? "");
    setRsvpStatus(group.rsvp_status);
    setError(null);
  }, [group, open]);

  async function handleSubmit() {
    if (!group) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSave({
        token: token.trim() || undefined,
        nome_grupo: nomeGrupo.trim(),
        tipo_convite: tipoConvite,
        observacoes: observacoes.trim() || undefined,
        rsvp_status: rsvpStatus,
      });
      onClose();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Não foi possível salvar o grupo."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Stack spacing={0.5}>
          <Typography variant="h6" component="h6" sx={{ fontWeight: 700 }}>
            Editar grupo
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Ajuste os dados do grupo e o convite relacionado.
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}

          <TextField
            label="Token"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            fullWidth
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
            minRows={4}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit" disabled={submitting}>
          Cancelar
        </Button>
        <Button onClick={() => void handleSubmit()} variant="contained" disabled={submitting}>
          Salvar alterações
        </Button>
      </DialogActions>
    </Dialog>
  );
}
