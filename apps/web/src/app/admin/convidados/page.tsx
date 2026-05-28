"use client";

import { useEffect, useState, type FormEvent } from "react";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Plus, Trash2 } from "lucide-react";

import { GroupEditDialog } from "@/components/ui/GroupEditDialog";
import { GroupsTable } from "@/components/ui/GroupsTable";
import { apiFetch } from "@/lib/api";
import type {
  AdminCreateGroupInput,
  AdminGroupDetails,
  AdminGroupSummary,
  AdminUpdateGroupInput,
} from "@/types/admin";

type GuestDraft = {
  id: string;
  nome: string;
};

type CreateGroupFormState = {
  nome_grupo: string;
  observacoes: string;
  convidados: GuestDraft[];
};

function makeRandomChunk() {
  return (
    globalThis.crypto?.randomUUID?.().replace(/-/g, "") ??
    Math.random().toString(36).slice(2, 10)
  ).slice(0, 8);
}

function makeId(prefix: string) {
  return `${prefix}-${makeRandomChunk()}`;
}

function createGuestDraft(): GuestDraft {
  return {
    id: makeId("guest"),
    nome: "",
  };
}

function createInitialFormState(): CreateGroupFormState {
  return {
    nome_grupo: "",
    observacoes: "",
    convidados: [createGuestDraft()],
  };
}

function slugifyGroupName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildInviteToken(groupName: string) {
  const base = slugifyGroupName(groupName).slice(0, 20) || "grupo";
  return `${base}-${makeRandomChunk()}`.slice(0, 30);
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error.message : fallbackMessage;
}

export default function ConvidadosPage() {
  const [groups, setGroups] = useState<AdminGroupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CreateGroupFormState>(() => createInitialFormState());
  const [editingGroup, setEditingGroup] = useState<AdminGroupSummary | null>(null);

  async function loadGroups(showLoading = false) {
    if (showLoading) {
      setLoading(true);
    }

    try {
      const response = (await apiFetch("/admin/groups")) as AdminGroupSummary[];
      setGroups(response);
      setPageError(null);
    } catch (fetchError) {
      setPageError(
        getErrorMessage(fetchError, "Não foi possível carregar os grupos.")
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

  function updateGuestName(guestId: string, nome: string) {
    setForm((current) => ({
      ...current,
      convidados: current.convidados.map((guest) =>
        guest.id === guestId ? { ...guest, nome } : guest
      ),
    }));
  }

  function addGuestField() {
    setForm((current) => ({
      ...current,
      convidados: [...current.convidados, createGuestDraft()],
    }));
  }

  function removeGuestField(guestId: string) {
    setForm((current) => {
      if (current.convidados.length === 1) {
        return {
          ...current,
          convidados: [createGuestDraft()],
        };
      }

      return {
        ...current,
        convidados: current.convidados.filter((guest) => guest.id !== guestId),
      };
    });
  }

  function resetCreateForm() {
    setForm(createInitialFormState());
    setCreateError(null);
  }

  async function handleCreateGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nomeGrupo = form.nome_grupo.trim();
    if (!nomeGrupo) {
      setCreateError("Informe o nome do grupo.");
      return;
    }

    setCreating(true);
    setCreateError(null);

    try {
      const guestNames = form.convidados
        .map((guest) => guest.nome.trim())
        .filter(Boolean);

      const payload: AdminCreateGroupInput = {
        token: buildInviteToken(nomeGrupo),
        nome_grupo: nomeGrupo,
        observacoes: form.observacoes.trim() || undefined,
      };

      const createdGroup = (await apiFetch("/admin/groups", {
        method: "POST",
        body: JSON.stringify(payload),
      })) as AdminGroupSummary;

      for (const [index, guestName] of guestNames.entries()) {
        await apiFetch(`/admin/groups/${createdGroup.id}/members`, {
          method: "POST",
          body: JSON.stringify({
            nome: guestName,
            pre_cadastrado: true,
            ordem_exibicao: index,
          }),
        });
      }

      resetCreateForm();
    } catch (createGroupError) {
      setCreateError(
        getErrorMessage(createGroupError, "Não foi possível criar o grupo.")
      );
    } finally {
      await loadGroups();
      setCreating(false);
    }
  }

  async function handleDeleteGroup(group: AdminGroupSummary) {
    const shouldDelete = window.confirm(
      `Excluir o grupo "${group.nome_grupo}"?`
    );

    if (!shouldDelete) {
      return;
    }

    await apiFetch(`/admin/groups/${group.id}`, {
      method: "DELETE",
    });

    await loadGroups();
  }

  async function handleEditGroup(group: AdminGroupSummary) {
    setEditingGroup(group);
  }

  async function handleSaveGroup(values: AdminUpdateGroupInput) {
    if (!editingGroup) {
      return;
    }

    await apiFetch(`/admin/groups/${editingGroup.id}`, {
      method: "PUT",
      body: JSON.stringify(values),
    });

    await loadGroups();
  }

  useEffect(() => {
    void loadGroups(true);
  }, []);

  if (loading && groups.length === 0) {
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

  if (pageError && groups.length === 0) {
    return (
      <Stack spacing={2}>
        <Alert severity="error">{pageError}</Alert>
        <Box>
          <Button variant="contained" onClick={() => void loadGroups(true)}>
            Tentar novamente
          </Button>
        </Box>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="overline" sx={{ letterSpacing: "0.22em" }}>
          Administração
        </Typography>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Cadastro de Convidados
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Cadastre um grupo, inclua os convidados em sequência e depois gerencie a
          lista com edição, exclusão e cópia do link do convite.
        </Typography>
      </Box>

      {pageError ? <Alert severity="error">{pageError}</Alert> : null}

      <Paper
        sx={{
          p: 3,
          borderRadius: 4,
          bgcolor: "rgba(184,155,103,0.06)",
          border: "1px solid rgba(184,155,103,0.15)",
        }}
      >
        <Box component="form" onSubmit={(event) => void handleCreateGroup(event)}>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Novo grupo
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                O grupo é criado primeiro e, em seguida, cada convidado informado é
                cadastrado como membro.
              </Typography>
            </Box>

            {createError ? <Alert severity="error">{createError}</Alert> : null}

            <TextField
              label="Nome do grupo"
              value={form.nome_grupo}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  nome_grupo: event.target.value,
                }))
              }
              fullWidth
              required
            />

            <TextField
              label="Observações"
              value={form.observacoes}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  observacoes: event.target.value,
                }))
              }
              fullWidth
              multiline
              minRows={3}
            />

            <Divider />

            <Stack spacing={1.5}>
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
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Convidados
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Adicione quantas linhas precisar. Nomes em branco serão ignorados.
                  </Typography>
                </Box>

                <Button
                  type="button"
                  variant="outlined"
                  startIcon={<Plus size={16} />}
                  onClick={addGuestField}
                >
                  Adicionar campo
                </Button>
              </Box>

              <Stack spacing={1.25}>
                {form.convidados.map((guest, index) => (
                  <Box
                    key={guest.id}
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", sm: "row" },
                      gap: 1,
                      alignItems: "flex-start",
                    }}
                  >
                    <TextField
                      label={`Convidado ${index + 1}`}
                      value={guest.nome}
                      onChange={(event) => updateGuestName(guest.id, event.target.value)}
                      fullWidth
                      placeholder="Nome do convidado"
                    />

                    <IconButton
                      aria-label={`Remover convidado ${index + 1}`}
                      onClick={() => removeGuestField(guest.id)}
                      sx={{ mt: { xs: 0, sm: 0.5 } }}
                    >
                      <Trash2 size={16} />
                    </IconButton>
                  </Box>
                ))}
              </Stack>
            </Stack>

            <Box
              sx={{
                display: "flex",
                gap: 2,
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                O token do convite será gerado automaticamente.
              </Typography>

              <Button type="submit" variant="contained" disabled={creating}>
                {creating ? "Criando..." : "Criar grupo"}
              </Button>
            </Box>
          </Stack>
        </Box>
      </Paper>

      <GroupsTable
        groups={groups}
        loadGroupDetails={loadGroupDetails}
        onEdit={(group) => void handleEditGroup(group)}
        onDelete={handleDeleteGroup}
      />

      <GroupEditDialog
        open={editingGroup !== null}
        group={editingGroup}
        onClose={() => setEditingGroup(null)}
        onSave={handleSaveGroup}
      />
    </Stack>
  );
}