// 📁 ragchat/app/page.js
"use client";

import { useState, useRef, useEffect, useCallback, useId } from "react";

// ─── Resizable Panel ──────────────────────────────────────────────────────────

const PANEL_MIN     = 220;
const PANEL_MAX     = 520;
const PANEL_DEFAULT = 290;

function useResizablePanel(defaultWidth = PANEL_DEFAULT) {
  const [panelWidth, setPanelWidth]   = useState(defaultWidth);
  const [isDragging, setIsDragging]   = useState(false);
  const dragStartX     = useRef(0);
  const dragStartWidth = useRef(defaultWidth);

  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    dragStartX.current     = e.clientX;
    dragStartWidth.current = panelWidth;
    setIsDragging(true);
  }, [panelWidth]);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e) => {
      const delta    = e.clientX - dragStartX.current;
      const newWidth = Math.min(PANEL_MAX, Math.max(PANEL_MIN, dragStartWidth.current + delta));
      setPanelWidth(newWidth);
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };
  }, [isDragging]);

  return { panelWidth, isDragging, onMouseDown };
}

function ResizeHandle({ onMouseDown, isDragging }) {
  const [hovered, setHovered] = useState(false);
  const active = isDragging || hovered;
  return (
    <div
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Drag to resize panel"
      style={{
        width: "6px", flexShrink: 0,
        background: "transparent",
        position: "relative",
        cursor: "col-resize", zIndex: 10,
      }}
    >
      {/* line */}
      <div style={{
        position: "absolute", top: 0, bottom: 0,
        left: "50%", transform: "translateX(-50%)",
        width: active ? "3px" : "1px",
        background: active ? "#60a5fa" : "#0a1828",
        transition: "width 0.15s, background 0.15s",
        borderRadius: "2px",
      }} />
      {/* grip dots */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        display: "flex", flexDirection: "column", gap: "4px",
        opacity: active ? 1 : 0, transition: "opacity 0.15s",
      }}>
        {[0,1,2,3,4].map(i => (
          <div key={i} style={{ width: "3px", height: "3px", borderRadius: "50%", background: "#60a5fa" }} />
        ))}
      </div>
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PROVIDERS = [
  {
    id: "openai",
    label: "OpenAI",
    badge: "GPT-4o",
    color: "#34d399",
    embedModel: "text-embedding-3-small",
    chatModel: "gpt-4o",
    placeholder: "sk-…   platform.openai.com/api-keys",
    docsUrl: "platform.openai.com",
  },
  {
    id: "gemini",
    label: "Gemini",
    badge: "Flash",
    color: "#60a5fa",
    embedModel: "text-embedding-004",
    chatModel: "gemini-2.0-flash",
    placeholder: "AIzaSy…   aistudio.google.com/apikey",
    docsUrl: "aistudio.google.com",
  },
  {
    id: "mistral",
    label: "Mistral",
    badge: "Large",
    color: "#f97316",
    embedModel: "mistral-embed",
    chatModel: "mistral-large-latest",
    placeholder: "…   console.mistral.ai/api-keys",
    docsUrl: "console.mistral.ai",
  },
  {
    id: "cohere",
    label: "Cohere",
    badge: "Cmd-R+",
    color: "#a78bfa",
    embedModel: "embed-english-v3.0",
    chatModel: "command-r-plus",
    placeholder: "…   dashboard.cohere.com/api-keys",
    docsUrl: "dashboard.cohere.com",
  },
];

// ─── Lightweight markdown renderer ───────────────────────────────────────────
function md(text) {
  return text
    .replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre class="cb"><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="ic">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^### (.+)$/gm, '<p class="h3">$1</p>')
    .replace(/^## (.+)$/gm, '<p class="h2">$1</p>')
    .replace(/^# (.+)$/gm, '<p class="h1">$1</p>')
    .replace(/^\- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)/g, "<ul>$1</ul>")
    .replace(/\[Source (\d+)\]/g, '<span class="sr">[S$1]</span>')
    .replace(/\n\n/g, "</p><p>")
    .replace(/^/, "<p>")
    .replace(/$/, "</p>");
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProviderSelector({ activeId, keys, onSelect, onKeyChange }) {
  const p = PROVIDERS.find((p) => p.id === activeId);
  const [show, setShow] = useState(false);

  return (
    <div style={{ marginBottom: "14px" }}>
      <Label>AI Provider</Label>
      {/* Provider tabs */}
      <div style={{ display: "flex", background: "#080e1a", borderRadius: "8px", border: "1px solid #0f1e35", overflow: "hidden", marginBottom: "10px" }}>
        {PROVIDERS.map((pr) => (
          <button
            key={pr.id}
            onClick={() => onSelect(pr.id)}
            style={{
              flex: 1, padding: "9px 6px", border: "none",
              borderBottom: activeId === pr.id ? `2px solid ${pr.color}` : "2px solid transparent",
              background: "transparent",
              color: activeId === pr.id ? pr.color : "#2d4a6b",
              fontSize: "11px", fontFamily: "'IBM Plex Mono', monospace",
              cursor: "pointer", transition: "all 0.15s",
              display: "flex", flexDirection: "column", alignItems: "center", gap: "3px",
            }}
          >
            <span>{pr.label}</span>
            <span style={{
              width: "4px", height: "4px", borderRadius: "50%",
              background: keys[pr.id] ? pr.color : "#142236",
              display: "block",
            }} />
          </button>
        ))}
      </div>

      {/* Key input */}
      <div style={{ position: "relative" }}>
        <input
          type={show ? "text" : "password"}
          value={keys[activeId] || ""}
          onChange={(e) => onKeyChange(activeId, e.target.value)}
          placeholder={p.placeholder}
          style={{
            width: "100%", background: "#080e1a",
            border: `1px solid ${keys[activeId] ? p.color + "40" : "#0f1e35"}`,
            borderRadius: "7px", padding: "9px 36px 9px 11px",
            color: keys[activeId] ? p.color : "#2d4a6b",
            fontSize: "11px", fontFamily: "'IBM Plex Mono', monospace",
            boxSizing: "border-box", outline: "none",
          }}
        />
        <button
          onClick={() => setShow((s) => !s)}
          style={{ position: "absolute", right: "9px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#2d4a6b", cursor: "pointer", fontSize: "12px" }}
        >
          {show ? "🙈" : "👁"}
        </button>
      </div>
      <div style={{ fontSize: "9.5px", color: "#142236", fontFamily: "'IBM Plex Mono', monospace", marginTop: "5px" }}>
        → {p.docsUrl} · {p.embedModel} + {p.chatModel}
      </div>
    </div>
  );
}

function UploadZone({ onFiles, isUploading }) {
  const [drag, setDrag] = useState(false);
  const ref = useRef();

  const handle = (files) => {
    const valid = Array.from(files).filter(
      (f) =>
        ["application/pdf", "text/plain", "text/markdown"].includes(f.type) ||
        f.name.endsWith(".md") ||
        f.name.endsWith(".txt") ||
        f.name.endsWith(".pdf")
    );
    if (valid.length) onFiles(valid);
  };

  return (
    <div
      onClick={() => !isUploading && ref.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files); }}
      style={{
        border: `2px dashed ${drag ? "#60a5fa" : "#0f1e35"}`,
        borderRadius: "10px", padding: "18px",
        textAlign: "center", cursor: isUploading ? "not-allowed" : "pointer",
        background: drag ? "rgba(96,165,250,0.04)" : "transparent",
        transition: "all 0.2s", opacity: isUploading ? 0.5 : 1,
      }}
    >
      <input ref={ref} type="file" accept=".pdf,.txt,.md" multiple style={{ display: "none" }} onChange={(e) => handle(e.target.files)} />
      <div style={{ fontSize: "22px", marginBottom: "6px" }}>{isUploading ? "⏳" : "📄"}</div>
      <div style={{ fontSize: "11px", color: "#2d4a6b", fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.7 }}>
        {isUploading ? "Processing…" : "Drop PDFs, TXT, MD\nor click · multiple files OK"}
      </div>
    </div>
  );
}

function URLInput({ onSubmit, isLoading }) {
  const [url, setUrl] = useState("");
  return (
    <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && url.trim() && onSubmit(url.trim())}
        placeholder="https://docs.example.com/page"
        style={{
          flex: 1, background: "#080e1a", border: "1px solid #0f1e35",
          borderRadius: "7px", padding: "8px 10px",
          color: "#7aa2c8", fontSize: "11px", fontFamily: "'IBM Plex Mono', monospace",
          outline: "none",
        }}
      />
      <button
        onClick={() => url.trim() && onSubmit(url.trim())}
        disabled={isLoading || !url.trim()}
        style={{
          padding: "8px 12px", borderRadius: "7px", border: "none",
          background: isLoading || !url.trim() ? "#0f1e35" : "#1d4ed8",
          color: isLoading || !url.trim() ? "#1e3a5f" : "#fff",
          fontSize: "11px", fontFamily: "'IBM Plex Mono', monospace", cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {isLoading ? "…" : "Scrape ↗"}
      </button>
    </div>
  );
}

function ProgressLog({ events }) {
  if (!events.length) return null;
  const last = events[events.length - 1];
  const isDone = last.step === "all_done" || last.step === "done";
  const isErr = last.step === "error";
  return (
    <div style={{
      marginTop: "8px", padding: "10px 12px", borderRadius: "8px",
      background: isDone ? "rgba(52,211,153,0.05)" : isErr ? "rgba(239,68,68,0.05)" : "rgba(96,165,250,0.05)",
      border: `1px solid ${isDone ? "rgba(52,211,153,0.15)" : isErr ? "rgba(239,68,68,0.15)" : "rgba(96,165,250,0.1)"}`,
    }}>
      {events.slice(-6).map((e, i) => (
        <div key={i} style={{
          fontFamily: "'IBM Plex Mono', monospace", fontSize: "10.5px",
          color: e.step === "done" || e.step === "all_done" ? "#34d399" : e.step === "error" ? "#ef4444" : "#4a7a9b",
          marginBottom: i < events.length - 1 ? "3px" : 0,
          display: "flex", gap: "6px",
        }}>
          <span>{e.step === "done" || e.step === "all_done" ? "✓" : e.step === "error" ? "✗" : "·"}</span>
          <span style={{ flex: 1 }}>{e.message}</span>
          {e.progress && <span style={{ color: "#60a5fa" }}>{e.progress}%</span>}
        </div>
      ))}
    </div>
  );
}

function DocItem({ doc, selected, onToggle, onDelete }) {
  const p = PROVIDERS.find((pr) => pr.id === doc.provider) || PROVIDERS[0];
  return (
    <div
      onClick={onToggle}
      style={{
        display: "flex", alignItems: "center", gap: "8px",
        padding: "9px 11px", borderRadius: "7px", marginBottom: "4px",
        border: `1px solid ${selected ? p.color + "35" : "#0a1828"}`,
        background: selected ? p.color + "08" : "transparent",
        cursor: "pointer", transition: "all 0.15s",
      }}
    >
      <div style={{
        width: "13px", height: "13px", borderRadius: "3px", flexShrink: 0,
        border: `1.5px solid ${selected ? p.color : "#1a3050"}`,
        background: selected ? p.color : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {selected && <span style={{ color: "#07101f", fontSize: "8px", fontWeight: 700 }}>✓</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "11.5px", color: "#8ab4d4", fontFamily: "'IBM Plex Mono', monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {doc.source_type === "url" ? "🌐 " : "📄 "}{doc.name}
        </div>
        <div style={{ fontSize: "9.5px", color: "#1e3a5f", fontFamily: "'IBM Plex Mono', monospace", marginTop: "1px", display: "flex", gap: "6px" }}>
          <span>{doc.chunk_count} chunks</span>
          <span style={{ color: p.color + "80" }}>{p.label}</span>
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(doc.id); }}
        style={{ background: "none", border: "none", color: "#1a3050", cursor: "pointer", fontSize: "15px", padding: "2px 4px", flexShrink: 0, lineHeight: 1 }}
        title="Delete"
      >×</button>
    </div>
  );
}

function SourceCard({ source, index }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      onClick={() => setOpen((o) => !o)}
      style={{
        background: "#060c18", border: "1px solid #0a1828",
        borderRadius: "6px", padding: "8px 10px", cursor: "pointer",
        borderColor: open ? "#142236" : "#0a1828",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <span style={{ fontSize: "9px", padding: "1px 6px", borderRadius: "3px", background: "rgba(96,165,250,0.12)", color: "#60a5fa", fontFamily: "'IBM Plex Mono', monospace" }}>
          S{index + 1}
        </span>
        <span style={{ fontSize: "11px", color: "#2d4a6b", fontFamily: "'IBM Plex Mono', monospace", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {source.document_name}
        </span>
        <span style={{ fontSize: "10px", color: "#22d3ee", fontFamily: "'IBM Plex Mono', monospace", flexShrink: 0 }}>{source.similarity}%</span>
        <span style={{ fontSize: "9px", color: "#0f1e35" }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div style={{ marginTop: "7px", fontSize: "11px", color: "#4a7a9b", lineHeight: 1.65, borderTop: "1px solid #0a1828", paddingTop: "7px", fontFamily: "'IBM Plex Mono', monospace" }}>
          {source.content}
        </div>
      )}
    </div>
  );
}

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start", marginBottom: "20px", animation: "fu .2s ease" }}>
      <div style={{
        maxWidth: "82%",
        background: isUser ? "rgba(96,165,250,0.1)" : "#07111e",
        border: `1px solid ${isUser ? "rgba(96,165,250,0.2)" : "#0a1828"}`,
        borderRadius: isUser ? "14px 14px 4px 14px" : "4px 14px 14px 14px",
        padding: "11px 15px",
      }}>
        {isUser
          ? <p style={{ margin: 0, fontSize: "14px", color: "#c5daf0", lineHeight: 1.6, fontFamily: "'Fraunces', serif" }}>{msg.content}</p>
          : <div className="md" dangerouslySetInnerHTML={{ __html: md(msg.content) }} />
        }
      </div>
      {!isUser && msg.sources?.length > 0 && (
        <div style={{ maxWidth: "82%", width: "100%", marginTop: "7px" }}>
          <div style={{ fontSize: "9.5px", color: "#142236", fontFamily: "'IBM Plex Mono', monospace", marginBottom: "4px", letterSpacing: "0.1em" }}>
            SOURCES ({msg.sources.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {msg.sources.map((s, i) => <SourceCard key={i} source={s} index={i} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function Dots() {
  return (
    <div style={{ display: "flex", marginBottom: "20px" }}>
      <div style={{ background: "#07111e", border: "1px solid #0a1828", borderRadius: "4px 14px 14px 14px", padding: "14px 18px", display: "flex", gap: "5px" }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#142236", animation: `bounce 1.2s ease infinite`, animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  );
}

function Label({ children }) {
  return (
    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9.5px", color: "#142236", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "8px" }}>
      {children}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RAGChatPage() {
  const [provider, setProvider]       = useState("openai");
  const [apiKeys, setApiKeys]         = useState({ openai: "", gemini: "" });
  const [documents, setDocuments]     = useState([]);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [uploadMode, setUploadMode]   = useState("file"); // 'file' | 'url'
  const [uploadEvents, setUploadEvents] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isScraping, setIsScraping]   = useState(false);
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamText, setStreamText]   = useState("");
  const [streamSources, setStreamSources] = useState([]);
  const [error, setError]             = useState("");
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const { panelWidth, isDragging, onMouseDown } = useResizablePanel(PANEL_DEFAULT);

  const fetchDocs = async () => {
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      if (data.error) { setError("Failed to load documents: " + data.error); return; }
      setDocuments(data.documents || []);
    } catch (e) {
      setError("Failed to load documents: " + e.message);
    }
  };

  useEffect(() => { fetchDocs(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, streamText, isStreaming]);

  const currentKey      = apiKeys[provider] || "";
  const currentProvider = PROVIDERS.find((p) => p.id === provider);

  // Always-fresh refs — fixes stale closure bug in useCallback
  const providerRef = useRef(provider);
  const apiKeysRef  = useRef(apiKeys);
  useEffect(() => { providerRef.current = provider; }, [provider]);
  useEffect(() => { apiKeysRef.current  = apiKeys;  }, [apiKeys]);

  // Helper: always read latest provider + key without stale closure
  const getFresh = useRef(() => {
    const prov = providerRef.current;
    const key  = apiKeysRef.current[prov] || "";
    const pDef = PROVIDERS.find((p) => p.id === prov);
    return { prov, key, pDef };
  }).current;

  // ── File Upload ──────────────────────────────────────────────────────────
  const handleFiles = useCallback(async (files) => {
    const { prov, key, pDef } = getFresh();
    if (!key.trim()) { setError("Enter your " + pDef.label + " API key first."); return; }
    setIsUploading(true);
    setUploadEvents([]);
    setError("");

    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    fd.append("provider", prov);
    fd.append("apiKey", key);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      await readSSE(res, (ev) => {
        setUploadEvents((prev) => [...prev.slice(-10), ev]);
        if (ev.step === "all_done") { setTimeout(fetchDocs, 800); setTimeout(() => setUploadEvents([]), 5000); }
      });
    } catch (e) {
      setError("Upload failed: " + e.message);
    } finally {
      setIsUploading(false);
    }
  }, []);

  // ── URL Scrape ───────────────────────────────────────────────────────────
  const handleScrape = useCallback(async (url) => {
    const { prov, key, pDef } = getFresh();
    if (!key.trim()) { setError("Enter your " + pDef.label + " API key first."); return; }
    setIsScraping(true);
    setUploadEvents([]);
    setError("");

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, provider: prov, apiKey: key }),
      });
      await readSSE(res, (ev) => {
        setUploadEvents((prev) => [...prev.slice(-10), ev]);
        if (ev.step === "done") { setTimeout(fetchDocs, 800); setTimeout(() => setUploadEvents([]), 5000); }
      });
    } catch (e) {
      setError("Scrape failed: " + e.message);
    } finally {
      setIsScraping(false);
    }
  }, []);

  // ── Chat ─────────────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const { prov, key, pDef } = getFresh();
    const q = input.trim();
    if (!q || isStreaming || !documents.length) return;
    if (!key.trim()) { setError("Enter your " + pDef.label + " API key first."); return; }

    setInput("");
    setError("");
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setIsStreaming(true);
    setStreamText("");
    setStreamSources([]);

    let fullText = "";
    let sources  = [];

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q, provider: prov, apiKey: key,
          document_ids: selectedDocs.length ? selectedDocs : null,
          history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      await readSSE(res, (ev) => {
        if (ev.type === "sources") { sources = ev.sources; setStreamSources(sources); }
        else if (ev.type === "token") { fullText += ev.token; setStreamText(fullText); }
        else if (ev.type === "done") {
          setMessages((prev) => [...prev, { role: "assistant", content: fullText, sources }]);
          setStreamText("");
          setStreamSources([]);
          setIsStreaming(false);
        }
        else if (ev.type === "error") { setError(ev.message); setIsStreaming(false); }
      });
    } catch (e) {
      setError("Chat error: " + e.message);
      setIsStreaming(false);
    }
  }, [input, isStreaming, messages, documents, selectedDocs]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const hasPage = documents.length > 0;

  return (
    <>
      <div style={{ display: "flex", height: "100vh", background: "#070d18", color: "#c5daf0", fontFamily: "'Fraunces', serif", userSelect: isDragging ? "none" : "auto" }}>

        {/* ── SIDEBAR ── */}
        <div style={{ width: `${panelWidth}px`, flexShrink: 0, borderRight: "none", background: "#050b15", display: "flex", flexDirection: "column", overflow: "hidden", transition: isDragging ? "none" : "width 0.05s" }}>

          {/* Width tooltip while dragging */}
          {isDragging && (
            <div style={{
              position: "fixed", top: "60px", left: `${panelWidth + 12}px`,
              background: "#60a5fa", color: "#07111e",
              fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px",
              padding: "3px 8px", borderRadius: "4px", zIndex: 1000, pointerEvents: "none",
            }}>
              {panelWidth}px
            </div>
          )}

          {/* Logo */}
          <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid #0a1828", display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg, #0f2a5e, #1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 }}>
              ◈
            </div>
            <div>
              <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: "15px", color: "#c5daf0", letterSpacing: "-0.02em" }}>RAGChat</div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", color: "#142236", letterSpacing: "0.1em" }}>DOCS INTELLIGENCE</div>
            </div>
            <div style={{ marginLeft: "auto" }}>
              <span style={{
                fontSize: "9px", padding: "2px 7px", borderRadius: "4px",
                background: currentProvider.color + "15",
                border: `1px solid ${currentProvider.color}30`,
                color: currentProvider.color,
                fontFamily: "'IBM Plex Mono', monospace",
              }}>{currentProvider.badge}</span>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "14px" }}>
            {/* Provider selector */}
            <ProviderSelector
              activeId={provider}
              keys={apiKeys}
              onSelect={setProvider}
              onKeyChange={(id, val) => setApiKeys((k) => ({ ...k, [id]: val }))}
            />

            {/* Upload mode tabs */}
            <Label>Add Knowledge</Label>
            <div style={{ display: "flex", background: "#080e1a", borderRadius: "7px", border: "1px solid #0a1828", overflow: "hidden", marginBottom: "10px" }}>
              {[{ id: "file", label: "📄 Files" }, { id: "url", label: "🌐 URL" }].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setUploadMode(m.id)}
                  style={{
                    flex: 1, padding: "8px", border: "none",
                    background: uploadMode === m.id ? "#0f1e35" : "transparent",
                    color: uploadMode === m.id ? "#60a5fa" : "#1e3a5f",
                    fontSize: "11px", fontFamily: "'IBM Plex Mono', monospace", cursor: "pointer",
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {uploadMode === "file"
              ? <UploadZone onFiles={handleFiles} isUploading={isUploading} />
              : <URLInput onSubmit={handleScrape} isLoading={isScraping} />
            }
            <ProgressLog events={uploadEvents} />

            {/* Documents */}
            <div style={{ marginTop: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <Label>Documents ({documents.length})</Label>
                {documents.length > 0 && (
                  <button
                    onClick={() => setSelectedDocs(selectedDocs.length === documents.length ? [] : documents.map((d) => d.id))}
                    style={{ fontSize: "9px", color: "#142236", background: "none", border: "none", cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace", marginBottom: "8px" }}
                  >
                    {selectedDocs.length === documents.length ? "Deselect all" : "Select all"}
                  </button>
                )}
              </div>

              {documents.length === 0 ? (
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: "#0a1828", textAlign: "center", paddingTop: "20px", lineHeight: 2 }}>
                  No documents yet.<br />Upload or scrape a URL.
                </div>
              ) : (
                documents.map((doc) => (
                  <DocItem
                    key={doc.id} doc={doc}
                    selected={selectedDocs.includes(doc.id)}
                    onToggle={() => setSelectedDocs((prev) => prev.includes(doc.id) ? prev.filter((d) => d !== doc.id) : [...prev, doc.id])}
                    onDelete={async (id) => {
                      await fetch(`/api/documents/${id}`, { method: "DELETE" });
                      setSelectedDocs((prev) => prev.filter((d) => d !== id));
                      fetchDocs();
                    }}
                  />
                ))
              )}
            </div>
          </div>

          {/* Filter info */}
          {documents.length > 0 && (
            <div style={{ padding: "10px 14px", borderTop: "1px solid #0a1828" }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", color: "#0f1e35", lineHeight: 1.7 }}>
                {selectedDocs.length === 0 ? "✦ Searching all documents" : `✦ Filtering to ${selectedDocs.length} selected`}
              </div>
            </div>
          )}
        </div>

        {/* ── RESIZE HANDLE ── */}
        <ResizeHandle onMouseDown={onMouseDown} isDragging={isDragging} />

        {/* ── CHAT ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", pointerEvents: isDragging ? "none" : "auto" }}>

          {/* Header */}
          <div style={{ padding: "14px 22px", borderBottom: "1px solid #0a1828", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: "15px", fontWeight: 600, color: "#c5daf0" }}>Ask your documents</div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9.5px", color: "#0f1e35", marginTop: "2px" }}>
                {hasPage ? `${documents.length} indexed · ${currentProvider.chatModel} + RAG` : "Upload a document or URL to start"}
              </div>
            </div>
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#142236", background: "none", border: "1px solid #0a1828", borderRadius: "5px", padding: "5px 10px", cursor: "pointer" }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "22px 22px 10px" }}>
            {!messages.length && !isStreaming && (
              <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "14px" }}>
                <div style={{ fontSize: "40px", opacity: 0.04 }}>◈</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: "#0d1f35", textAlign: "center", lineHeight: 2.2 }}>
                  Upload documents or paste a URL<br />
                  Select an AI provider + API key<br />
                  Ask anything ↓
                </div>
                {hasPage && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center", maxWidth: "460px", marginTop: "4px" }}>
                    {["Summarize the main topics", "What are the key concepts?", "List all important points", "Explain the introduction"].map((q) => (
                      <button key={q} onClick={() => setInput(q)} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: "#1e3a5f", background: "#060c18", border: "1px solid #0a1828", borderRadius: "20px", padding: "6px 12px", cursor: "pointer" }}>
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {messages.map((m, i) => <Message key={i} msg={m} />)}

            {isStreaming && (
              streamText ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", marginBottom: "20px" }}>
                  <div style={{ maxWidth: "82%", background: "#07111e", border: "1px solid #0a1828", borderRadius: "4px 14px 14px 14px", padding: "11px 15px" }}>
                    <div className="md" dangerouslySetInnerHTML={{ __html: md(streamText) }} />
                    <span style={{ display: "inline-block", width: "2px", height: "13px", background: currentProvider.color, animation: "blink .8s infinite", marginLeft: "2px", verticalAlign: "text-bottom" }} />
                  </div>
                  {streamSources.length > 0 && (
                    <div style={{ maxWidth: "82%", width: "100%", marginTop: "7px" }}>
                      <div style={{ fontSize: "9.5px", color: "#142236", fontFamily: "'IBM Plex Mono', monospace", marginBottom: "4px" }}>SOURCES ({streamSources.length})</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        {streamSources.map((s, i) => <SourceCard key={i} source={s} index={i} />)}
                      </div>
                    </div>
                  )}
                </div>
              ) : <Dots />
            )}

            <div ref={bottomRef} />
          </div>

          {/* Error */}
          {error && (
            <div style={{ margin: "0 22px 8px", padding: "9px 13px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "8px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: "#ef4444", display: "flex", justifyContent: "space-between" }}>
              <span>{error}</span>
              <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}>×</button>
            </div>
          )}

          {/* Input */}
          <div style={{ padding: "12px 22px 18px" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-end", background: "#060c18", border: "1px solid #0a1828", borderRadius: "12px", padding: "10px 12px" }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isStreaming || !hasPage}
                placeholder={!hasPage ? "Add a document first…" : `Ask anything… (Enter to send)`}
                rows={1}
                style={{
                  flex: 1, background: "transparent", border: "none",
                  color: "#c5daf0", fontSize: "14px", fontFamily: "'Fraunces', serif",
                  lineHeight: 1.6, resize: "none", maxHeight: "120px", overflowY: "auto",
                }}
                onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
              />
              <button
                onClick={handleSend}
                disabled={isStreaming || !input.trim() || !hasPage}
                style={{
                  width: "36px", height: "36px", borderRadius: "8px", border: "none",
                  background: isStreaming || !input.trim() || !hasPage ? "#0a1828" : `linear-gradient(135deg, ${currentProvider.color}90, ${currentProvider.color})`,
                  color: isStreaming || !input.trim() || !hasPage ? "#142236" : "#fff",
                  cursor: isStreaming || !input.trim() || !hasPage ? "not-allowed" : "pointer",
                  fontSize: "15px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {isStreaming
                  ? <span style={{ width: "12px", height: "12px", border: `2px solid #142236`, borderTop: `2px solid ${currentProvider.color}`, borderRadius: "50%", animation: "spin .8s linear infinite" }} />
                  : "↑"
                }
              </button>
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", color: "#0a1828", textAlign: "center", marginTop: "6px" }}>
              Shift+Enter for new line · answers grounded in your documents
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── SSE stream reader helper ─────────────────────────────────────────────────
async function readSSE(response, onEvent) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try { onEvent(JSON.parse(line.slice(6))); } catch (_) {}
    }
  }
}