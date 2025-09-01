import React from "react";
import DashboardPage from "./pages/Dashboard";
import { Route, Routes } from "react-router";
import SignInPage from "./pages/SignIn";

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<SignInPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </div>
  );
}

export default App;
