// src/context/FeedbackContext.jsx
import { createContext, useContext, useState } from "react";

const FeedbackContext = createContext();

export function FeedbackProvider({ children }) {
  const [feedbackData, setFeedbackData] = useState([
    {
      question: "How should blood samples be labeled?",
      timestamp: "2026-01-29",
      feedback: "like",
    },
    {
      question: "What is the order of blood draw tubes?",
      timestamp: "2026-01-29",
      feedback: "dislike",
    },
    {
      question: "How should blood samples be labeled?",
      timestamp: "2026-01-30",
      feedback: null,
    },
  ]);

  return (
    <FeedbackContext.Provider value={{ feedbackData, setFeedbackData }}>
      {children}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  return useContext(FeedbackContext);
}
