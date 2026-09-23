import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import Landing from "@/pages/Landing";

// Signed-in people go straight to the chat; everyone else sees what Blackhole AI is.
export default function Home() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/chat" replace />;
  return <Landing />;
}
