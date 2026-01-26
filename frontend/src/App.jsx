import { useEffect, useRef, useState } from "react";
import "./App.css";

function App() {
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]); // {role, content, sources?}
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const askQuestion = async () => {
    if (!question.trim()) {
      setError("Please enter a question");
      return;
    }

    const currentQuestion = question.trim();
    setQuestion("");
    setLoading(true);
    setError("");

    // Add user message
    setMessages((prev) => [
      ...prev,
      { role: "user", content: currentQuestion },
    ]);

    try {
      const response = await fetch(`${API_BASE_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: currentQuestion }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => null);
        const detail = errJson?.detail ? `: ${errJson.detail}` : "";
        throw new Error(`Backend error${detail}`);
      }

      const data = await response.json();
      console.log("Backend response:", data);

      let assistantMessage = {
        role: "assistant",
        content: "",
        sources: data.sources || [],
        rawData: data,
      };

      if (data.answer) {
        assistantMessage.content = data.answer;
      } else if (data.matches && Array.isArray(data.matches) && data.matches.length > 0) {
        const matchesText = data.matches
          .map(
            (match, idx) =>
              `${idx + 1}. ${match.sop_name}\n${match.chunk}`
          )
          .join("\n\n---\n\n");

        assistantMessage.content = matchesText;
        assistantMessage.sources = data.matches.map((m) => m.sop_name);
      } else {
        assistantMessage.content = JSON.stringify(data, null, 2);
      }

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err?.message || "Failed to connect to backend");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            err?.message || "There was an error connecting to the backend.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading) askQuestion();
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Investigator Site Query Assistant</h1>
        <p>Ask SOP-related questions and get answers grounded in your documents.</p>
      </header>

      <main className="chat-container">
        <div className="chat-window">
          {messages.length === 0 && (
            <div className="chat-empty">
              <p>
                Start by asking a question about study procedures, safety, or
                other SOP topics.
              </p>
            </div>
          )}

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`chat-message ${
                msg.role === "user" ? "user" : "assistant"
              }`}
            >
              <div className="chat-bubble">
                <div className="chat-role">
                  {msg.role === "user" ? "You" : "Assistant"}
                </div>

                <div className="chat-content">
                  <pre
                    style={{
                      whiteSpace: "pre-wrap",
                      wordWrap: "break-word",
                      fontFamily: "inherit",
                    }}
                  >
                    {msg.content || "No content"}
                  </pre>
                </div>

                {msg.role === "assistant" && msg.sources?.length > 0 && (
                  <div className="chat-meta">
                    <strong>Sources:</strong> {msg.sources.join(", ")}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="chat-message assistant">
              <div className="chat-bubble">
                <div className="chat-role">Assistant</div>
                <div className="chat-content">
                  Thinking based on relevant SOPs...
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="input-panel">
          <textarea
            rows="3"
            className="question-input"
            placeholder="Type your SOP-related question here. Press Enter to send, Shift+Enter for a new line."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <div className="input-actions">
            {error && <span className="error-text">{error}</span>}
            <button onClick={askQuestion} disabled={loading}>
              {loading ? "Searching SOPs..." : "Ask"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
