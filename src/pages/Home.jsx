import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import Intro from "@/components/Intro";

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(async () => {
      const authed = await base44.auth.isAuthenticated().catch(() => false);
      if (authed) {
        navigate("/chat", { replace: true });
      } else {
        navigate("/login?returnTo=" + encodeURIComponent("/chat"), { replace: true });
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return <Intro />;
}