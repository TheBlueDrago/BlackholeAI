import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { paymentError } from "@/lib/paymentError";

// Published sites live on their own subdomain (nova.blackhole-ai-tech.com), where a buy
// button's parent.postMessage has no host page to answer it. The bridge added by
// functions/published/[kind]/[name].js sends the buyer here instead, and this starts the
// same Base44 Payments checkout the Blackhole Browser uses (see useSiteCheckout).
// Public on purpose: buyers usually have no Blackhole account.
export default function Buy() {
  const [params] = useSearchParams();
  const [error, setError] = useState("");
  const siteName = (params.get("site") || "").toLowerCase();

  useEffect(() => {
    const productId = params.get("product") || "";
    const quantity = Math.max(1, Math.min(50, parseInt(params.get("qty") || "1", 10) || 1));
    if (!siteName || !productId) {
      setError("This checkout link is missing the product.");
      return;
    }
    base44.functions
      .invoke("site-checkout", { siteName, productId, quantity })
      .then((res) => {
        if (res.data?.redirectUrl) window.location.replace(res.data.redirectUrl);
        else setError(res.data?.error || "Checkout is unavailable right now.");
      })
      .catch((err) => setError(paymentError(err, "Checkout is unavailable right now.")));
  }, [params, siteName]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-950 text-slate-300 text-sm p-6 text-center">
      {error ? (
        <>
          <p className="text-red-400">{error}</p>
          {siteName && (
            <a href={`https://${siteName}.blackhole-ai-tech.com`} className="underline text-slate-400">
              Back to {siteName}.blackhole-ai-tech.com
            </a>
          )}
        </>
      ) : (
        <>
          <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
          <p>Opening secure checkout…</p>
        </>
      )}
    </div>
  );
}
