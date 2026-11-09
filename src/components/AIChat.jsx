import { useEffect, useRef, useState } from 'react';
import { X, Send, Sparkles, RotateCcw, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './AIChat.css';

// Set VITE_API_URL in .env.local for local development and in GitHub
// Actions variables for the deployed website.
const API_URL = (
  import.meta.env.VITE_API_URL ||
  'https://parth-portfolio-r152.onrender.com'
).replace(/\/$/, '');

const HEALTH_ATTEMPTS = 5;
const HEALTH_TIMEOUT_MS = 30000;
const HEALTH_RETRY_DELAY_MS = 5000;
const STREAM_IDLE_TIMEOUT_MS = 90000;

const welcomeMessage = {
  id: 1,
  role: 'assistant',
  content:
    "Welcome! I'm PARTH.AI, Parth Patkar's AI portfolio assistant. Ask me about his projects, skills, education, or experience.",
};

const suggestions = [
  'Tell me about Parth',
  'What are his technical skills?',
  'Show me his projects',
  'What is his professional experience?',
];

export default function AIChat({ isOpen, onClose }) {
  const [messages, setMessages] = useState([welcomeMessage]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamStatus, setStreamStatus] = useState('');
  const [error, setError] = useState('');
  const [backendStatus, setBackendStatus] = useState('waking');
  const [wakeAttempt, setWakeAttempt] = useState(0);

  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const controllerRef = useRef(null);
  const nextIdRef = useRef(2);

  // Start the Render Free backend automatically when this component mounts.
  // Every request has its OWN AbortController, so a timeout doesn't break
  // all subsequent attempts. This is bounded; no paid keep-alive service.
  useEffect(() => {
    let cancelled = false;
    let activeController = null;
    let retryTimer = null;
    let resolveDelay = null;

    const waitForRetry = () =>
      new Promise((resolve) => {
        resolveDelay = resolve;
        retryTimer = setTimeout(() => {
          retryTimer = null;
          resolveDelay = null;
          resolve();
        }, HEALTH_RETRY_DELAY_MS);
      });

    async function checkBackend() {
      setBackendStatus('waking');

      for (let attempt = 1; attempt <= HEALTH_ATTEMPTS; attempt += 1) {
        if (cancelled) return;

        const controller = new AbortController();
        activeController = controller;
        const timeoutId = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

        try {
          const response = await fetch(`${API_URL}/health`, {
            method: 'GET',
            cache: 'no-store',
            signal: controller.signal,
          });
          if (!response.ok) throw new Error(`Health check HTTP ${response.status}`);
          if (!cancelled) setBackendStatus('ready');
          return;
        } catch (err) {
          if (cancelled) return;
          console.warn(`PARTH.AI health check ${attempt} failed:`, err);
        } finally {
          clearTimeout(timeoutId);
          if (activeController === controller) activeController = null;
        }

        if (attempt < HEALTH_ATTEMPTS) await waitForRetry();
      }

      if (!cancelled) setBackendStatus('error');
    }

    checkBackend();

    return () => {
      cancelled = true;
      activeController?.abort();
      if (retryTimer !== null) clearTimeout(retryTimer);
      resolveDelay?.();
    };
  }, [wakeAttempt]);

  useEffect(() => {
    if (isOpen && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, loading, streamStatus, backendStatus, isOpen]);

  useEffect(() => {
    if (isOpen && !loading && backendStatus === 'ready') {
      inputRef.current?.focus();
    }
  }, [isOpen, loading, backendStatus]);

  useEffect(() => {
    if (!isOpen && controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
      setLoading(false);
      setStreamStatus('');
      setMessages((previous) =>
        previous
          .filter((message) => !message.streaming || message.content.trim())
          .map((message) => ({ ...message, streaming: false }))
      );
    }
  }, [isOpen]);

  useEffect(() => () => controllerRef.current?.abort(), []);

  async function sendMessage(text) {
    const question = text.trim();
    if (!question || loading || backendStatus !== 'ready') return;

    const conversationHistory = messages
      .filter(
        (message) =>
          message.id !== welcomeMessage.id &&
          !message.streaming &&
          message.content.trim() !== ''
      )
      .slice(-10)
      .map((message) => ({
        role: message.role,
        content: message.content.slice(0, 2000),
      }));

    const userMessage = {
      id: nextIdRef.current++,
      role: 'user',
      content: question,
    };
    const assistantId = nextIdRef.current++;
    const assistantMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      sources: [],
      streaming: true,
    };

    setInput('');
    setError('');
    setLoading(true);
    setStreamStatus('Connecting to PARTH.AI...');
    setMessages((previous) => [...previous, userMessage, assistantMessage]);

    const controller = new AbortController();
    controllerRef.current = controller;
    let fullAnswer = '';
    let timedOut = false;
    let idleTimer = null;

    function resetStreamTimer() {
      if (idleTimer !== null) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, STREAM_IDLE_TIMEOUT_MS);
    }

    function appendToken(token) {
      if (controllerRef.current !== controller) return;
      fullAnswer += token;
      setMessages((previous) =>
        previous.map((message) =>
          message.id === assistantId
            ? { ...message, content: fullAnswer }
            : message
        )
      );
    }

    try {
      resetStreamTimer();
      const response = await fetch(`${API_URL}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({ question, history: conversationHistory }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`Server returned HTTP ${response.status}`);
      if (!response.body) throw new Error('The response does not support streaming.');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let completed = false;

      function processEvent(eventText) {
        const dataLines = eventText
          .split(/\r?\n/)
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5).trimStart());
        if (!dataLines.length) return;

        let event;
        try {
          event = JSON.parse(dataLines.join('\n'));
        } catch {
          console.warn('Ignored malformed PARTH.AI SSE event');
          return;
        }

        if (event.type === 'status') {
          setStreamStatus(event.message || 'Thinking...');
        } else if (event.type === 'sources') {
          const sources = Array.isArray(event.files)
            ? event.files.filter((file) => typeof file === 'string')
            : [];
          setMessages((previous) =>
            previous.map((message) =>
              message.id === assistantId ? { ...message, sources } : message
            )
          );
        } else if (event.type === 'token') {
          setStreamStatus('');
          appendToken(event.text || '');
        } else if (event.type === 'done') {
          completed = true;
        } else if (event.type === 'error') {
          throw new Error(event.message || 'AI generation failed.');
        }
      }

      while (!completed && controllerRef.current === controller) {
        const { done, value } = await reader.read();
        if (controllerRef.current !== controller) break;
        if (done) {
          buffer += decoder.decode();
          break;
        }

        resetStreamTimer();
        buffer += decoder.decode(value, { stream: true });
        let match = /\r?\n\r?\n/.exec(buffer);
        while (match) {
          const eventText = buffer.slice(0, match.index);
          buffer = buffer.slice(match.index + match[0].length);
          processEvent(eventText);
          if (completed) break;
          match = /\r?\n\r?\n/.exec(buffer);
        }
      }

      if (!completed && buffer.trim() && controllerRef.current === controller) {
        processEvent(buffer);
      }
      if (completed) await reader.cancel().catch(() => {});
      if (controllerRef.current === controller && !completed) {
        throw new Error('The response stream ended unexpectedly.');
      }
      if (controllerRef.current === controller && !fullAnswer.trim()) {
        throw new Error('PARTH.AI returned an empty response.');
      }
    } catch (err) {
      if (controllerRef.current === controller && (timedOut || err.name !== 'AbortError')) {
        console.error('PARTH.AI streaming error:', err);
        setError(
          timedOut
            ? 'PARTH.AI took too long to respond. Please try again.'
            : 'PARTH.AI could not complete the response. Please try again.'
        );
        if (!fullAnswer) {
          setMessages((previous) =>
            previous.filter((message) => message.id !== assistantId)
          );
        }
      }
    } finally {
      if (idleTimer !== null) clearTimeout(idleTimer);
      if (controllerRef.current === controller) {
        controllerRef.current = null;
        setLoading(false);
        setStreamStatus('');
        setMessages((previous) =>
          previous.map((message) =>
            message.id === assistantId ? { ...message, streaming: false } : message
          )
        );
      }
    }
  }

  function resetChat() {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setMessages([welcomeMessage]);
    setInput('');
    setLoading(false);
    setStreamStatus('');
    setError('');
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage(input);
  }

  if (!isOpen) return null;

  return (
    <section id="parth-ai-chat" className="ai-chat-window" aria-label="PARTH AI chatbot">
      <header className="ai-chat-header">
        <div className="ai-chat-brand">
          <div className="ai-chat-avatar"><Sparkles size={21} /></div>
          <div className="ai-chat-brand-info">
            <h3>PARTH.AI</h3>
            <span>
              <i className="ai-chat-status-dot" />
              AI PORTFOLIO ASSISTANT
            </span>
          </div>
        </div>
        <div className="ai-chat-header-actions">
          <button type="button" onClick={resetChat} title="Reset conversation" aria-label="Reset conversation">
            <RotateCcw size={17} />
          </button>
          <button type="button" onClick={onClose} title="Close chatbot" aria-label="Close chatbot">
            <X size={19} />
          </button>
        </div>
      </header>

      <div
        ref={messagesContainerRef}
        className="ai-chat-messages"
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
      >
        {messages.map((message) => (
          <div key={message.id} className={`ai-chat-message ai-chat-${message.role}`}>
            {message.role === 'assistant' && (
              <span className="ai-chat-message-label">PARTH.AI</span>
            )}
            <div className="ai-chat-bubble">
              {message.role === 'assistant' ? (
                <div className="ai-chat-markdown">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      table: ({ children, ...props }) => (
                        <div className="ai-table-scroll">
                          <table {...props}>{children}</table>
                        </div>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                  {message.streaming && (
                    <span className="ai-stream-cursor" aria-hidden="true" />
                  )}
                </div>
              ) : (
                message.content
              )}
            </div>
            {message.role === 'assistant' &&
              message.sources?.length > 0 &&
              !message.streaming && (
                <div className="ai-chat-sources">
                  <span className="ai-chat-sources-heading">RETRIEVED SOURCES</span>
                  <div className="ai-chat-source-list">
                    {message.sources.map((source) => (
                      <span className="ai-chat-source" key={source} title={source}>
                        {source}
                      </span>
                    ))}
                  </div>
                </div>
              )}
          </div>
        ))}

        {messages.length === 1 && (
          <div className="ai-chat-suggestions">
            <p>QUICK QUESTIONS</p>
            {suggestions.map((question) => (
              <button
                key={question}
                type="button"
                disabled={loading || backendStatus !== 'ready'}
                onClick={() => sendMessage(question)}
              >
                {question}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="ai-chat-stream-status" role="status">
            <span className="ai-stream-status-dot" />
            {streamStatus || 'PARTH.AI is responding...'}
          </div>
        )}

        {error && (
          <div className="ai-chat-error" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="ai-backend-status" role="status" aria-live="polite">
        {backendStatus === 'waking' && (
          <span>⏳ Waking up PARTH.AI server (free hosting)...</span>
        )}
        {backendStatus === 'ready' && (
          <span>🟢 PARTH.AI is ready</span>
        )}
        {backendStatus === 'error' && (
          <div>
            <span>Unable to connect to PARTH.AI.</span>{' '}
            <button type="button" onClick={() => setWakeAttempt((n) => n + 1)}>
              Retry Connection
            </button>
          </div>
        )}
      </div>

      <form className="ai-chat-input-area" onSubmit={handleSubmit}>
        <div className="ai-chat-input-wrap">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={
              backendStatus === 'waking'
                ? 'Waking up AI server...'
                : backendStatus === 'error'
                  ? 'Connection unavailable — retry above'
                  : loading
                    ? 'PARTH.AI is responding...'
                    : 'Ask me about Parth...'
            }
            aria-label="Your message"
            maxLength={500}
            disabled={loading || backendStatus !== 'ready'}
          />
          <button
            type="submit"
            disabled={loading || backendStatus !== 'ready' || !input.trim()}
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="ai-chat-disclaimer">
          PARTH.AI · PORTFOLIO KNOWLEDGE + GROQ
        </p>
      </form>
    </section>
  );
}
