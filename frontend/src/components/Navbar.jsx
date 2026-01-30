// src/components/Navbar.jsx
import { NavLink } from "react-router-dom";

export default function Navbar() {
  const linkClass =
    "px-4 py-2 rounded-md text-sm font-medium transition-colors";

  return (
    <nav className="bg-white border-b shadow-sm px-6 py-3 flex items-center justify-between">
      <h1 className="text-lg font-semibold text-blue-700">
        Clinical SOP Assistant
      </h1>

      <div className="flex gap-2">
        <NavLink
          to="/feedback"
          className={({ isActive }) =>
            `${linkClass} ${
              isActive
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-blue-50"
            }`
          }
        >
          Feedback
        </NavLink>

        <NavLink
          to="/analysis"
          className={({ isActive }) =>
            `${linkClass} ${
              isActive
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-blue-50"
            }`
          }
        >
          Analysis
        </NavLink>
      </div>
    </nav>
  );
}
