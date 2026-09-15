"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, Send, X, Phone, User, Smile, ArrowUp, MoreHorizontal, Minus } from "lucide-react";
import { startChat, sendChatMessage, pollChatMessages, fetchGeo, closeConversationByToken, ChatMessage } from "@/feature/chat/api";
import { COUNTRIES, getCountryByCode } from "@/feature/leads/data/countries";
import { LinkedText } from "@/feature/chat/components/LinkedText";

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || "Flag Journeys";
const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_CHAT_PARTNER_NUMBER ||
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
  "919136739178";
const SALES_PHONE = process.env.NEXT_PUBLIC_SALES_PHONE || "+919136739178";
const STORAGE_KEY = "flagjourney_chat_v1";

// Unique negative ids for optimistic messages (never collide with server ids).
let optimisticSeq = 0;
const nextOptimisticId = () => --optimisticSeq;

type Persisted = { token: string; name: string; phone: string };

const getErrorMessage = (err: unknown, fallback: string) => {
  if (typeof err === "object" && err !== null) {
    const e = err as { response?: { data?: { message?: string } } };
    return e.response?.data?.message || fallback;
  }
  return fallback;
};

export const ChatWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Hide on admin/internal areas.
  const pathname = usePathname();
  const hidden =
    pathname.startsWith("/dashboard") || pathname.startsWith("/auth") || pathname.startsWith("/booking");

  // Resume a previously stored conversation (read once, client-only).
  const [initial] = useState<Persisted | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Persisted) : null;
    } catch {
      return null;
    }
  });

  const [name, setName] = useState(initial?.name || "");
  const [dialCode, setDialCode] = useState("+91");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [geoCountry, setGeoCountry] = useState<{ name: string; code: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState<string | null>(initial?.token || null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [convStatus, setConvStatus] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    const tip = setTimeout(() => setShowTooltip(true), 4000);
    return () => clearTimeout(tip);
  }, []);

  // Auto focus input when chat opens or becomes ready
  useEffect(() => {
    if (ready && open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    }
  }, [ready, open]);

  // Prefill country code from visitor IP (best-effort, server-side lookup)
  useEffect(() => {
    let mounted = true;
    fetchGeo()
      .then((res) => {
        if (!mounted) return;
        const code = (res.data as { countryCode?: string })?.countryCode;
        if (!code) return;
        const country = getCountryByCode(code);
        if (!country) return;
        setDialCode(country.dialCode);
        setGeoCountry({ name: country.name, code: country.code });
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const applyDialCode = (code: string) => {
    const cleaned = code.replace(/\D/g, "");
    if (cleaned) {
      const country = COUNTRIES.find((c) => c.dialCode === `+${cleaned}`);
      if (country) setGeoCountry({ name: country.name, code: country.code });
    }
    setDialCode(code);
  };

  // Resume an existing conversation on first render
  useEffect(() => {
    if (!token) return;
    pollChatMessages(token, 0)
      .then((res) => {
        setMessages(res.data?.messages || []);
        setConvStatus(res.data?.status || null);
        setReady(true);
      })
      .catch(() => {
        // conversation may be gone → start fresh
        setToken(null);
        localStorage.removeItem(STORAGE_KEY);
      });
  }, [token]);

  // Poll for new messages (partner replies) every 4s
  const startPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      if (!token) return;
      try {
        const lastId = messagesRef.current[messagesRef.current.length - 1]?.id || 0;
        const res = await pollChatMessages(token, lastId);
        const incoming: ChatMessage[] = res.data?.messages || [];
        if (res.data?.status) setConvStatus(res.data.status);
        if (incoming.length) {
          setMessages((prev) => {
            const existing = new Set(prev.map((m) => m.id));
            return [...prev, ...incoming.filter((m) => !existing.has(m.id))];
          });
        }
      } catch {
        /* transient poll error — ignore */
      }
    }, 4000);
  }, [token]);

  useEffect(() => {
    if (!open || !token) return;
    startPolling();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [open, token, startPolling]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open]);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    const local = phoneLocal.replace(/[^\d]/g, "");
    const cc = dialCode.replace(/\D/g, "");
    if (!name.trim() || !local) {
      setError("Please enter both your name and WhatsApp number 🙏");
      return;
    }
    const fullPhone = `+${cc}${local}`;
    setError("");
    setSubmitting(true);
    try {
      const res = await startChat({
        name: name.trim(),
        phone: fullPhone,
        pageUrl: getPageUrl(),
        country: geoCountry?.name || "",
        countryId: geoCountry?.code || "",
      });
      const conv = res.data?.conversation;
      setMessages(res.data?.messages || []);
      setToken(conv.token);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: conv.token, name: name.trim(), phone: fullPhone }));
      setReady(true);
    } catch (err) {
      setError(getErrorMessage(err, "Something went wrong. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSend = async () => {
    const body = input.trim();
    if (!body || !token) return;
    setInput("");
    setSending(true);
    const optimistic: ChatMessage = {
      id: nextOptimisticId(),
      conversationId: 0,
      channel: "web",
      direction: "in",
      body,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    try {
      const res = await sendChatMessage(token, body);
      const replies: ChatMessage[] = res.data?.replies || [];
      setMessages((prev) => {
        const existing = new Set(prev.map((m) => m.id));
        const fresh = [...prev];
        for (const r of replies) if (!existing.has(r.id)) fresh.push(r);
        return fresh;
      });
    } catch (err) {
      setError(getErrorMessage(err, "Message not sent. Please try again."));
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleSendAction = async (payload: string, displayLabel: string) => {
    if (!token) return;
    setSending(true);
    const optimistic: ChatMessage = {
      id: nextOptimisticId(),
      conversationId: 0,
      channel: "web",
      direction: "in",
      body: displayLabel,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    try {
      const res = await sendChatMessage(token, payload, displayLabel);
      const replies: ChatMessage[] = res.data?.replies || [];
      setMessages((prev) => {
        const existing = new Set(prev.map((m) => m.id));
        const fresh = [...prev];
        for (const r of replies) if (!existing.has(r.id)) fresh.push(r);
        return fresh;
      });
    } catch (err) {
      setError(getErrorMessage(err, "Message not sent. Please try again."));
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const getPageUrl = () => (typeof window !== "undefined" ? window.location.href : "");

  const whatsappText = encodeURIComponent(
    `Hi! I'm ${name || "traveller"} and I was chatting on your website. Let's plan my trip!\n\nPage: ${getPageUrl()}`
  );

  const reset = async () => {
    // Close the conversation in backend before clearing local state
    if (token) {
      try {
        await closeConversationByToken(token, "CLOSED");
      } catch {
        // Best-effort — even if API fails, clear local state
      }
    }
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setMessages([]);
    setConvStatus(null);
    setReady(false);
    setName("");
    setDialCode("+91");
    setPhoneLocal("");
    setGeoCountry(null);
    setInput("");
  };

  if (hidden) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-6 z-[60] flex flex-col items-end">
      {open && (
        <div className="w-[calc(100vw-3rem)] max-w-[400px] mb-3 rounded-[2rem] overflow-hidden bg-[#f5f5f5] shadow-2xl shadow-black/20 border border-white/50 animate-in fade-in zoom-in-95 duration-200 flex flex-col h-[75vh] max-h-[700px]">
          {/* Header */}
          <div className="bg-[#f5f5f5] px-4 py-3 flex items-center justify-between shrink-0">
            <button onClick={reset} className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-200/60 hover:bg-zinc-300 text-zinc-700 transition-colors" title="Reset chat">
              <MoreHorizontal className="w-5 h-5" />
            </button>
            {ready && convStatus !== "CLOSED" && (
              <button onClick={reset} className="text-[11px] font-semibold text-zinc-400 hover:text-red-500 transition-colors px-2 py-1" title="Close this conversation">
                Close chat
              </button>
            )}
            <div className="flex items-center gap-2 bg-white rounded-full px-4 py-1.5 shadow-sm border border-zinc-100">
              <div className="relative flex items-center justify-center">
                <span className="text-[12px] font-bold text-[#d94838] italic pr-1 tracking-tighter">{BRAND.substring(0, 4).toLowerCase()}</span>
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#2ba363] border-2 border-white rounded-full"></span>
              </div>
              <span className="text-[13px] font-bold text-zinc-800 tracking-tight">{BRAND}</span>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-200/60 hover:bg-zinc-300 text-zinc-700 transition-colors">
              <Minus className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          {!ready ? (
            <div className="flex-1 overflow-y-auto bg-[#f5f5f5]">
              <form onSubmit={handleStart} className="p-4 space-y-3 mt-4">
                <p className="text-[14px] text-zinc-600 leading-relaxed bg-white p-4 rounded-2xl shadow-sm border border-zinc-100">
                  Hello! 👋 To plan your dream trip, just share your name and WhatsApp number —
                  a travel expert will contact you within 24 hours with a custom itinerary.
                </p>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 space-y-3">
                  <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5">
                    <User className="w-4 h-4 text-zinc-400" />
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="flex-1 bg-transparent outline-none text-[14px]"
                      autoComplete="name"
                    />
                  </div>
                  <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5">
                    <Phone className="w-4 h-4 text-zinc-400 shrink-0" />
                    <input
                      value={dialCode}
                      onChange={(e) => applyDialCode(e.target.value)}
                      placeholder="+91"
                      className="w-16 bg-transparent outline-none text-[14px] text-zinc-700 font-medium"
                      inputMode="tel"
                      aria-label="Country code"
                    />
                    <span className="text-zinc-300 select-none">|</span>
                    <input
                      value={phoneLocal}
                      onChange={(e) => setPhoneLocal(e.target.value)}
                      placeholder="WhatsApp number"
                      className="flex-1 bg-transparent outline-none text-[14px]"
                      inputMode="tel"
                      autoComplete="tel-national"
                    />
                  </div>
                </div>
                {error && <p className="text-[12px] text-red-600 px-2">{error}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#0066ff] hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-[15px] rounded-full py-3.5 shadow-md shadow-black/10 transition-all active:scale-[0.98] mt-2"
                >
                  {submitting ? "Starting..." : "Start Chat"}
                </button>
              </form>
            </div>
          ) : (
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Messages */}
              <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-transparent scroll-smooth [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                {/* Closed conversation banner */}
                {convStatus === "CLOSED" && (
                  <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 text-center space-y-2">
                    <p className="text-[13px] text-slate-500 font-medium">This conversation has been closed.</p>
                    <button
                      onClick={reset}
                      className="bg-[#0066ff] hover:bg-blue-700 text-white text-[13px] font-semibold rounded-full px-4 py-2 transition-colors"
                    >
                      Start New Conversation
                    </button>
                  </div>
                )}
                {messages.map((m) => {
                  const timeStr = m.createdAt
                    ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : "";
                  return (
                    <div key={m.id} className={`flex flex-col ${m.direction === "out" ? "items-start" : "items-end"}`}>
                      <div className={`flex items-end gap-2 ${m.direction === "in" ? "flex-row-reverse" : ""}`}>
                        {/* Bot logo — left */}
                        {m.direction === "out" && (
                          <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-zinc-100">
                            <span className="text-[10px] font-bold text-[#d94838] italic tracking-tighter">{BRAND.substring(0, 4).toLowerCase()}</span>
                          </div>
                        )}
                        {/* User avatar — right */}
                        {m.direction === "in" && (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#3730a3] to-[#2E8B8B] text-white flex items-center justify-center shrink-0 shadow-sm text-xs font-bold">
                            {(name?.[0] || "U").toUpperCase()}
                          </div>
                        )}
                        <div className="flex flex-col gap-1">
                          <div
                            className={`max-w-[260px] rounded-2xl px-4 py-3 text-[14px] whitespace-pre-line leading-relaxed shadow-sm ${
                              m.direction === "out"
                                ? "bg-white border border-zinc-100 text-zinc-800"
                                : "bg-[#0066ff] text-white"
                            }`}
                          >
                            {m.direction === "out" ? (
                              <LinkedText text={m.body} />
                            ) : (
                              <LinkedText text={m.body} dark />
                            )}
                          </div>
                          {m.direction === "out" && m.buttons && m.buttons.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1 max-w-[260px]">
                              {m.buttons.map((btn, i) => (
                                <button
                                  key={i}
                                  onClick={() => handleSendAction(btn.value, btn.label)}
                                  disabled={sending}
                                  className="text-[12px] font-semibold text-[#0066ff] bg-blue-50 border border-blue-100 shadow-sm rounded-full px-3 py-1.5 hover:bg-blue-100 hover:border-blue-200 transition-colors disabled:opacity-50 text-left leading-tight"
                                >
                                  {btn.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className={`text-[10px] text-zinc-500 mt-1 ${m.direction === "out" ? "ml-10" : "mr-10"}`}>
                        {m.direction === "in" && "Delivered "}
                        {timeStr}
                      </span>
                    </div>
                  );
                })}
                {sending && (
                  <div className="flex flex-col items-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-end gap-2">
                      <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-zinc-100">
                        <span className="text-[10px] font-bold text-[#d94838] italic tracking-tighter">{BRAND.substring(0, 4).toLowerCase()}</span>
                      </div>
                      <div className="bg-white border border-zinc-100 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                        <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                        <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              {convStatus === "CLOSED" ? (
                <div className="p-3 pb-1 shrink-0 bg-[#f5f5f5]">
                  <div className="text-center text-[12px] text-zinc-400 py-2">Conversation is closed — start a new one</div>
                </div>
              ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (input.trim() && !sending) handleSend();
                }}
                className="p-3 pb-1 shrink-0 bg-[#f5f5f5]"
              >
                <div className="flex items-center gap-2 bg-white rounded-full pl-4 pr-1.5 py-1.5 shadow-sm border border-zinc-200">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (input.trim() && !sending) handleSend();
                      }
                    }}
                    placeholder="Write a message..."
                    className="flex-1 bg-transparent text-[14px] outline-none text-zinc-800 placeholder:text-zinc-400"
                    maxLength={2000}
                  />
                  <div className="flex items-center gap-1.5">
                    <Smile className="w-6 h-6 text-zinc-800" />
                    <button
                      type="submit"
                      disabled={sending || !input.trim()}
                      aria-label="Send"
                      className="w-8 h-8 shrink-0 rounded-full bg-zinc-200/80 hover:bg-zinc-300 disabled:opacity-50 flex items-center justify-center transition-colors"
                    >
                      <ArrowUp className="w-5 h-5 text-zinc-500" />
                    </button>
                  </div>
                </div>
              </form>
              )}

            </div>
          )}
        </div>
      )}

      {/* Tooltip popup when chat is closed */}
      {showTooltip && !open && !hidden && (
        <div className="relative hidden md:block bg-white rounded-2xl shadow-xl border border-zinc-200 px-4 py-3 max-w-[220px] mb-3 animate-in fade-in slide-in-from-bottom-2">
          <button
            onClick={(e) => { e.stopPropagation(); setShowTooltip(false); }}
            aria-label="Dismiss chat tip"
            className="absolute top-1.5 right-1.5 text-zinc-400 hover:text-zinc-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <p className="text-sm font-semibold text-zinc-800 pr-4">
            Plan your dream trip! 
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            Ask our AI travel expert — instant answers!
          </p>
          <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white border-r border-b border-zinc-200 rotate-45" />
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => {
          setOpen(!open);
          setShowTooltip(false);
        }}
        aria-label={open ? "Close chat" : "Chat with us"}
        className="group relative w-16 h-16 bg-[#2E8B8B] rounded-full flex items-center justify-center shadow-xl shadow-[#2E8B8B]/30 hover:shadow-[#2E8B8B]/50 hover:scale-110 transition-all duration-300 cursor-pointer"
      >
        <div className="absolute inset-0 rounded-full bg-[#2E8B8B] animate-ping opacity-20" />
        {open ? <X className="w-7 h-7 text-white relative z-10" /> : <MessageCircle className="w-7 h-7 text-white relative z-10" />}
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
        )}
      </button>
    </div>
  );
};

export default ChatWidget;
