import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";

export default function SiteView() {
  const { name } = useParams();
  const [site, setSite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const n = (name || "").toLowerCase();
    base44.entities.PublishedSite.filter({ name: n })
      .then((rows) => {
        if (rows && rows.length) setSite(rows[0]);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [name]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400 text-sm">
        Loading…
      </div>
    );
  }

  if (notFound || !site) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-center p-6">
        <p className="text-slate-200 text-lg font-semibold">Site not found</p>
        <p className="text-slate-500 text-sm mt-1">
          No published site named “{name}”.
        </p>
        <Link to="/" className="mt-4 text-indigo-400 hover:underline text-sm">
          Back to Blackhole AI
        </Link>
      </div>
    );
  }

  return (
    <iframe
      srcDoc={site.html}
      title={site.name}
      sandbox="allow-scripts"
      className="w-screen h-screen border-0"
    />
  );
}