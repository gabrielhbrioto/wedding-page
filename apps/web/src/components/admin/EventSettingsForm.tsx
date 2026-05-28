"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import {
  Alert,
  Box,
  Button,
  Divider,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import type {
  AdminEventSettings,
  AdminEventSettingsDeleteResponse,
  AdminEventSettingsMutationResponse,
  AdminEventSettingsUpsertInput,
} from "../../types/admin";

type EventSettingsFormState = {
  nome_casal: string;
  data_evento: string;
  rsvp_deadline_offset_days: string;
  local_nome: string;
  endereco: string;
  google_maps_url: string;
  gift_list_url: string;
  mensagem_home: string;
  ativo: boolean;
};

function createInitialFormState(): EventSettingsFormState {
  return {
    nome_casal: "",
    data_evento: "",
    rsvp_deadline_offset_days: "30",
    local_nome: "",
    endereco: "",
    google_maps_url: "",
    gift_list_url: "",
    mensagem_home: "",
    ativo: true,
  };
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function formatDateTimeLocal(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function formatDateTimeDisplay(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

function parseDeadline(form: EventSettingsFormState) {
  if (!form.data_evento || form.rsvp_deadline_offset_days.trim() === "") {
    return null;
  }

  const eventDate = new Date(form.data_evento);
  const offsetDays = Number(form.rsvp_deadline_offset_days);

  if (Number.isNaN(eventDate.getTime()) || !Number.isFinite(offsetDays) || offsetDays < 0) {
    return null;
  }

  return new Date(eventDate.getTime() - offsetDays * 24 * 60 * 60 * 1000);
}

function mapSettingsToForm(settings: AdminEventSettings): EventSettingsFormState {
  return {
    nome_casal: settings.nome_casal,
    data_evento: formatDateTimeLocal(settings.data_evento),
    rsvp_deadline_offset_days:
      settings.rsvp_deadline_offset_days === null
        ? ""
        : String(settings.rsvp_deadline_offset_days),
    local_nome: settings.local_nome ?? "",
    endereco: settings.endereco ?? "",
    google_maps_url: settings.google_maps_url ?? "",
    gift_list_url: settings.gift_list_url ?? "",
    mensagem_home: settings.mensagem_home ?? "",
    ativo: settings.ativo ?? true,
  };
}

function toPayload(form: EventSettingsFormState): AdminEventSettingsUpsertInput {
  return {
    nome_casal: form.nome_casal.trim(),
    data_evento: form.data_evento,
    rsvp_deadline_offset_days: Number(form.rsvp_deadline_offset_days),
    local_nome: form.local_nome.trim() || undefined,
    endereco: form.endereco.trim() || undefined,
    google_maps_url: form.google_maps_url.trim() || undefined,
    gift_list_url: form.gift_list_url.trim() || null,
    mensagem_home: form.mensagem_home.trim() || undefined,
    ativo: form.ativo,
  };
}

function buildDeadlineLabel(deadline: Date | null) {
  if (!deadline) {
    return null;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(deadline);
}

export default function EventSettingsForm() {
  const [settings, setSettings] = useState<AdminEventSettings | null>(null);
  const [form, setForm] = useState<EventSettingsFormState>(() => createInitialFormState());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const computedDeadline = useMemo(() => parseDeadline(form), [form]);
  const previewDeadlineLabel = buildDeadlineLabel(computedDeadline);
  const savedDeadlineLabel = settings?.confirmation_deadline_at
    ? formatDateTimeDisplay(settings.confirmation_deadline_at)
    : null;
  const isCreating = settings === null;

  async function loadSettings() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/admin/settings/", {
        credentials: "include",
      });

      if (response.status === 404) {
        setSettings(null);
        setForm(createInitialFormState());
        return;
      }

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = (await response.json()) as AdminEventSettings;
      setSettings(data);
      setForm(mapSettingsToForm(data));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Não foi possível carregar os dados do evento."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSettings();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const nomeCasal = form.nome_casal.trim();
    if (!nomeCasal) {
      setError("Informe o nome do casal.");
      return;
    }

    if (!form.data_evento) {
      setError("Informe a data do evento.");
      return;
    }

    if (form.rsvp_deadline_offset_days.trim() === "") {
      setError("Informe o prazo de confirmação em dias.");
      return;
    }

    const offsetDays = Number(form.rsvp_deadline_offset_days);
    if (!Number.isInteger(offsetDays) || offsetDays < 0) {
      setError("Informe um prazo de confirmação válido.");
      return;
    }

    setSaving(true);

    try {
      const payload = toPayload({
        ...form,
        nome_casal: nomeCasal,
        rsvp_deadline_offset_days: String(offsetDays),
      });

      const response = await fetch("/api/v1/admin/settings/", {
        method: isCreating ? "POST" : "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = (await response.json()) as AdminEventSettingsMutationResponse;
      setSettings(data.settings);
      setForm(mapSettingsToForm(data.settings));
      setSuccess(isCreating ? "Dados do evento criados com sucesso." : "Dados do evento atualizados com sucesso.");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Não foi possível salvar os dados do evento."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!settings) {
      return;
    }

    const shouldDelete = window.confirm(
      "Excluir os dados do evento? Isso remove as informações públicas e libera o cadastro novamente."
    );

    if (!shouldDelete) {
      return;
    }

    setDeleting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/v1/admin/settings/", {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = (await response.json()) as AdminEventSettingsDeleteResponse;
      if (!data.deleted) {
        throw new Error("Não foi possível excluir os dados do evento.");
      }

      setSettings(null);
      setForm(createInitialFormState());
      setSuccess("Dados do evento excluídos com sucesso.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Não foi possível excluir os dados do evento."
      );
    } finally {
      setDeleting(false);
    }
  }

  const loadingMessage = loading ? "Carregando dados do evento..." : null;

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: 320,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Stack spacing={2} sx={{ alignItems: "center" }}>
          <RefreshOutlinedIcon sx={{ fontSize: 40, color: "#8a6b42" }} />
          <Typography color="text.secondary">{loadingMessage}</Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="overline" sx={{ letterSpacing: "0.22em" }}>
          Administração
        </Typography>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Dados do Evento
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Cadastre os dados públicos do casamento, o prazo de confirmação e os dados usados pela Home.
        </Typography>
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {success ? <Alert severity="success">{success}</Alert> : null}

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: {
            xs: "1fr",
            lg: "minmax(0, 1.25fr) minmax(320px, 0.75fr)",
          },
        }}
      >
        <Paper
          component="form"
          onSubmit={(event) => void handleSubmit(event)}
          sx={{
            p: 3,
            borderRadius: 4,
            bgcolor: "rgba(184,155,103,0.06)",
            border: "1px solid rgba(184,155,103,0.15)",
          }}
        >
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Formulário do evento
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Os campos obrigatórios estão marcados com *.
              </Typography>
            </Box>

            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(2, minmax(0, 1fr))",
                },
              }}
            >
              <TextField
                label="Nome do casal *"
                required
                value={form.nome_casal}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    nome_casal: event.target.value,
                  }))
                }
                fullWidth
              />

              <TextField
                label="Data do evento *"
                type="datetime-local"
                required
                value={form.data_evento}
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    data_evento: event.target.value,
                  }))
                }
                fullWidth
              />

              <TextField
                label="Prazo de confirmação em dias *"
                type="number"
                required
                value={form.rsvp_deadline_offset_days}
                helperText="Ex.: 30 encerra as confirmações 30 dias antes do evento."
                slotProps={{
                  htmlInput: {
                    min: 0,
                    step: 1,
                  },
                }}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    rsvp_deadline_offset_days: event.target.value,
                  }))
                }
                fullWidth
              />

              <TextField
                label="Nome do local"
                value={form.local_nome}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    local_nome: event.target.value,
                  }))
                }
                fullWidth
              />

              <TextField
                label="Endereço"
                value={form.endereco}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    endereco: event.target.value,
                  }))
                }
                fullWidth
              />

              <TextField
                label="Google Maps"
                value={form.google_maps_url}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    google_maps_url: event.target.value,
                  }))
                }
                fullWidth
              />

              <TextField
                label="Link da lista de presentes"
                value={form.gift_list_url}
                helperText="Link público externo (http/https). Esse botão aparecerá na Home e após confirmações positivas."
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    gift_list_url: event.target.value,
                  }))
                }
                fullWidth
              />

              <TextField
                label="Mensagem da Home"
                value={form.mensagem_home}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    mensagem_home: event.target.value,
                  }))
                }
                fullWidth
                multiline
                minRows={4}
                sx={{ gridColumn: { xs: "auto", md: "1 / -1" } }}
              />
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={form.ativo}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      ativo: event.target.checked,
                    }))
                  }
                />
              }
              label="Evento ativo"
            />

            <Divider />

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Button
                type="button"
                variant="outlined"
                color="error"
                startIcon={<DeleteOutlinedIcon />}
                onClick={() => void handleDelete()}
                disabled={!settings || deleting || saving}
              >
                Excluir evento
              </Button>

              <Box sx={{ display: "flex", gap: 1.25, flexWrap: "wrap" }}>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => void loadSettings()}
                  disabled={saving || deleting}
                >
                  Recarregar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveOutlinedIcon />}
                  disabled={saving || deleting}
                >
                  {settings ? "Salvar alterações" : "Criar evento"}
                </Button>
              </Box>
            </Box>
          </Stack>
        </Paper>

        <Stack spacing={3}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 4,
              bgcolor: "#fff",
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <Stack spacing={2}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Resumo do prazo
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  O prazo calculado é o que será usado para bloquear confirmações e novos convites.
                </Typography>
              </Box>

              <Divider />

              <Stack spacing={1.5}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: "0.2em" }}>
                    Prazo salvo
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 700 }}>
                    {savedDeadlineLabel || "Sem prazo salvo"}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: "0.2em" }}>
                    Pré-visualização
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 700 }}>
                    {previewDeadlineLabel || "Preencha data do evento e prazo em dias"}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: "0.2em" }}>
                    Situação
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 700 }}>
                    {settings ? (form.ativo ? "Evento ativo" : "Evento inativo") : "Ainda não criado"}
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </Paper>

          <Paper
            sx={{
              p: 3,
              borderRadius: 4,
              bgcolor: "rgba(184,155,103,0.08)",
              border: "1px solid rgba(184,155,103,0.18)",
            }}
          >
            <Stack spacing={1.25}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Observações
              </Typography>
              <Typography variant="body2" color="text.secondary">
                A exclusão remove as informações públicas do casamento. A Home e o fluxo de confirmação voltam a depender de cadastro manual até que os dados sejam recriados.
              </Typography>
            </Stack>
          </Paper>
        </Stack>
      </Box>
    </Stack>
  );
}
