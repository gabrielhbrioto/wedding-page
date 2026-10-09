export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

function extractErrorMessage(text: string) {
  try {
    const body = JSON.parse(text) as { detail?: unknown };

    if (typeof body.detail === "string") {
      return body.detail;
    }

    // Erros de validação (422) do FastAPI chegam como lista de objetos com `msg`.
    if (Array.isArray(body.detail)) {
      const messages = body.detail
        .map((item) => (item && typeof item === "object" && "msg" in item ? String(item.msg) : null))
        .filter(Boolean);

      if (messages.length > 0) {
        return messages.join(" ");
      }
    }
  } catch {
    // Resposta não-JSON: usa o texto como veio.
  }

  return text;
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  const res = await fetch(`/api/v1${normalizedPath}`, {
    ...options,
    credentials: "include", // 🔥 importante para cookies JWT
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(extractErrorMessage(text) || "Erro na requisição");
  }

  return res.json();
}