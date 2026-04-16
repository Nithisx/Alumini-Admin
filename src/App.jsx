// src/App.jsx
import React from "react";
import AppRoutes from "./AppRoutes";
import ErrorBoundary from "./Components/Shared/ErrorBoundary";
import "./App.css";

export default function App() {
  return (
    <ErrorBoundary>
      <div className="App">
        <AppRoutes />
      </div>
    </ErrorBoundary>
  );
}
