import React from "react";

function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
}) {
  return (
    <div className="sidebar">
      <button className="new-chat-btn" onClick={onNewChat}>
        + New Chat
      </button>

      <div className="chat-history">
        {Object.entries(sessions).map(([id, session]) => (
          <div
            key={id}
            className={`chat-history-item ${
              id === activeSessionId ? "active" : ""
            }`}
            onClick={() => onSelectSession(id)}
            title={session.title}
          >
            {session.title || "New Chat"}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Sidebar;
