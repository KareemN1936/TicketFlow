import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { aiService } from "../services/aiService";
import { getApiErrorMessage } from "../utils/apiError";
import TicketIcon from "./TicketIcon";

const starterMessage = {
  role: "assistant",
  content: "Hi! I’m the TicketFlow assistant. Tell me what’s going wrong and I’ll help you troubleshoot or prepare a support ticket.",
};

const quickPrompts = [
  "My computer is running slowly",
  "I can’t connect to Wi-Fi",
  "Help me write a support ticket",
];

function AiChatWidget() {
  const { user } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const [messages, setMessages] = useState([starterMessage]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const widgetWindowRef = useRef(null);
  const dragRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const isPublicPage = ["/", "/login", "/forgot-password", "/reset-password", "/unauthorized"].includes(location.pathname);
  const widgetWindowStyle = position ? { position: "fixed", left: `${position.x}px`, top: `${position.y}px` } : undefined;

  const clampPosition = useCallback((x, y) => {
    const widgetWindow = widgetWindowRef.current;
    const width = widgetWindow?.offsetWidth || 0;
    const height = widgetWindow?.offsetHeight || 0;
    const maxX = Math.max(8, window.innerWidth - width - 8);
    const maxY = Math.max(8, window.innerHeight - height - 8);

    return {
      x: Math.min(Math.max(8, x), maxX),
      y: Math.min(Math.max(8, y), maxY),
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [isOpen, messages, loading]);

  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === "Escape") setIsOpen(false);
    }

    function openFromTopbar() {
      setIsOpen(true);
    }

    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("ticketflow:open-ai-assistant", openFromTopbar);

    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("ticketflow:open-ai-assistant", openFromTopbar);
    };
  }, []);

  useEffect(() => {
    function keepWidgetInView() {
      setPosition((current) => current ? clampPosition(current.x, current.y) : current);
    }

    window.addEventListener("resize", keepWidgetInView);
    return () => window.removeEventListener("resize", keepWidgetInView);
  }, [clampPosition]);

  function startDrag(event) {
    if (event.button !== 0 || event.target.closest("button")) return;

    const widgetWindow = widgetWindowRef.current;
    if (!widgetWindow) return;

    const rect = widgetWindow.getBoundingClientRect();
    dragRef.current = {
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    setPosition({ x: rect.left, y: rect.top });
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event) {
    if (!dragRef.current) return;

    const nextX = event.clientX - dragRef.current.offsetX;
    const nextY = event.clientY - dragRef.current.offsetY;
    setPosition(clampPosition(nextX, nextY));
  }

  function stopDrag(event) {
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  async function sendMessage(messageText) {
    const message = messageText.trim();
    if (!message || loading) return;

    setMessages((current) => [...current, { role: "user", content: message }]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const response = await aiService.chat(message);
      setMessages((current) => [...current, { role: "assistant", content: response.content }]);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "The AI assistant is unavailable right now."));
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage(input);
  }

  if (!user || isPublicPage) return null;

  return (
    <div className={`ai-widget${isOpen ? " ai-widget-open" : ""}`}>
      {isOpen && (
        <section className="ai-widget-window" ref={widgetWindowRef} style={widgetWindowStyle} aria-label="TicketFlow AI Assistant">
          <header className="ai-widget-header" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={stopDrag} onPointerCancel={stopDrag}>
            <span className="ai-widget-bot-avatar"><TicketIcon name="sparkles" size={20} /></span>
            <div>
              <strong>TicketFlow Assistant</strong>
              <span><i /> AI support is online</span>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Minimize AI Assistant">−</button>
          </header>

          <div className="ai-widget-messages" aria-live="polite">
            {messages.map((message, index) => (
              <article className={`ai-widget-message ai-widget-message-${message.role}`} key={`${message.role}-${index}`}>
                {message.role === "assistant" && <span className="ai-widget-message-avatar"><TicketIcon name="sparkles" size={14} /></span>}
                <p>{message.content}</p>
              </article>
            ))}

            {messages.length === 1 && (
              <div className="ai-widget-suggestions">
                <span>Try asking:</span>
                {quickPrompts.map((prompt) => <button type="button" key={prompt} onClick={() => sendMessage(prompt)}>{prompt}</button>)}
              </div>
            )}

            {loading && <div className="ai-widget-typing" aria-label="Assistant is typing"><i /><i /><i /></div>}
            <div ref={messagesEndRef} />
          </div>

          {error && <div className="ai-widget-error" role="alert">{error}</div>}

          <form className="ai-widget-composer" onSubmit={handleSubmit}>
            <textarea ref={inputRef} rows="1" value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(input); } }} placeholder="Type your message…" maxLength="4000" />
            <button type="submit" disabled={loading || !input.trim()} aria-label="Send message"><TicketIcon name="send" size={18} /></button>
          </form>
          <small className="ai-widget-disclaimer">AI can make mistakes. Verify important instructions.</small>
        </section>
      )}

      <button className="ai-widget-launcher" type="button" onClick={() => setIsOpen((current) => !current)} aria-label={isOpen ? "Close AI Assistant" : "Open AI Assistant"} aria-expanded={isOpen}>
        {isOpen ? <span aria-hidden="true">×</span> : <><TicketIcon name="sparkles" size={24} /><span className="ai-widget-launcher-label">Ask AI</span></>}
      </button>
    </div>
  );
}

export default AiChatWidget;
