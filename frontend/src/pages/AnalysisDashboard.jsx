// src/pages/AnalysisDashboard.jsx
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "./AnalysisDashboard.css";

export default function AnalysisDashboard({ feedbackData = [] }) {
  const total = feedbackData.length;
  const likes = feedbackData.filter((f) => f.liked === true).length;
  // Assuming 'liked === false' means dislike, and null means neither
  const dislikes = feedbackData.filter((f) => f.liked === false).length;
  const feedbackGiven = likes + dislikes;

  const sopScore =
    feedbackGiven === 0 ? 0 : Math.round((likes / feedbackGiven) * 100);

  const satisfactionEmoji =
    sopScore >= 75 ? "🙂" : sopScore >= 40 ? "😐" : "😞";

  const pieData = [
    { name: "Helpful", value: likes },
    { name: "Needs Improvement", value: dislikes },
  ];

  // Group by date (ignoring time)
  const trendDataMap = feedbackData.reduce((acc, item) => {
    const date = item.created_at ? item.created_at.split('T')[0] : 'Unknown';
    if (!acc[date]) {
      acc[date] = {
        date: date,
        like: 0,
        dislike: 0,
      };
    }
    if (item.liked === true) acc[date].like += 1;
    if (item.liked === false) acc[date].dislike += 1;
    return acc;
  }, {});

  // Sort by date
  const trendData = Object.values(trendDataMap).sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="dashboard-container">
      {/* KPI CARDS */}
      <div className="kpi-grid">
        <Kpi title="Total Questions" value={total} />
        <Kpi title="Helpful Responses" value={likes} green />
        <Kpi title="Needs Improvement" value={dislikes} red />
      </div>

      {/* SOP SCORE */}
      <div className="dashboard-section">
        <h3 className="section-title">SOP Answer Quality Score</h3>
        <div className="score-container">
          <span className="score-text">{sopScore}%</span>
          <div className="progress-bar-bg">
            <div
              className={`progress-bar-fill ${sopScore >= 75 ? 'bg-green' : sopScore >= 40 ? 'bg-yellow' : 'bg-red'}`}
              style={{ width: `${sopScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* USER SATISFACTION */}
      <div className="dashboard-section">
        <h3 className="section-title">User Satisfaction</h3>
        <p className="satisfaction-text">
          {sopScore}% {satisfactionEmoji}
        </p>
      </div>

      {/* CHARTS */}
      <div className="charts-grid">
        <div className="chart-container">
          <h3 className="section-title">Feedback Distribution</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} dataKey="value" outerRadius={80} label>
                <Cell fill="#22c55e" />
                <Cell fill="#ef4444" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3 className="section-title">Feedback Trend</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="like" stroke="#22c55e" strokeWidth={2} name="Likes" />
              <Line type="monotone" dataKey="dislike" stroke="#ef4444" strokeWidth={2} name="Dislikes" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Kpi({ title, value, green, red }) {
  return (
    <div
      className={`kpi-card ${green ? "kpi-green" : ""
        } ${red ? "kpi-red" : ""}`}
    >
      <p className="kpi-title">{title}</p>
      <p className="kpi-value">{value}</p>
    </div>
  );
}
