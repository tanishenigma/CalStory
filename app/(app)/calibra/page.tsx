"use client";

import { getIdToken } from "firebase/auth";
import {
  Check,
  Flame,
  History as HistoryIcon,
  ImagePlus,
  Loader2,
  Plus,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import DOMPurify from "dompurify";
import { UpgradePrompt } from "@/app/components/UpgradePrompt";
import { useAuthStore } from "@/app/store/authStore";
import { Spinner, useAuthGuard } from "@/app/hooks/useAuthGuard";
import { todayLocalKey, useApp } from "@/app/context/AppContext";
import BrandLogo from "@/app/components/BrandLogo";
import MealConfirmationCard from "@/app/components/nutrition/meal-confirmation-card";
import WorkoutConfirmationCard from "@/app/components/nutrition/workout-confirmation-card";
import { useAIFabChat, type FabMessage } from "@/app/lib/use-ai-fab-chat";

type Role = "user" | "assistant";

type Attachment = {
  dataUrl: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  fileName: string;
};

type ChatMessage = {
  id: string;
  role: Role;
  content: string;
  createdAt?: number;
  attachment?: Attachment;
};

type SavedChat = {
  id: string;
  title: string;
  updatedAt: number;
  messages: ChatMessage[];
};

const welcomeMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hey — I’m Coach, your CalStory coach. Ask me about lifting, eating habits, recovery, or share a meal or exercise photo for a quick read.",
  createdAt: Date.now(),
};

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function compressImage(file: File): Promise<Attachment> {
  const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
  // Diagnose the incoming file so uploads are visible and easier to debug.
  console.warn(
    "[calibra] Image selected: " +
      `name=${file.name} type=${file.type} size=${file.size}`,
  );

  if (!allowedTypes.has(file.type)) {
    throw new Error("Please attach a JPG, PNG, or WebP image.");
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Please choose an image smaller than 10 MB.");
  }

  // Read the file as a data URL first so we can inspect the bytes on failure.
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("That image could not be read."));
    reader.readAsDataURL(file);
  });

  // Decode the raw bytes with createImageBitmap, which throws descriptive
  // errors instead of a silent Image.onerror. If it fails, the file's declared
  // MIME type may be wrong or the bytes may not be a real image (e.g. a saved
  // API error response). Check magic bytes so we can tell the user exactly
  // what happened.
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch (decodeError) {
    const message =
      decodeError instanceof Error ? decodeError.message : String(decodeError);
    const header = dataUrl.slice(0, 40);
    console.error(
      "[calibra] Failed to decode image: " +
        `name=${file.name} type=${file.type} size=${file.size} ` +
        `header=${header} error=${message}`,
    );
    // Real images have recognizable magic bytes in their base64 header:
    // PNG   -> iVBOR
    // JPEG  -> /9j/
    // WebP  -> UklGR
    const isRealImage =
      header.includes("iVBOR") ||
      header.includes("/9j/") ||
      header.includes("UklGR");
    throw new Error(
      isRealImage
        ? "That image could not be read."
        : "This file isn't a valid image. It may be corrupted or was saved from an error response.",
    );
  }

  try {
    const maxDimension = 1280;
    const scale = Math.min(
      1,
      maxDimension / Math.max(bitmap.width, bitmap.height),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image processing is unavailable.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const compressed = canvas.toDataURL("image/jpeg", 0.78);
    console.warn(
      "[calibra] Image compressed: " +
        `name=${file.name} originalSize=${file.size} ` +
        `compressedBytes=${compressed.length}`,
    );
    return {
      dataUrl: compressed,
      mimeType: "image/jpeg",
      fileName: file.name,
    };
  } finally {
    bitmap.close?.();
  }
}

function timeGreeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function SafeText({ text }: { text: string }) {
  const html = useMemo(() => {
    const escape = (value: string) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/`(.+?)`/g, "<code>$1</code>");

    // Group consecutive bullet lines into a <ul>; everything else becomes <br/>.
    const lines = text.split(/\r?\n/);
    let html = "";
    let inList = false;

    for (const line of lines) {
      const bullet = line.match(/^\s*[-*•]\s+(.+)$/);
      if (bullet) {
        if (!inList) {
          html += "<ul>";
          inList = true;
        }
        html += `<li>${escape(bullet[1])}</li>`;
      } else {
        if (inList) {
          html += "</ul>";
          inList = false;
        }
        html += escape(line);
      }
    }
    if (inList) html += "</ul>";

    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ["strong", "br", "em", "b", "i", "code", "ul", "li"],
      ALLOWED_ATTR: [],
    });
  }, [text]);
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

function CoachLogMessage({
  message,
  isLogging,
  onConfirm,
  onEdit,
}: {
  message: FabMessage;
  isLogging: boolean;
  onConfirm: (intent: "food" | "workout", saveAsTemplate?: boolean) => void;
  onEdit: (intent: "food" | "workout") => void;
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-primary px-4 py-2.5 text-[15px] leading-6 text-primary-foreground">
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 max-w-[95%] flex-col items-start gap-2">
      <div className="text-[15px] leading-7 text-foreground">
        <SafeText text={message.text} />
      </div>
      {message.meal && (
        <div className="w-full max-w-md">
          <MealConfirmationCard
            meal={message.meal}
            onConfirm={() => onConfirm("food")}
            onEdit={() => onEdit("food")}
            isLogging={isLogging}
          />
        </div>
      )}
      {message.workout && (
        <div className="w-full max-w-md">
          <WorkoutConfirmationCard
            workout={message.workout}
            askSaveTemplate={message.askSaveTemplate ?? false}
            onConfirm={(saveAsTemplate) => onConfirm("workout", saveAsTemplate)}
            onEdit={() => onEdit("workout")}
            isLogging={isLogging}
          />
        </div>
      )}
    </div>
  );
}

export default function AskAIAdvice() {
  const { profile, isLoading: authLoading } = useAuthGuard();
  const { state } = useApp();
  const { user } = useAuthStore();
  const [greeting, setGreeting] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
  const [sessionId, setSessionId] = useState(newId);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [upgradeRequired, setUpgradeRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    messages: logMessages,
    isLoading: isLogLoading,
    sendMessage: logSendMessage,
    confirmLog,
    editPending,
    sessions: logSessions,
    reset: resetLogChat,
    switchSession: switchLogSession,
    deleteSession: deleteLogSession,
  } = useAIFabChat({
    date: todayLocalKey(),
    userId: user?.uid ?? "anonymous",
  });

  useEffect(() => {
    const update = () => setGreeting(timeGreeting(new Date().getHours()));
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, upgradeRequired]);

  useEffect(() => {
    if (!user?.uid) return;
    try {
      const raw = localStorage.getItem(`calibra-chat-history:${user.uid}`);
      if (!raw) return;
      const parsed = JSON.parse(raw) as SavedChat[];
      if (Array.isArray(parsed)) setSavedChats(parsed);
    } catch {
      setSavedChats([]);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid || messages.length <= 1) return;
    const firstUserMessage = messages.find(
      (message) => message.role === "user",
    );
      const title = (firstUserMessage?.content || "New Coach chat").slice(
      0,
      52,
    );
    const session: SavedChat = {
      id: sessionId,
      title,
      updatedAt: Date.now(),
      messages: messages.map((message) => ({
        ...message,
        // Keep the attachment so the image is still visible when the chat is
        // reopened from history. Images are stored in the data URL already
        // compressed to JPEG (max 1280px, 0.78 quality) to stay within
        // localStorage limits.
      })),
    };
    setSavedChats((current) => {
      const next = [
        session,
        ...current.filter((item) => item.id !== sessionId),
      ].slice(0, 30);
      try {
        localStorage.setItem(
          `calibra-chat-history:${user.uid}`,
          JSON.stringify(next),
        );
      } catch {
        // The chat remains usable if browser storage is unavailable.
      }
      return next;
    });
  }, [messages, sessionId, user?.uid]);

  if (authLoading || !profile) return <Spinner variant="dashboard" />;

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setAttachmentError(null);
    try {
      setAttachment(await compressImage(file));
      console.warn("[calibra] Attachment ready:", file.name);
    } catch (fileError) {
      console.error("[calibra] Attach failed:", fileError);
      setAttachment(null);
      setAttachmentError(
        fileError instanceof Error
          ? fileError.message
          : "Unable to attach that image.",
      );
    }
  }

  async function askQuestion(event?: FormEvent, promptOverride?: string) {
    event?.preventDefault();
    const trimmedQuestion = (promptOverride ?? question).trim();
    if ((!trimmedQuestion && !attachment) || !user || isLoading) return;

    // Keep logging inside the Coach conversation. The shared quick-log hook
    // coordinates food and workout agents, including mixed requests.
    const isLogRequest =
      !attachment &&
      /\b(log|ate|eaten|had|drank|water|meal|breakfast|lunch|dinner|snack|workout|trained|training|reps?|sets?|run|ran|lift|squat|push[- ]?ups?|pull[- ]?ups?)\b/i.test(
        trimmedQuestion,
      );
    if (isLogRequest) {
      setQuestion("");
      await sendCoachLog(trimmedQuestion);
      return;
    }

    const currentAttachment = attachment;
    const visibleQuestion =
      trimmedQuestion ||
      "Please review this image and give me practical advice.";
    const userMessage: ChatMessage = {
      id: newId(),
      role: "user",
      content: visibleQuestion,
      createdAt: Date.now(),
      attachment: currentAttachment ?? undefined,
    };
    const history = messages
      .filter((message) => message.id !== "welcome")
      .slice(-12)
      .map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        content: message.content,
      }));

    setMessages((current) => [...current, userMessage]);
    setQuestion("");
    setAttachment(null);
    setError(null);
    setAttachmentError(null);
    setUpgradeRequired(false);
    setIsLoading(true);

    try {
      const token = await getIdToken(user);
      const response = await fetch("/api/ai-advice", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: visibleQuestion,
          conversationHistory: history,
          image: currentAttachment
            ? {
                dataUrl: currentAttachment.dataUrl,
                mimeType: currentAttachment.mimeType,
              }
            : undefined,
        }),
      });
      const data = (await response.json()) as {
        answer?: string;
        error?: string;
        upgradeRequired?: boolean;
      };

      if (data.upgradeRequired) {
        setUpgradeRequired(true);
        return;
      }
      if (!response.ok || !data.answer) {
        throw new Error(data.error ?? "AI advice is temporarily unavailable.");
      }
      setMessages((current) => [
        ...current,
        {
          id: newId(),
          role: "assistant",
          content: data.answer ?? "",
          createdAt: Date.now(),
        },
      ]);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "AI advice is temporarily unavailable.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function sendCoachLog(text: string) {
    // Accessed through the hook's stable callback exposed below via the
    // closure; keeping this helper next to askQuestion makes the composer
    // behavior explicit and testable.
    await logSendMessage(text);
  }

  function formatMessageTime(createdAt?: number): string {
    return new Date(createdAt ?? Date.now()).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function startNewChat() {
    resetLogChat();
    setSessionId(newId());
    setMessages([welcomeMessage]);
    setQuestion("");
    setAttachment(null);
    setError(null);
    setAttachmentError(null);
    setUpgradeRequired(false);
    setHistoryOpen(false);
  }

  function openSavedChat(chat: SavedChat) {
    resetLogChat();
    setSessionId(chat.id);
    setMessages(chat.messages);
    setQuestion("");
    setAttachment(null);
    setError(null);
    setAttachmentError(null);
    setUpgradeRequired(false);
    setHistoryOpen(false);
  }

  function openSavedLogChat(sessionId: string) {
    switchLogSession(sessionId);
    setMessages([welcomeMessage]);
    setQuestion("");
    setHistoryOpen(false);
  }

  function deleteSavedAdviceChat(chatId: string) {
    setSavedChats((current) => {
      const next = current.filter((chat) => chat.id !== chatId);
      if (user?.uid) {
        try {
          localStorage.setItem(`calibra-chat-history:${user.uid}`, JSON.stringify(next));
        } catch {
          // The list remains updated in memory if storage is unavailable.
        }
      }
      return next;
    });
  }

  const userName =
    state.profile?.name?.trim() || user?.displayName?.split(" ")[0] || "";

  // True only while the conversation has nothing but the welcome message.
  const isEmptyState = messages.length === 1 && logMessages.length <= 1;

  // Shared between the centered empty state and the bottom-pinned bar.
  const inputBar = (
    <>
      {attachment && (
        <div className="mb-2 flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs">
          <img
            src={attachment.dataUrl}
            alt="Attachment preview"
            className="h-10 w-10 rounded-lg object-cover"
          />
          <span className="min-w-0 flex-1 truncate text-muted-foreground">
            {attachment.fileName}
          </span>
          <button
            type="button"
            onClick={() => setAttachment(null)}
            aria-label="Remove attachment"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-card hover:text-foreground">
            <X size={15} />
          </button>
        </div>
      )}
      {attachmentError && (
        <p className="mb-2 text-xs text-destructive">{attachmentError}</p>
      )}

      <form
        onSubmit={(event) => void askQuestion(event)}
        className="rounded-3xl border border-border bg-card p-2 shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-colors focus-within:border-primary/50 focus-within:shadow-[0_2px_16px_rgba(0,0,0,0.09)]">
        <textarea
          ref={inputRef}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void askQuestion();
            }
          }}
          rows={1}
          maxLength={2000}
          placeholder="Ask anything about your health and fitness…"
          className="max-h-36 min-h-10 w-full resize-none bg-transparent px-3 py-2 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground"
          aria-label="Message Coach"
        />
        <div className="flex items-center justify-between gap-2 px-1.5 pt-1">
          <div className="flex items-center gap-0.5">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => {
                void handleFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              aria-label="Upload image"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50">
              <ImagePlus size={16} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isLoading || (!question.trim() && !attachment)}
              aria-label="Send message"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30">
              {isLoading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Send size={15} />
              )}
            </button>
          </div>
        </div>
      </form>
      <p className="mt-2 flex items-center justify-center gap-1 text-center text-[10px] text-muted-foreground">
        <Check size={11} /> AI can make mistakes. Check important advice and
        seek professional care when needed.
      </p>
    </>
  );

  return (
    <section className="relative flex min-h-0 flex-1 flex-col">
      {" "}
      <div className="flex flex-col items-start lg:items-center lg:flex-row shrink-0 justify-between gap-3 border-b border-border/60 px-4 py-3 sm:px-8">
        {" "}
        <header className="flex shrink-0 flex-col gap-1 lg:px-4 lg:pb-4 lg:pt-5 lg:px-8 lg::pt-6">
          <p className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {greeting ?? "Welcome"}, {userName.split(" ")[0]} 👋
          </p>
          <p className="text-sm text-muted-foreground">
            Ask anything. Log meals, get workout advice, or just chat.
          </p>
        </header>
        <div className="flex items-center gap-2.5" />
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setHistoryOpen((open) => !open)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-muted hover:text-foreground">
            <HistoryIcon size={14} />
            <span className="hidden sm:inline">History</span>
          </button>
          <button
            type="button"
            onClick={startNewChat}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-muted hover:text-foreground disabled:opacity-50">
            <Plus size={14} />
            <span className="hidden sm:inline">New chat</span>
          </button>
        </div>
      </div>
      {historyOpen && (
        <>
          <button
            type="button"
            aria-label="Close chat history"
            onClick={() => setHistoryOpen(false)}
            className="absolute inset-0 z-10 cursor-default bg-background/20 backdrop-blur-[1px]"
          />
          <aside className="absolute inset-y-2 right-0 z-20 flex w-[min(94vw,380px)] max-w-sm flex-col overflow-hidden rounded-l-[2rem] rounded-r-none border border-r-0 border-border/70 bg-card/95 shadow-[0_12px_40px_oklch(0_0_0/_0.2)] backdrop-blur-xl sm:inset-y-4 sm:right-4 sm:w-[calc(100%-2rem)] sm:rounded-3xl sm:border-r">
            <div className="flex shrink-0 items-center justify-between border-b border-border/70 px-5 py-4">
              <div className="flex items-center gap-2">
                <HistoryIcon size={15} className="text-primary" />
                <h2 className="text-sm font-bold text-foreground">
                  Chat history
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                aria-label="Close chat history"
                className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-background hover:text-foreground">
                <X size={17} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {savedChats.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">
                  Your conversations will appear here.
                </p>
              ) : (
                <div className="space-y-1">
                  {savedChats.map((chat) => (
                    <div
                      key={chat.id}
                      className={`flex items-center gap-1 rounded-xl border border-transparent px-3 py-2 transition-all duration-150 ease-out hover:-translate-y-0.5 hover:border-primary/35 hover:bg-muted/70 hover:shadow-sm ${chat.id === sessionId ? "border-border bg-background" : ""}`}>
                      <button type="button" onClick={() => openSavedChat(chat)} className="min-w-0 flex-1 px-0 py-1 text-left">
                        <p className="truncate text-sm font-semibold text-foreground">{chat.title}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">{new Date(chat.updatedAt).toLocaleDateString()}</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSavedAdviceChat(chat.id)}
                        aria-label={`Delete chat: ${chat.title}`}
                        className="shrink-0 rounded-full p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {logSessions.length > 0 && (
              <div className="border-t border-border/70 p-3">
                <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Logging chats
                </p>
                <div className="space-y-1">
                  {logSessions.slice(0, 8).map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center gap-1 rounded-xl border border-transparent px-3 py-2 transition-all duration-150 ease-out hover:-translate-y-0.5 hover:border-primary/35 hover:bg-muted/70 hover:shadow-sm">
                      <button type="button" onClick={() => openSavedLogChat(session.id)} className="min-w-0 flex-1 truncate text-left text-xs font-semibold text-foreground">
                        {session.label}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteLogSession(session.id)}
                        aria-label={`Delete logging chat: ${session.label}`}
                        className="shrink-0 rounded-full p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {savedChats.length > 0 && (
              <p className="shrink-0 border-t border-border/70 px-5 py-3 text-[11px] text-muted-foreground">
                History is saved on this device.
              </p>
            )}
          </aside>
        </>
      )}
      {isEmptyState ? (
        <div className="flex flex-1 min-h-0 flex-col items-center justify-center px-4 sm:px-6">
          <div className="w-full max-w-2xl text-center">
            <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary">
              <BrandLogo />
            </div>
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">
              I'm  your CalStory Coach.
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
              Ask me about lifting, eating habits, recovery, or share a meal or
              exercise photo for a quick read.
            </p>
          </div>
          <div className="mt-6 w-full max-w-3xl sm:mt-8">{inputBar}</div>
        </div>
      ) : (
        <>
          <div className="min-h-96 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
            <div className="mx-auto flex max-w-4xl flex-col gap-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                  {message.role === "assistant" && (
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary">
                      <BrandLogo />
                    </div>
                  )}
                  <div
                    className={`flex min-w-0 max-w-[85%] flex-col gap-1 sm:max-w-[75%] ${message.role === "user" ? "items-end" : "items-start"}`}>
                    {message.attachment && (
                      <img
                        src={message.attachment.dataUrl}
                        alt="Attached for AI review"
                        className="max-h-56 w-auto max-w-full rounded-2xl border border-border object-cover"
                      />
                    )}
                    {message.role === "assistant" ? (
                      // No bubble — plain text on the page background, the
                      // way ChatGPT/Claude render assistant replies.
                      <div className="whitespace-pre-wrap text-[15px] leading-7 text-foreground">
                        <SafeText text={message.content} />
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap rounded-2xl rounded-tr-md bg-muted px-4 py-2.5 text-[15px] leading-6 text-foreground">
                        {message.content}
                      </div>
                    )}
                    <p className="px-0.5 text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                      {formatMessageTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              ))}

              {logMessages.filter((message) => message.id !== "greeting").map((message) => (
                <CoachLogMessage
                  key={message.id}
                  message={message}
                  isLogging={isLogLoading}
                  onConfirm={(intent, saveAsTemplate) =>
                    void confirmLog(intent, saveAsTemplate)
                  }
                  onEdit={(intent) => {
                    editPending(intent, (prefill) => setQuestion(prefill));
                    inputRef.current?.focus();
                  }}
                />
              ))}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary">
                    <Flame size={13} fill="currentColor" />
                  </div>
                  <div className="flex items-center gap-2 pt-1 text-sm text-muted-foreground">
                    <Loader2 size={15} className="animate-spin text-primary" />
                    Thinking through it…
                  </div>
                </div>
              )}

              {isLogLoading && !isLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 size={15} className="animate-spin text-primary" />
                  Preparing your log…
                </div>
              )}

              {upgradeRequired && (
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 ">
                  <p className="text-sm font-bold text-foreground">
                    Ask Coach is included with Plus and Pro.
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Upgrade for unlimited coach conversations and image reviews.
                  </p>
                  <div className="mt-3">
                    <UpgradePrompt label="Upgrade to Plus" />
                  </div>
                </div>
              )}
              {error && (
                <p className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {error}
                </p>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
          <div className="shrink-0 px-4 pb-4 pt-2 sm:px-6">
            <div className="mx-auto min-w-0 max-w-3xl">{inputBar}</div>
          </div>
        </>
      )}
    </section>
  );
}
