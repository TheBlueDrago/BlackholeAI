import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Github, Loader2, Check, X, ChevronDown, Upload, Crown } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { hasProFeatures } from "@/lib/plans";

const CONNECTOR_ID = "6aa8a3d7b5e549c2a9d23e26";

export default function GitHubPush({ html, siteName, plan, onUpgrade }) {
  const canConnect = hasProFeatures(plan);
  const [open, setOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const ref = useRef(null);

  const fetchRepos = async () => {
    setLoadingRepos(true);
    setError("");
    try {
      const res = await base44.functions.invoke("github-push", { action: "repos" });
      setRepos(res.data?.repos || []);
      setConnected(true);
    } catch (e) {
      if (e?.response?.data?.error === "not_connected" || e?.response?.status === 403) {
        setConnected(false);
      } else {
        setError(e?.response?.data?.error || e?.message || "Could not reach GitHub");
      }
    } finally {
      setLoadingRepos(false);
    }
  };

  useEffect(() => {
    if (open && connected && repos.length === 0 && !loadingRepos) {
      fetchRepos();
    }
  }, [open, connected]);

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleConnect = async () => {
    setError("");
    try {
      const res = await base44.connectors.connectAppUser(CONNECTOR_ID);
      const url = res?.data || res;
      const popup = window.open(url, "_blank");
      const timer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          fetchRepos();
        }
      }, 500);
    } catch (e) {
      setError("Could not start GitHub connection");
    }
  };

  const handlePush = async () => {
    if (!selectedRepo || !html || pushing) return;
    setPushing(true);
    setError("");
    setResult(null);
    try {
      const res = await base44.functions.invoke("github-push", {
        action: "push",
        repo: selectedRepo,
        html,
        path: "index.html",
        message: `Update ${siteName || "website"} from Blackhole AI`,
      });
      if (res.data?.success) {
        setResult(res.data);
      } else {
        setError(res.data?.error || "Push failed");
      }
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Push failed");
    } finally {
      setPushing(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Push to GitHub"
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/70 border border-slate-700/50 text-slate-200 text-sm font-medium hover:bg-slate-700/70 transition-colors"
      >
        <Github className="w-4 h-4" />
        <span className="hidden sm:inline">GitHub</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-700/60 rounded-xl shadow-2xl p-4 z-40"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Github className="w-4 h-4 text-slate-300" />
                <p className="text-sm font-semibold text-white">Push to GitHub</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {!connected ? (
              canConnect ? (
                <div className="text-center py-3">
                  <p className="text-slate-400 text-xs mb-3">Connect your GitHub account to push your website to a repository.</p>
                  <button
                    onClick={handleConnect}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 text-white text-sm font-medium hover:opacity-90 transition-opacity border border-slate-600"
                  >
                    <Github className="w-4 h-4" /> Connect GitHub
                  </button>
                </div>
              ) : (
                <div className="text-center py-3">
                  <p className="text-slate-400 text-xs mb-3">GitHub integration requires Pro or above.</p>
                  <button
                    onClick={onUpgrade}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    <Crown className="w-4 h-4" /> Upgrade to Pro
                  </button>
                </div>
              )
            ) : loadingRepos ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-400 mb-1.5">Select a repository</p>
                <div className="relative mb-3">
                  <select
                    value={selectedRepo}
                    onChange={(e) => { setSelectedRepo(e.target.value); setResult(null); }}
                    className="w-full appearance-none bg-slate-800 border border-slate-700/50 rounded-lg px-3 py-2 pr-8 text-sm text-white outline-none focus:border-indigo-500/50"
                  >
                    <option value="">Choose a repo…</option>
                    {repos.map((r) => (
                      <option key={r.full_name} value={r.full_name}>
                        {r.full_name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <button
                  onClick={handlePush}
                  disabled={!selectedRepo || pushing || !html}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                >
                  {pushing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {pushing ? "Pushing…" : "Push index.html"}
                </button>

                {result && (
                  <div className="mt-3 flex items-start gap-2 bg-emerald-900/30 border border-emerald-500/40 rounded-lg px-3 py-2">
                    <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-emerald-200">Pushed successfully!</p>
                      {result.fileUrl && (
                        <a href={result.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-400 underline truncate block">
                          View on GitHub
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}