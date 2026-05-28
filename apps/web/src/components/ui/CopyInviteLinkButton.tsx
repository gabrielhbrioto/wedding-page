"use client";

import { useState } from "react";

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { IconButton, Tooltip } from "@mui/material";

type CopyInviteLinkButtonProps = {
  token?: string | null;
  invitePath?: string;
  size?: "small" | "medium";
  disabled?: boolean;
};

export function CopyInviteLinkButton({
  token,
  invitePath = "/convite",
  size = "small",
  disabled = false,
}: CopyInviteLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!token) {
      return;
    }

    await navigator.clipboard.writeText(
      `${window.location.origin}${invitePath}/${token}`
    );

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  const isDisabled = disabled || !token;

  return (
    <Tooltip title={copied ? "Link copiado" : "Copiar link do convite"}>
      <span>
        <IconButton
          aria-label="Copiar link do convite"
          onClick={() => void handleCopy()}
          disabled={isDisabled}
          size={size}
        >
          <ContentCopyIcon fontSize={size} />
        </IconButton>
      </span>
    </Tooltip>
  );
}
