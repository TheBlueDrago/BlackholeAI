import React from "react";
import { Search } from "lucide-react";
import BlackholeIcon from "@/components/BlackholeIcon";

export default function BrowserHome({ value, onChange, onSubmit, onLucky }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-16">
      <div className="flex items-center gap-3 mb-8 select-none">
        <BlackholeIcon className="w-14 h-14" />
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-[#ffffff] via-indigo-200 to-fuchsia-200 bg-clip-text text-transparent">Blackhole</span>
        </h1>
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
        className="w-full max-w-xl"
      >
        <div className="flex items-center gap-3 bg-slate-800/80 border border-slate-700/60 hover:border-slate-500 focus-within:border-slate-400 rounded-full px-4 h-12 shadow-lg transition-colors">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            autoFocus
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Search Blackhole or type an address (name.blackhole, name.io…)"
            className="flex-1 bg-transparent outline-none text-slate-100 placeholder:text-slate-500 text-base"
          />
        </div>
        <div className="flex justify-center gap-3 mt-6">
          <button type="submit" className="px-4 py-2 rounded-md bg-slate-800 border border-slate-700/60 text-slate-200 text-sm hover:border-slate-500 transition-colors">
            Blackhole Search
          </button>
          <button type="button" onClick={onLucky} className="px-4 py-2 rounded-md bg-slate-800 border border-slate-700/60 text-slate-200 text-sm hover:border-slate-500 transition-colors">
            I'm Feeling Lucky
          </button>
        </div>
      </form>
      <p className="text-slate-500 text-xs mt-10">Websites live at <span className="text-slate-300 font-mono">name.blackhole</span> · games at <span className="text-slate-300 font-mono">name.io</span>, <span className="text-slate-300 font-mono">name.shooter</span>…</p>
    </div>
  );
}