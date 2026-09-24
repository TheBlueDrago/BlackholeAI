import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Search, Loader2, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import UserCard from "@/components/monitor/UserCard";
import UserDetail from "@/components/monitor/UserDetail";
import RevenueAnalytics from "@/components/monitor/RevenueAnalytics";
import ReportedSites from "@/components/monitor/ReportedSites";
import Messages from "@/components/monitor/Messages";
import EnterpriseApps from "@/components/monitor/EnterpriseApps";
import GrowthCard from "@/components/monitor/GrowthCard";
import PublishedContent from "@/components/monitor/PublishedContent";
import AdminLog from "@/components/monitor/AdminLog";
import SecurityGlance from "@/components/monitor/SecurityGlance";

export default function Monitor({ onBack }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [detailUser, setDetailUser] = useState(null);
  // The first page (newest 200) loads right away; searching loads everyone else, 500 at a
  // time, so older accounts can be found too.
  const [allLoaded, setAllLoaded] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.User.list("-created_date", 200);
      setUsers(list ?? []);
      setAllLoaded((list ?? []).length < 200);
    } catch (e) {
      console.error("Monitor load failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const apply = async (id, patch) => {
    await base44.entities.User.update(id, patch);
    // The credit system doesn't trust User.plan/banned (users can edit their own row),
    // so admin grants and bans are also recorded server-side where only admins can write.
    await base44.functions.invoke("admin-grant", { grants: [{ userId: id, ...patch }] });
    setUsers((us) => us.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  };

  const q = query.trim().toLowerCase();

  const searching = q.length > 0;
  useEffect(() => {
    if (!searching || allLoaded || loading) return;
    let alive = true;
    (async () => {
      setLoadingMore(true);
      try {
        let all = users;
        for (;;) {
          const page = (await base44.entities.User.list("-created_date", 500, all.length)) ?? [];
          const seen = new Set(all.map((u) => u.id));
          all = [...all, ...page.filter((u) => !seen.has(u.id))];
          if (!alive) return;
          setUsers(all);
          if (page.length < 500 || all.length >= 20000) break;
        }
        if (alive) setAllLoaded(true);
      } catch (e) {
        console.error("Monitor: loading more users failed", e);
      } finally {
        setLoadingMore(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searching, allLoaded, loading]);
  const filtered = q
    ? users.filter(
        (u) =>
          `${u.full_name ?? ""}`.toLowerCase().includes(q) ||
          `${u.email ?? ""}`.toLowerCase().includes(q)
      )
    : [];
  const recent = users.slice(0, 12);

  return (
    <motion.div
      className="relative z-10 min-h-screen flex flex-col items-center px-4 py-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      <div className="w-full max-w-3xl flex items-center justify-between gap-3">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-2xl font-bold text-white inline-flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-sky-300" /> Monitor
        </h1>
        <div className="w-16" />
      </div>

      <SecurityGlance />

      {!loading && <GrowthCard users={users} complete={allLoaded} />}

      {/* Published sites & games with safety flags, red first. */}
      <PublishedContent />

      <div className="w-full max-w-3xl mt-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full bg-slate-800/70 border border-slate-700/50 focus:border-sky-500/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none"
        />
      </div>

      {loading ? (
        <div className="mt-16 flex items-center justify-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : q ? (
        <div className="w-full max-w-3xl mt-6 space-y-3">
          <p className="text-slate-400 text-sm inline-flex items-center gap-2">
            {filtered.length} result(s) · searched {users.length} users
            {loadingMore && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          </p>
          {filtered.map((u) => (
            <UserCard key={u.id} user={u} onApply={apply} onOpenDetail={setDetailUser} />
          ))}
        </div>
      ) : (
        <div className="w-full max-w-3xl mt-6 space-y-3">
          <p className="text-slate-300 text-sm font-medium">Recently joined</p>
          {recent.length === 0 && <p className="text-slate-500 text-sm">No users yet.</p>}
          {recent.map((u) => (
            <UserCard key={u.id} user={u} onApply={apply} onOpenDetail={setDetailUser} />
          ))}
        </div>
      )}

      {!loading && !q && <ReportedSites />}
      {!loading && !q && <EnterpriseApps />}
      {!loading && !q && <Messages />}
      {!loading && !q && <RevenueAnalytics />}
      {!loading && !q && <AdminLog />}

      {detailUser && <UserDetail user={detailUser} onClose={() => setDetailUser(null)} />}
    </motion.div>
  );
}