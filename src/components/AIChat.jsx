
import { useState, useEffect, useRef } from 'react';

import {
  X,
  Send,
  Sparkles,
  RotateCcw,
  AlertCircle
} from 'lucide-react';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import './AIChat.css';


// ==========================================
// BACKEND CONFIGURATION
// ==========================================

const API_URL = (
  import.meta.env.VITE_API_URL ||
  'http://127.0.0.1:8000'
).replace(/\/$/, '');


// ==========================================
// INITIAL CHAT MESSAGE
// ==========================================

const welcomeMessage = {
  id: 1,
  role: 'assistant',
  content:
    "Welcome! I'm PARTH.AI, Parth Patkar's AI portfolio assistant. Ask me about his projects, skills, education, or experience."
};

const suggestions = [
  'Tell me about Parth',
  'What are his technical skills?',
  'Show me his projects',
  'What is his professional experience?'
];


// ==========================================
// CHATBOT COMPONENT
// ==========================================

export default function AIChat({ isOpen, onClose }) {

  const [messages, setMessages] = useState([
    welcomeMessage
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamStatus, setStreamStatus] = useState('');
  const [error, setError] = useState('');

  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const controllerRef = useRef(null);
  const nextIdRef = useRef(2);


  // ==========================================
  // AUTOMATIC CHAT SCROLLING
  // ==========================================

  useEffect(() => {
    if (!isOpen) return;

    const container = messagesContainerRef.current;

    if (container) {
      container.scrollTop = container.scrollHeight;
    }

  }, [messages, loading, streamStatus, isOpen]);


  // ==========================================
  // INPUT FOCUS
  // ==========================================

  useEffect(() => {
    if (isOpen && !loading) {
      inputRef.current?.focus();
    }
  }, [isOpen, loading]);


  // ==========================================
  // CANCEL REQUEST WHEN CHAT CLOSES
  // ==========================================

  useEffect(() => {
    if (!isOpen) {
      controllerRef.current?.abort();
      controllerRef.current = null;
    }
  }, [isOpen]);


  // ==========================================
  // CLEANUP WHEN COMPONENT UNMOUNTS
  // ==========================================

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
      controllerRef.current = null;
    };
  }, []);


  // ==========================================
  // SEND MESSAGE — STREAMING RAG
  // ==========================================

  async function sendMessage(text) {

    const question = text.trim();

    if (!question || loading) return;

    
// ==========================================
// STEP 9B — COLLECT CONVERSATION HISTORY
// ==========================================

// Exclude the initial welcome message.
// Include only completed user/assistant messages.
    const conversationHistory = messages
      .filter(message =>
        message.id !== welcomeMessage.id &&
        !message.streaming &&
        message.content.trim() !== ''
      )
      .slice(-10)
      .map(message => ({
        role: message.role,
        content: message.content.slice(0, 2000)
      }));


    setInput('');
    setError('');
    setLoading(true);
    setStreamStatus('Connecting to PARTH.AI...');

    // Show the visitor's question
    const userMessage = {
      id: nextIdRef.current++,
      role: 'user',
      content: question
    };

    // Create an empty assistant message
    const assistantId = nextIdRef.current++;

    const assistantMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      sources: [],
      streaming: true
    };

    setMessages(previous => [
      ...previous,
      userMessage,
      assistantMessage
    ]);

    const controller = new AbortController();
    controllerRef.current = controller;

    let fullAnswer = '';

    // Add text to the current AI message
    function appendToken(token) {

      if (controllerRef.current !== controller) {
        return;
      }

      fullAnswer += token;

      setMessages(previous =>
        previous.map(message =>
          message.id === assistantId
            ? {
                ...message,
                content: fullAnswer
              }
            : message
        )
      );
    }

    try {

      // =====================================
      // CONNECT TO FASTAPI STREAM
      // =====================================

      const response = await fetch(
        `${API_URL}/chat/stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream'
          },
          body: JSON.stringify({
            question,
            history: conversationHistory
          }),
          signal: controller.signal
        }
      );

      if (!response.ok) {
        throw new Error(
          `Server returned HTTP ${response.status}`
        );
      }

      if (!response.body) {
        throw new Error(
          'Streaming is not supported by this response.'
        );
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      let buffer = '';
      let completed = false;

      // =====================================
      // PROCESS ONE SSE EVENT
      // =====================================

      function processEvent(eventText) {

        const dataLines = eventText
          .split(/\r?\n/)
          .filter(line => line.startsWith('data:'))
          .map(line => line.slice(5).trimStart());

        if (dataLines.length === 0) return;

        const event = JSON.parse(
          dataLines.join('\n')
        );

        if (event.type === 'status') {

          setStreamStatus(event.message || 'Thinking...');
        
        
        } else if (event.type === 'sources') {

          const sources = Array.isArray(event.files)
            ? event.files.filter(
                file => typeof file === 'string'
              )
            : [];

          setMessages(previous =>
            previous.map(message =>
              message.id === assistantId
                ? {
                    ...message,
                    sources
                  }
                : message
            )
          );

        } else if (event.type === 'token') {

          setStreamStatus('');

          appendToken(event.text || '');

        } else if (event.type === 'done') {

          completed = true;

        } else if (event.type === 'error') {

          throw new Error(
            event.message || 'AI generation failed.'
          );
        }
      }

      // =====================================
      // READ STREAM CHUNKS
      // =====================================

      while (true) {

        const { done, value } = await reader.read();

        if (controllerRef.current !== controller) {
          break;
        }

        if (done) {
          buffer += decoder.decode();
          break;
        }

        buffer += decoder.decode(value, {
          stream: true
        });

        // SSE events are separated by blank lines
        let boundary = buffer.match(/\r?\n\r?\n/);

        while (boundary) {

          const eventText = buffer.slice(
            0,
            boundary.index
          );

          buffer = buffer.slice(
            boundary.index + boundary[0].length
          );

          processEvent(eventText);

          if (completed) break;

          boundary = buffer.match(/\r?\n\r?\n/);
        }

        if (completed) {
          await reader.cancel();
          break;
        }
      }

      // Process any final complete event
      if (
        !completed &&
        buffer.trim() &&
        controllerRef.current === controller
      ) {
        processEvent(buffer);
      }

      if (
        controllerRef.current === controller &&
        !completed
      ) {
        throw new Error(
          'The response stream ended unexpectedly.'
        );
      }

      if (
        controllerRef.current === controller &&
        !fullAnswer.trim()
      ) {
        throw new Error(
          'PARTH.AI returned an empty response.'
        );
      }

    } catch (err) {

      if (err.name !== 'AbortError' &&
          controllerRef.current === controller) {

        console.error('PARTH.AI streaming error:', err);

        setError(
          'PARTH.AI could not complete the response. Please try again.'
        );

        if (!fullAnswer) {

          setMessages(previous =>
            previous.filter(
              message => message.id !== assistantId
            )
          );

        }
      }

    } finally {

      if (controllerRef.current === controller) {

        controllerRef.current = null;

        setLoading(false);
        setStreamStatus('');

        setMessages(previous =>
          previous.map(message =>
            message.id === assistantId
              ? { ...message, streaming: false }
              : message
          )
        );
      }
    }
  }


  // ==========================================
  // RESET CONVERSATION
  // ==========================================

  function resetChat() {

    controllerRef.current?.abort();
    controllerRef.current = null;

    setMessages([welcomeMessage]);
    setInput('');
    setLoading(false);
    setStreamStatus('');
    setError('');
  }


  // ==========================================
  // HANDLE FORM SUBMISSION
  // ==========================================

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage(input);
  }


  // ==========================================
  // CHAT WINDOW
  // ==========================================

  if (!isOpen) return null;

  return (
    <section
      id="parth-ai-chat"
      className="ai-chat-window"
      aria-label="PARTH AI chatbot"
    >

      {/* CHAT HEADER */}

      <header className="ai-chat-header">

        <div className="ai-chat-brand">

          <div className="ai-chat-avatar">
            <Sparkles size={21} />
          </div>

          <div className="ai-chat-brand-info">

            <h3>PARTH.AI</h3>

            <span>
              <i className="ai-chat-status-dot" />
              RAG PORTFOLIO ASSISTANT
            </span>

          </div>
        </div>


        <div className="ai-chat-header-actions">

          <button
            type="button"
            onClick={resetChat}
            title="Reset conversation"
            aria-label="Reset conversation"
          >
            <RotateCcw size={17} />
          </button>

          <button
            type="button"
            onClick={onClose}
            title="Close chatbot"
            aria-label="Close chatbot"
          >
            <X size={19} />
          </button>

        </div>

      </header>


      {/* CHAT MESSAGES */}

      <div
        ref={messagesContainerRef}
        className="ai-chat-messages"
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
      >

        {messages.map(message => (

          <div
            key={message.id}
            className={
              `ai-chat-message ai-chat-${message.role}`
            }
          >

            {message.role === 'assistant' && (
              <span className="ai-chat-message-label">
                PARTH.AI
              </span>
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
                    <span
                      className="ai-stream-cursor"
                      aria-hidden="true"
                    />
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

                  <span className="ai-chat-sources-heading">
                    RETRIEVED SOURCES
                  </span>

                  <div className="ai-chat-source-list">

                    {message.sources.map(source => (

                      <span
                        className="ai-chat-source"
                        key={source}
                        title={source}
                      >
                        {source}
                      </span>

                    ))}

                  </div>

                </div>
              )}


          </div>

        ))}


        {/* QUICK QUESTIONS */}

        {messages.length === 1 && (

          <div className="ai-chat-suggestions">

            <p>QUICK QUESTIONS</p>

            {suggestions.map(question => (

              <button
                key={question}
                type="button"
                disabled={loading}
                onClick={() => sendMessage(question)}
              >
                {question}
              </button>

            ))}

          </div>

        )}


        {/* LIVE STATUS */}

        {loading && (

          <div
            className="ai-chat-stream-status"
            role="status"
          >

            <span className="ai-stream-status-dot" />

            {streamStatus || 'PARTH.AI is responding...'}

          </div>

        )}


        {/* ERROR */}

        {error && (

          <div
            className="ai-chat-error"
            role="alert"
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>

        )}

      </div>


      {/* CHAT INPUT */}

      <form
        className="ai-chat-input-area"
        onSubmit={handleSubmit}
      >

        <div className="ai-chat-input-wrap">

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={event =>
              setInput(event.target.value)
            }
            placeholder={
              loading
                ? 'PARTH.AI is responding...'
                : 'Ask me about Parth...'
            }
            aria-label="Your message"
            maxLength={500}
            disabled={loading}
          />

          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Send message"
          >
            <Send size={18} />
          </button>

        </div>

        <p className="ai-chat-disclaimer">
          PARTH.AI · LANGCHAIN + RAG + GROQ
        </p>

      </form>

    </section>
  );
}
