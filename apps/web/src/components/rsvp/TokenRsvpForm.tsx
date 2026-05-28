"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

import { apiFetch } from "@/lib/api";
import type { AdminGroupType } from "@/types/admin";

type InviteGroup = {
  token?: string | null;
  nome_grupo: string;
  tipo_convite: AdminGroupType;
  observacoes?: string | null;
};

type InviteMember = {
  id: string;
  nome: string;
};

export type MemberStatusChoice =
  | "CERIMONIA_E_JANTAR"
  | "SOMENTE_CERIMONIA"
  | "AUSENTE";

type TokenRsvpFormProps = {
  group: InviteGroup;
  members: InviteMember[];
  initialMemberStatuses?: Record<string, MemberStatusChoice>;
  initialMessage?: string;
  hasSavedResponse?: boolean;
  confirmationDeadlineAt?: string | null;
  giftListUrl?: string | null;
};

function getDefaultMemberStatus(groupType: AdminGroupType): MemberStatusChoice {
  return groupType === "CERIMONIA" ? "SOMENTE_CERIMONIA" : "CERIMONIA_E_JANTAR";
}

function getMemberStatusOptions(groupType: AdminGroupType) {
  if (groupType === "CERIMONIA") {
    return [
      { value: "SOMENTE_CERIMONIA", label: "Apenas cerimônia" },
      { value: "AUSENTE", label: "Não irá" },
    ] as const;
  }

  return [
    { value: "CERIMONIA_E_JANTAR", label: "Cerimônia + jantar" },
    { value: "SOMENTE_CERIMONIA", label: "Apenas cerimônia" },
    { value: "AUSENTE", label: "Não irá" },
  ] as const;
}

function formatDeadline(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function TokenRsvpForm({
  group,
  members,
  initialMemberStatuses,
  initialMessage,
  hasSavedResponse = false,
  confirmationDeadlineAt,
  giftListUrl,
}: TokenRsvpFormProps) {
  const [memberStatuses, setMemberStatuses] = useState<Record<string, MemberStatusChoice>>({});
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lastConfirmedCount, setLastConfirmedCount] = useState<number | null>(null);

  const statusOptions = useMemo(
    () => getMemberStatusOptions(group.tipo_convite),
    [group.tipo_convite]
  );

  const deadlineDate = confirmationDeadlineAt ? new Date(confirmationDeadlineAt) : null;
  const deadlineIsValid = deadlineDate !== null && !Number.isNaN(deadlineDate.getTime());
  const deadlineLabel = deadlineIsValid ? formatDeadline(confirmationDeadlineAt!) : null;
  const deadlineExpired = deadlineIsValid ? deadlineDate.getTime() <= Date.now() : false;
  const controlsDisabled = submitting || deadlineExpired;

  useEffect(() => {
    const initialStatuses: Record<string, MemberStatusChoice> = {};
    members.forEach((member) => {
      initialStatuses[member.id] =
        initialMemberStatuses?.[member.id] ?? getDefaultMemberStatus(group.tipo_convite);
    });

    setMemberStatuses(initialStatuses);
    setMessage(initialMessage ?? "");
    setError(null);
    setSuccess(null);
    setLastConfirmedCount(null);
  }, [group.tipo_convite, group.token, initialMemberStatuses, initialMessage, members]);

  const savedConfirmedCount = Object.values(initialMemberStatuses ?? {}).filter(
    (status) => status !== "AUSENTE"
  ).length;
  const showGiftListButton =
    Boolean(giftListUrl) && ((lastConfirmedCount ?? 0) > 0 || (hasSavedResponse && savedConfirmedCount > 0));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!group.token) {
      setError("O token do convite não está disponível.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await apiFetch(`/public/rsvp/${group.token}`, {
        method: "POST",
        body: JSON.stringify({
          message: message.trim() || null,
          members: members.map((member) => ({
            member_id: member.id,
            status:
              memberStatuses[member.id] ?? getDefaultMemberStatus(group.tipo_convite),
          })),
        }),
      });

      setLastConfirmedCount(
        members.filter(
          (member) =>
            (memberStatuses[member.id] ?? getDefaultMemberStatus(group.tipo_convite)) !== "AUSENTE"
        ).length
      );
      setSuccess("Presença confirmada com sucesso.");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Não foi possível confirmar a presença."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow" onSubmit={(event) => void handleSubmit(event)}>
      <div className="mb-8">
        <p className="mb-3 text-sm uppercase tracking-[0.35em] text-zinc-500">
          Confirmação de presença
        </p>
        <h1 className="text-3xl font-serif">{group.nome_grupo}</h1>
        {group.observacoes ? (
          <p className="mt-3 text-zinc-600">{group.observacoes}</p>
        ) : null}
      </div>

      {deadlineLabel ? (
        <div
          className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
            deadlineExpired
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          {deadlineExpired
            ? `O prazo para confirmação encerrou em ${deadlineLabel}.`
            : `Confirme sua presença até ${deadlineLabel}.`}
        </div>
      ) : null}

      {hasSavedResponse ? (
        <div className="mb-6 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sky-700">
          Sua resposta anterior foi carregada. Ajuste os dados e envie novamente para atualizar.
        </div>
      ) : null}

      {error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">
          {success}
          {showGiftListButton ? (
            <div className="mt-2">
              <a
                className="font-medium underline underline-offset-4"
                href={giftListUrl!}
                target="_blank"
                rel="noopener noreferrer"
              >
                Lista de presentes
              </a>
            </div>
          ) : null}
        </div>
      ) : null}

      {!success && showGiftListButton ? (
        <div className="mb-6 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sky-700">
          Você já confirmou presença. Se desejar, acesse também nossa lista de presentes.
          <div className="mt-2">
            <a
              className="font-medium underline underline-offset-4"
              href={giftListUrl!}
              target="_blank"
              rel="noopener noreferrer"
            >
              Lista de presentes
            </a>
          </div>
        </div>
      ) : null}

      <p className="mb-6 font-medium">Selecione quem comparecerá:</p>

      <div className="space-y-4">
        {members.map((member) => {
          const currentValue =
            memberStatuses[member.id] ?? getDefaultMemberStatus(group.tipo_convite);

          return (
            <div key={member.id} className="rounded-xl border p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-zinc-900">{member.nome}</p>
                  <p className="text-sm text-zinc-500">
                    Escolha como essa pessoa irá participar.
                  </p>
                </div>

                <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
                  <span>Presença</span>
                  <select
                    className="min-w-[220px] rounded-xl border border-zinc-300 bg-white px-3 py-2"
                    value={currentValue}
                    disabled={controlsDisabled}
                    onChange={(event) =>
                      setMemberStatuses((current) => ({
                        ...current,
                        [member.id]: event.target.value as MemberStatusChoice,
                      }))
                    }
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8">
        <label className="mb-2 block font-medium">Deseja deixar uma mensagem?</label>

        <textarea
          className="w-full rounded border p-3"
          rows={4}
          value={message}
          disabled={controlsDisabled}
          onChange={(event) => setMessage(event.target.value)}
        />
      </div>

      <button
        className="mt-8 w-full rounded-xl bg-black p-3 text-white disabled:cursor-not-allowed disabled:opacity-60"
        type="submit"
        disabled={controlsDisabled}
      >
        {submitting
          ? "Enviando..."
          : deadlineExpired
            ? "Prazo encerrado"
            : "Confirmar Presença"}
      </button>
    </form>
  );
}
