import { useEffect, useRef, useState } from "react";
import "../App.css";
import logo from "../assets/agilisium-logo.jpeg";
import { Link } from "react-router-dom"; // Actually, maybe we don't need a link here unless requested, but good to have access

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// --- Icons ---
const SendIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2" />
    </svg>
);

const FileIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
    </svg>
);

const ThumbUpIcon = ({ active }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
);

const ThumbDownIcon = ({ active }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
        <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
    </svg>
);

const Typewriter = ({ text, onComplete }) => {
    const [displayedText, setDisplayedText] = useState("");
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (index < text.length) {
            const timeout = setTimeout(() => {
                setDisplayedText((prev) => prev + text.charAt(index));
                setIndex((prev) => prev + 1);
            }, 10); // Adjust speed here (lower is faster)
            return () => clearTimeout(timeout);
        } else {
            if (onComplete) onComplete();
        }
    }, [index, text, onComplete]);

    return <div>{displayedText}</div>;
};

const LoadingSteps = () => {
    const steps = [
        "Understanding the question...",
        "Identifying intent...",
        "Understanding context...",
        "Searching documents...",
        "Retrieving relevant chunks...",
        "Synthesizing answer...",
        "Formatting response..."
    ];
    const [stepIndex, setStepIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setStepIndex((prev) => {
                if (prev < steps.length - 1) {
                    return prev + 1;
                }
                return prev; // Stop at the last step
            });
        }, 3000); // Update every 3 seconds for a more realistic flow

        return () => clearInterval(interval);
    }, []);

    return <div className="thinking-indicator">{steps[stepIndex]}</div>;
};

function ChatPage() {
    const [question, setQuestion] = useState("");
    const [messages, setMessages] = useState(() => {
        const saved = sessionStorage.getItem("chat_messages");
        return saved ? JSON.parse(saved) : [];
    });
    const [loading, setLoading] = useState(false);
    const [activeCitations, setActiveCitations] = useState(null); // { index: number, data: any[] } | null
    const bottomRef = useRef(null);

    const dateStr =
        new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        }) +
        " at " +
        new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    useEffect(() => {
        // We don't want to save "isStreaming" to session storage, so we strip it out
        const messagesToSave = messages.map(msg => {
            const { isStreaming, ...rest } = msg;
            return rest;
        });
        sessionStorage.setItem("chat_messages", JSON.stringify(messagesToSave));
    }, [messages]);


    const askQuestion = async () => {
        if (!question.trim()) return;

        const q = question.trim();
        setQuestion("");
        setLoading(true);
        // Close citations when asking new question
        setActiveCitations(null);

        setMessages((prev) => [...prev, { role: "user", content: q }]);

        try {
            const res = await fetch(`${API_BASE_URL}/ask`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: q }),
            });

            const data = await res.json();

            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: data.answer,
                    sources: data.sources,
                    citations: data.citations,
                    liked: null,
                    feedback: "",
                    feedbackSubmitted: false,
                    feedbackSkipped: false,
                    showEvidence: false,
                    isStreaming: true, // Enable streaming for this new message
                },
            ]);
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "Sorry, something went wrong.",
                    liked: null,
                    feedback: "",
                    feedbackSubmitted: false,
                    feedbackSkipped: false,
                    showEvidence: false,
                    isStreaming: false,
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleStreamingComplete = (index) => {
        setMessages((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], isStreaming: false };
            return updated;
        });
    };

    const saveInteraction = async (msg, index, likedOverride = null) => {
        await fetch(`${API_BASE_URL}/save-interaction`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                question: messages[index - 1]?.content || "",
                answer: msg.content,
                sources: msg.sources || [],
                citations: msg.citations || [],
                liked: likedOverride,
                feedback: msg.feedback || null,
            }),
        });
    };

    const toggleLike = async (index, value) => {
        const updated = [...messages];
        updated[index].liked = updated[index].liked === value ? null : value;
        updated[index].feedbackSubmitted = false;
        updated[index].feedbackSkipped = false;
        setMessages(updated);
        await saveInteraction(updated[index], index, updated[index].liked);
    };

    const submitFeedback = async (index) => {
        const updated = [...messages];
        updated[index].feedbackSubmitted = true;
        setMessages(updated);
        await saveInteraction(updated[index], index, false);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            askQuestion();
        }
    };

    return (
        <div className="app-container">
            {/* HEADER */}
            <header className="app-header">
                <div className="header-left">
                    <img src={logo} alt="Logo" className="logo" />
                    <div className="chatbot-title">
                        <div className="chatbot-name">Clinical SOP Assistant</div>
                        <div className="chatbot-tagline">
                            Structured answers from validated documents
                        </div>
                    </div>
                </div>
                <span className="date-text">{dateStr}</span>
            </header>

            {/* MAIN CONTENT WRAPPER */}
            <div className="main-content">
                {/* CHAT */}
                <main className={`chat-container ${activeCitations ? "shrink" : ""}`}>
                    <div className="chat-window">
                        {messages.map((msg, i) => (
                            <div key={i} className={`chat-message ${msg.role}`}>
                                <div className="chat-bubble">
                                    {msg.role === "assistant" && msg.isStreaming ? (
                                        <Typewriter
                                            text={msg.content}
                                            onComplete={() => handleStreamingComplete(i)}
                                        />
                                    ) : (
                                        msg.content
                                    )}
                                </div>

                                {msg.role === "assistant" && !msg.isStreaming && (
                                    <div style={{ width: "100%" }}>
                                        {msg.citations?.length > 0 && (
                                            <button
                                                className={`evidence-toggle-btn ${activeCitations?.index === i ? "active" : ""}`}
                                                onClick={() => {
                                                    if (activeCitations?.index === i) {
                                                        setActiveCitations(null);
                                                    } else {
                                                        setActiveCitations({ index: i, data: msg.citations });
                                                    }
                                                }}
                                            >
                                                <FileIcon />
                                                {activeCitations?.index === i ? "Hide Evidence" : "View Evidence"}
                                            </button>
                                        )}

                                        <div className="feedback-section">
                                            <button
                                                className={`feedback-btn up ${msg.liked === true ? "active" : ""}`}
                                                onClick={() => toggleLike(i, true)}
                                            >
                                                <ThumbUpIcon active={msg.liked === true} />
                                            </button>
                                            <button
                                                className={`feedback-btn down ${msg.liked === false ? "active" : ""}`}
                                                onClick={() => toggleLike(i, false)}
                                            >
                                                <ThumbDownIcon active={msg.liked === false} />
                                            </button>
                                        </div>

                                        {msg.liked === false &&
                                            !msg.feedbackSubmitted &&
                                            !msg.feedbackSkipped && (
                                                <div className="feedback-form">
                                                    <textarea
                                                        className="feedback-input"
                                                        placeholder="Your feedback..."
                                                        value={msg.feedback}
                                                        onChange={(e) => {
                                                            const updated = [...messages];
                                                            updated[i].feedback = e.target.value;
                                                            setMessages(updated);
                                                        }}
                                                        rows={2}
                                                    />

                                                    <div style={{ display: "flex", gap: "10px" }}>
                                                        <button
                                                            className="feedback-submit-btn"
                                                            onClick={() => submitFeedback(i)}
                                                        >
                                                            Submit Feedback
                                                        </button>

                                                        <button
                                                            className="feedback-skip-btn"
                                                            onClick={() => {
                                                                const updated = [...messages];
                                                                updated[i].feedbackSkipped = true;
                                                                setMessages(updated);
                                                                saveInteraction(updated[i], i, false);
                                                            }}
                                                        >
                                                            Skip
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                        {msg.feedbackSubmitted && (
                                            <div style={{ fontSize: "12px", color: "#059669", marginTop: "8px" }}>
                                                Thanks for your feedback!
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}

                        {loading && <LoadingSteps />}
                        <div ref={bottomRef} />
                    </div>

                    {/* CHAT INPUT AREA */}
                    <div className="input-panel">
                        <div className="input-wrapper">
                            <textarea
                                className="chat-input"
                                placeholder="Type your query..."
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                onKeyDown={handleKeyDown}
                                rows={1}
                            />
                            <button className="send-btn" onClick={askQuestion}>
                                <SendIcon />
                            </button>
                        </div>
                    </div>
                </main>

                {/* EVIDENCE SIDE PANEL */}
                {activeCitations && (
                    <aside className="evidence-side-panel">
                        <div className="side-panel-header">
                            <h3>Evidence & Citations</h3>
                            <button className="close-panel-btn" onClick={() => setActiveCitations(null)}>×</button>
                        </div>
                        <div className="side-panel-content">
                            {activeCitations.data.map((c, idx) => (
                                <div key={idx} className="evidence-card">
                                    <div className="evidence-header">
                                        <div className="evidence-header-left">
                                            <FileIcon />
                                            <span>{c.file_name || "Document"}</span>
                                        </div>
                                    </div>
                                    <div className="evidence-content">
                                        "{c.text}"
                                    </div>
                                </div>
                            ))}
                        </div>
                    </aside>
                )}
            </div>
        </div>
    );
}

export default ChatPage;
