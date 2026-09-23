import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Loader2, Trash2, Ticket, Save } from "lucide-react";
import { base44 } from "@/api/base44Client";

const MODELS = [
  { id: "ai", label: "Blackhole AI" },
  { id: "aiCode", label: "Blackhole Code" },
  { id: "galaxy5", label: "Galaxy" },
  { id: "space5", label: "Space" },
];

const inputCls =
  "w-full bg-slate-800/70 border border-slate-700/50 focus:border-indigo-500/50 rounded-lg px-2.5 py-2 text-sm text-white placeholder:text-slate-500 outline-none transition-colors";

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-[11px] text-slate-400 mb-1">{label}</span>
      {children}
    </label>
  );
}

function modelLabel(id) {
  return MODELS.find((m) => m.id === id)?.label ?? id;
}

function CodeCard({ code, onSave, onDelete, busy }) {
  const [f, setF] = useState({
    aiModel: code.aiModel ?? "ai",
    credits: code.credits ?? 10,
    active: code.active !== false,
    label: code.label ?? "",
  });
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  return (
    <div className="bg-slate-900/70 border border-slate-700/50 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Ticket className="w-4 h-4 text-sky-300" />
        <span className="text-sm font-semibold text-white tracking-wide">{code.code}</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
          +{code.credits} {modelLabel(code.aiModel)}
        </span>
        {!f.active && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-300 border border-red-500/30">
            used / inactive
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="AI model">
          <select value={f.aiModel} onChange={(e) => set("aiModel", e.target.value)} className={inputCls}>
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Credits">
          <input type="number" min="1" value={f.credits} onChange={(e) => set("credits", Number(e.target.value))} className={inputCls} />
        </Field>
        <Field label="Label (note)">
          <input type="text" value={f.label} onChange={(e) => set("label", e.target.value)} placeholder="optional" className={inputCls} />
        </Field>
      </div>
      <div className="flex items-center gap-4 mt-3 flex-wrap">
        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
          <input type="checkbox" checked={f.active} onChange={(e) => set("active", e.target.checked)} className="w-4 h-4 accent-indigo-500" />
          Active
        </label>
      </div>
      <p className="text-[11px] text-slate-500 mt-2">Each code works once — it expires after the first redemption.</p>
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => onSave(code.id, f)}
          disabled={busy}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium disabled:opacity-50 hover:bg-indigo-400 transition-colors"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save
        </button>
        <button
          onClick={() => onDelete(code.id)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600/80 text-white text-sm font-medium hover:bg-red-500 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </div>
    </div>
  );
}

function NewCard({ onCreate, busy }) {
  const [f, setF] = useState({ code: "", aiModel: "ai", credits: 10, active: true, label: "" });
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  return (
    <div className="bg-slate-900/70 border-2 border-emerald-500/40 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Plus className="w-4 h-4 text-emerald-300" />
        <h3 className="text-sm font-semibold text-white">New Promo Code</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Code">
          <input type="text" value={f.code} onChange={(e) => set("code", e.target.value.toUpperCase())} placeholder="NEWCODE" className={inputCls + " uppercase tracking-wide"} />
        </Field>
        <Field label="AI model">
          <select value={f.aiModel} onChange={(e) => set("aiModel", e.target.value)} className={inputCls}>
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Credits">
          <input type="number" min="1" value={f.credits} onChange={(e) => set("credits", Number(e.target.value))} className={inputCls} />
        </Field>
        <Field label="Label (note)">
          <input type="text" value={f.label} onChange={(e) => set("label", e.target.value)} placeholder="optional" className={inputCls} />
        </Field>
      </div>
      <button
        onClick={() => onCreate(f)}
        disabled={busy || !f.code.trim()}
        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        Create
      </button>
    </div>
  );
}

export default function PromoManager({ onBack }) {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [err, setErr] = useState("");

  const load = async () => {
    try {
      const r = await base44.functions.invoke("manage-promos", { action: "list" });
      setCodes(r.data?.codes ?? []);
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "Could not load promo codes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (f) => {
    setErr("");
    setBusyId("new");
    try {
      await base44.functions.invoke("manage-promos", { action: "create", ...f });
      await load();
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "Could not create code.");
    } finally {
      setBusyId(null);
    }
  };

  const save = async (id, f) => {
    setErr("");
    setBusyId(id);
    try {
      await base44.functions.invoke("manage-promos", { action: "update", id, ...f });
      await load();
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "Could not save code.");
    } finally {
      setBusyId(null);
    }
  };

  const del = async (id) => {
    if (!window.confirm("Delete this promo code?")) return;
    setErr("");
    setBusyId(id);
    try {
      await base44.functions.invoke("manage-promos", { action: "delete", id });
      await load();
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "Could not delete code.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <motion.div
      className="relative z-10 min-h-screen flex flex-col items-center px-4 py-10 bg-gradient-to-br from-slate-950 via-slate-900 to-black overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />

      <button
        onClick={onBack}
        className="fixed top-5 left-5 z-30 p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/50 text-slate-200 hover:bg-slate-700/70 transition-colors"
        title="Back"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-center">
        <span className="bh-wordmark bg-gradient-to-r from-white via-emerald-200 to-sky-200 bg-clip-text text-transparent">Promo Codes</span>
      </h1>
      <p className="text-slate-400 mt-2 text-center text-sm">Create single-use codes that grant extra credits</p>

      <div className="mt-8 w-full max-w-2xl space-y-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        ) : (
          <>
            <NewCard onCreate={create} busy={busyId === "new"} />
            {codes.map((c) => (
              <CodeCard key={c.id} code={c} onSave={save} onDelete={del} busy={busyId === c.id} />
            ))}
            {codes.length === 0 && <p className="text-center text-slate-500 text-sm">No codes yet.</p>}
          </>
        )}
        {err && <p className="text-center text-sm text-red-400">{err}</p>}
      </div>
    </motion.div>
  );
}