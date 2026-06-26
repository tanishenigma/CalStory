"use client";

import { useEffect, useState } from "react";
import { getIdToken } from "firebase/auth";
import type { User } from "firebase/auth";
import {
  Key,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/app/components/ui/card";
import { useToast } from "@/app/components/ToastContainer";

interface ApiKeyCardProps {
  user: User | null;
}

/**
 * Card that lets the user save / replace / delete their personal
 * Gemini API key. Owns its own state because it does network I/O
 * and only needs the Firebase user as a prop.
 */
export function ApiKeyCard({ user }: ApiKeyCardProps) {
  const toast = useToast();
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [apiKeyPreview, setApiKeyPreview] = useState<string | null>(null);
  const [apiKeyHasKey, setApiKeyHasKey] = useState(false);
  const [apiKeySaving, setApiKeySaving] = useState(false);
  const [apiKeyDeleting, setApiKeyDeleting] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [apiKeySuccess, setApiKeySuccess] = useState(false);
  const [apiKeyNeedsReEncrypt, setApiKeyNeedsReEncrypt] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await getIdToken(user);
        const res = await fetch("/api/user/api-key", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          hasKey: boolean;
          preview: string | null;
          needsReEncrypt?: boolean;
        };
        if (!cancelled) {
          setApiKeyHasKey(data.hasKey);
          setApiKeyPreview(data.preview);
          setApiKeyNeedsReEncrypt(data.needsReEncrypt ?? false);
        }
      } catch {
        // Non-fatal — show empty state.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function saveApiKey() {
    if (!user) return;
    setApiKeyError(null);
    setApiKeySuccess(false);

    const trimmed = apiKeyInput.trim();
    if (!/^AIza[0-9A-Za-z\-_]{35}$/.test(trimmed)) {
      setApiKeyError(
        'Invalid key format. Gemini keys start with "AIza" and are 39 characters long.',
      );
      return;
    }

    setApiKeySaving(true);
    try {
      const token = await getIdToken(user);
      const res = await fetch("/api/user/api-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ apiKey: trimmed }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        preview?: string;
        error?: string;
      };
      if (!res.ok || !data.success) {
        setApiKeyError(data.error ?? "Failed to save key. Please try again.");
      } else {
        setApiKeyInput("");
        setApiKeyHasKey(true);
        setApiKeyPreview(data.preview ?? null);
        setApiKeySuccess(true);
        toast("API key saved ✓");
      }
    } catch {
      setApiKeyError("Network error. Please try again.");
    } finally {
      setApiKeySaving(false);
    }
  }

  async function removeApiKey() {
    if (!user) return;
    setApiKeyError(null);
    setApiKeySuccess(false);
    setApiKeyDeleting(true);
    try {
      const token = await getIdToken(user);
      const res = await fetch("/api/user/api-key", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (res.ok && data.success) {
        setApiKeyHasKey(false);
        setApiKeyPreview(null);
        setApiKeyInput("");
        setApiKeyNeedsReEncrypt(false);
        toast("API key removed ✓");
      } else {
        setApiKeyError(data.error ?? "Failed to remove key. Please try again.");
      }
    } catch {
      setApiKeyError("Network error — could not remove key. Please try again.");
    } finally {
      setApiKeyDeleting(false);
    }
  }

  return (
    <Card className="p-4 sm:p-4 flex flex-col  gap-6 mb-6 h-full justify-evenly">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Key size={16} className="text-[#9B9895]" />
          <div className="text-sm font-bold">Your Gemini API Key</div>
        </div>
        <p className="text-xs text-[#9B9895] leading-relaxed">
          Use your own key for AI food and workout logging instead of the shared
          key. Your key is stored securely and{" "}
          <strong>never returned to this browser</strong> after saving.
        </p>
      </div>

      {apiKeyNeedsReEncrypt && (
        <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
          <AlertCircle
            size={14}
            className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0"
          />
          <div>
            <div className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-0.5">
              Security upgrade required
            </div>
            <p className="text-xs text-amber-600/90 dark:text-amber-400/80 leading-relaxed">
              Your key was saved before encryption was enabled. Please re-enter
              it below to encrypt it at rest.
            </p>
          </div>
        </div>
      )}

      {apiKeyHasKey && apiKeyPreview && (
        <div className="flex flex-col	gap-4 sm:gap-6">
          {" "}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 bg-background rounded-xl px-4 py-3">
            <div className="w-full sm:w-auto break-all">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#9B9895] mb-0.5">
                Stored key{" "}
                {!apiKeyNeedsReEncrypt && (
                  <span className="normal-case font-normal text-emerald-600 dark:text-emerald-400 ml-1">
                    · encrypted
                  </span>
                )}
              </div>
              <div className="font-mono text-sm tracking-widest">
                {apiKeyPreview}
              </div>
            </div>
          </div>{" "}
          <button
            id="settings-ai-remove-key"
            onClick={removeApiKey}
            disabled={apiKeyDeleting}
            className="flex items-center py-3.5 justify-center w-full sm:w-auto gap-1.5 text-xs w-full py-3.5 rounded-xl border border-[#EF4444] text-[#EF4444] text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-950 transition-colors">
            <Trash2 size={13} />
            {apiKeyDeleting ? "Removing…" : "Remove"}
          </button>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!apiKeySaving && apiKeyInput.trim()) saveApiKey();
        }}>
        <div>
          <label
            htmlFor="settings-ai-key-input"
            className="text-xs font-bold text-[#9B9895] uppercase tracking-wider mb-2 block">
            {apiKeyHasKey ? "Replace key" : "Enter key"}
          </label>
          <div className="relative">
            <input
              id="settings-ai-key-input"
              type={showKey ? "text" : "password"}
              value={apiKeyInput}
              onChange={(e) => {
                setApiKeyInput(e.target.value);
                setApiKeyError(null);
                setApiKeySuccess(false);
              }}
              placeholder="AIza…"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              data-1p-ignore
              data-lpignore="true"
              data-gramm="false"
              className="w-full font-mono text-sm px-3.5 py-3 pr-12 border border-transparent rounded-lg bg-background focus:bg-card focus:border-border outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              aria-label={showKey ? "Hide key" : "Show key"}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9B9895] hover:text-foreground transition-colors p-2">
              {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {apiKeyError && (
            <div className="flex items-start gap-2 mt-2.5 text-xs text-[#EF4444]">
              <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
              {apiKeyError}
            </div>
          )}
          {apiKeySuccess && !apiKeyError && (
            <div className="flex items-center gap-2 mt-2.5 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={13} />
              Key saved successfully.
            </div>
          )}
        </div>

        <button
          id="settings-ai-save-key"
          type="submit"
          disabled={apiKeySaving || !apiKeyInput.trim()}
          className="w-full py-3.5 rounded-xl bg-[#1A1916] dark:bg-[#f7f6f3] text-white dark:text-[#1a1916] font-bold text-sm hover:opacity-85 transition-opacity disabled:opacity-40 mt-6">
          {apiKeySaving ? "Saving…" : apiKeyHasKey ? "Replace Key" : "Save Key"}
        </button>
      </form>

      <p className="text-[11px] text-[#9B9895] leading-relaxed">
        Your key is <strong>never exposed to the browser</strong> after saving.
        To revoke access, remove it here or rotate it in{" "}
        <a
          href="https://aistudio.google.com/app/apikey"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground transition-colors">
          Google AI Studio
        </a>
        .
      </p>
    </Card>
  );
}
