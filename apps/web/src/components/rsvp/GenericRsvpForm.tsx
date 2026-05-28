"use client";

import { useEffect, useState, type FormEvent } from "react";

import { CopyInviteLinkButton } from "@/components/ui/CopyInviteLinkButton";
import { apiFetch } from "@/lib/api";

type OpenRsvpResponse = {
  success: boolean;
  token: string;
  response_id: string;
  total_confirmados: number;
  confirmation_deadline_at: string | null;
};

type GenericRsvpFormProps = {
  confirmationDeadlineAt?: string | null;
  giftListUrl?: string | null;
};

function formatDeadline(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function GenericRsvpForm({
  confirmationDeadlineAt,
  giftListUrl,
}: GenericRsvpFormProps) {
  const [count, setCount] = useState(1);
  const [guestNames, setGuestNames] = useState<string[]>([""]);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<OpenRsvpResponse | null>(null);

  const deadlineDate = confirmationDeadlineAt ? new Date(confirmationDeadlineAt) : null;
  const deadlineIsValid = deadlineDate !== null && !Number.isNaN(deadlineDate.getTime());
  const deadlineLabel = deadlineIsValid ? formatDeadline(confirmationDeadlineAt!) : null;
  const deadlineExpired = deadlineIsValid ? deadlineDate.getTime() <= Date.now() : false;
  const controlsDisabled = submitting || success !== null || deadlineExpired;

  useEffect(() => {
    setGuestNames((current) => {
      if (current.length === count) {
        return current;
      }

      if (current.length < count) {
        return [...current, ...Array.from({ length: count - current.length }, () => "")];
      }

      return current.slice(0, count);
    });
    setError(null);
    setSuccess(null);
  }, [count]);

  function updateGuestName(index: number, value: string) {
    setGuestNames((current) =>
      current.map((guestName, guestIndex) =>
        guestIndex === index ? value : guestName
      )
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = (await apiFetch("/public/rsvp/open", {
        method: "POST",
        body: JSON.stringify({
          guest_names: guestNames.map((guestName) => guestName.trim()).filter(Boolean),
          message: message.trim() || null,
        }),
      })) as OpenRsvpResponse;

      setSuccess(response);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Não foi possível enviar a confirmação."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const successDeadlineLabel = success?.confirmation_deadline_at
    ? formatDeadline(success.confirmation_deadline_at)
    : deadlineLabel;

  return (
    <form className="mx-auto max-w-xl rounded-2xl bg-white p-8 shadow" onSubmit={(event) => void handleSubmit(event)}>
      <h1 className="mb-4 text-3xl font-serif">Confirmação de Presença</h1>

      <p className="mb-5 text-zinc-600">
        Preencha os nomes e envie a sua confirmação.
      </p>

      {deadlineLabel ? (
        <div
          className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
            deadlineExpired
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          {deadlineExpired
            ? `O prazo para confirmar presença encerrou em ${deadlineLabel}.`
            : `Confirme sua presença até ${deadlineLabel}.`}
        </div>
      ) : null}

      {error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-700">
          <p className="font-medium">Sua confirmação foi salva.</p>
          <p className="mt-1 text-sm text-emerald-700/90">
            Guarde este token para editar sua resposta futuramente pelo link salvo.
          </p>
          {successDeadlineLabel ? (
            <p className="mt-2 text-sm text-emerald-700/90">
              Prazo máximo para confirmação: {successDeadlineLabel}
            </p>
          ) : null}

          <div className="mt-4 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-zinc-900">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Token do convite</p>
            <p className="mt-2 break-all font-mono text-sm">{success.token}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <CopyInviteLinkButton token={success.token} />
              <a
                className="text-sm font-medium text-emerald-700 underline underline-offset-4"
                href={`/convite/${success.token}`}
              >
                Abrir convite novamente
              </a>
              {giftListUrl && success.total_confirmados > 0 ? (
                <a
                  className="text-sm font-medium text-emerald-700 underline underline-offset-4"
                  href={giftListUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Lista de presentes
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <label className="mb-4 block font-medium">
        Quantas pessoas irão?
      </label>

      <input
        type="number"
        min={1}
        max={10}
        value={count}
        disabled={controlsDisabled}
        onChange={(event) => setCount(Number(event.target.value))}
        className="mb-8 w-24 rounded border p-2"
      />

      <div className="space-y-4">
        {Array.from({ length: count }).map((_, index) => (
          <input
            key={index}
            placeholder={`Nome ${index + 1}`}
            className="w-full rounded border p-3"
            value={guestNames[index] ?? ""}
            disabled={controlsDisabled}
            onChange={(event) => updateGuestName(index, event.target.value)}
          />
        ))}
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
            : success
              ? "Convite salvo"
              : "Confirmar Presença"}
      </button>
    </form>
  );
}
