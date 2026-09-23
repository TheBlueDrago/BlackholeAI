import React, { useEffect, useRef, useState } from "react";

const SRC_W = 1280;
const SRC_H = 800;

// A scaled-down live render of a site with scripts off (empty sandbox), so thumbnails are
// cheap and can't run code: a published site by `name` (loaded straight from KV at
// /published/site/…), or a page's `html` (templates).
export default function SiteThumb({ name, html }) {
  const ref = useRef(null);
  const [scale, setScale] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / SRC_W);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className="absolute inset-0 pointer-events-none">
      {scale > 0 && (
        <iframe
          {...(html != null ? { srcDoc: html } : { src: `/published/site/${encodeURIComponent(name)}` })}
          title={name || "Preview"}
          loading="lazy"
          tabIndex={-1}
          scrolling="no"
          sandbox=""
          style={{ width: SRC_W, height: SRC_H, transform: `scale(${scale})`, transformOrigin: "top left", border: 0, background: "#fff" }}
        />
      )}
    </div>
  );
}
