import { useAppShell } from "@/components/AppShellContext";
import { hasProFeatures } from "@/lib/plans";

// Downloading a ZIP and pushing to GitHub: Pro or higher, and paid for. The free week of Pro
// (planSource "trial", see cloudflare-lib/offers.js) doesn't include them.
export function useExportAccess(plan) {
  const shell = useAppShell();
  const trial = shell?.credits?.planSource === "trial";
  const paid = hasProFeatures(plan);
  return {
    allowed: paid && !trial,
    why: trial
      ? "ZIP downloads and GitHub are for paid plans. Your free week of Pro doesn't include them."
      : "ZIP downloads and GitHub need Pro or higher.",
  };
}
