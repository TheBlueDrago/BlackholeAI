import React from "react";

// Catches a crash anywhere below it so the app shows a way out instead of going blank.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("App crashed:", error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-950 text-slate-200 p-6 text-center">
        <p className="text-lg font-semibold">Something went wrong.</p>
        <p className="text-sm text-slate-400 max-w-sm">Reloading usually fixes it — especially right after Blackhole AI was updated.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-5 py-2 rounded-xl bg-indigo-600 text-[#fff] text-sm font-medium hover:bg-indigo-500"
        >
          Reload
        </button>
        {/* A plain link: this screen can show when the page's own navigation is what broke. */}
        <a href="/contact?topic=bug" className="text-xs text-slate-400 underline underline-offset-2 hover:text-slate-200">
          Keeps happening? Tell us
        </a>
      </div>
    );
  }
}
