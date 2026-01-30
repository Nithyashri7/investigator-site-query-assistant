import { useEffect, useState } from "react";
import "../App.css";
import AnalysisDashboard from "./AnalysisDashboard";
import "./FeedbackPage.css";
import logo from "../assets/agilisium-logo.jpeg";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

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

function FeedbackPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("interactions");

    useEffect(() => {
        fetch(`${API_BASE_URL}/feedback`)
            .then((res) => res.json())
            .then((resData) => {
                setData(resData);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const formatDate = (isoStr) => {
        if (!isoStr) return "-";
        return new Date(isoStr).toLocaleString();
    };

    return (
        <div className="app-container">
            {/* HEADER */}
            <header className="app-header">
                <div className="header-left">
                    <img src={logo} alt="Logo" className="logo" />
                    <div className="chatbot-title">
                        <div className="chatbot-name">Clinical SOP Assistant </div>
                        <div className="chatbot-tagline">
                            Feedback Dashboard
                        </div>
                    </div>
                </div>
            </header>

            <main className="feedback-container">
                {/* TABS */}
                <div className="tabs-container">
                    <button
                        onClick={() => setActiveTab("interactions")}
                        className={`tab-button ${activeTab === "interactions" ? "active" : ""}`}
                    >
                        Feedback Interactions
                    </button>
                    <button
                        onClick={() => setActiveTab("analysis")}
                        className={`tab-button ${activeTab === "analysis" ? "active" : ""}`}
                    >
                        Analysis Dashboard
                    </button>
                </div>

                {loading ? (
                    <div>Loading...</div>
                ) : (
                    <>
                        {activeTab === "interactions" ? (
                            <div className="table-wrapper">
                                <table className="feedback-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: "15%" }}>Time Stamp</th>
                                            <th style={{ width: "25%" }}>Question</th>
                                            <th style={{ width: "25%" }}>Response</th>
                                            <th style={{ width: "20%" }}>User Feedback</th>
                                            <th style={{ width: "15%", textAlign: "center" }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.map((row) => (
                                            <tr key={row.id}>
                                                <td className="text-secondary">{formatDate(row.created_at)}</td>
                                                <td>{row.question}</td>
                                                <td className="response-cell">{row.answer}</td>
                                                <td className="feedback-text-cell">{row.feedback || "-"}</td>
                                                <td style={{ textAlign: "center" }}>
                                                    <div className="action-icons">
                                                        <span className={`icon-box ${row.liked === true ? "liked" : ""}`}>
                                                            <ThumbUpIcon active={row.liked === true} />
                                                        </span>
                                                        <span className={`icon-box ${row.liked === false ? "disliked" : ""}`}>
                                                            <ThumbDownIcon active={row.liked === false} />
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <AnalysisDashboard feedbackData={data} />
                        )}
                    </>
                )}
            </main>
        </div>
    );
}

export default FeedbackPage;
