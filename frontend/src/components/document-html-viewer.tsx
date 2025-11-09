import { useEffect, useMemo, useRef, useState } from "react";
import DOMPurify from "dompurify";

type Props = { html: string };

export default function DocumentHtmlViewer({ html }: Props) {
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const [height, setHeight] = useState(400);

    const srcDoc = useMemo(() => {
        const safe = DOMPurify.sanitize(html ?? "", { USE_PROFILES: { html: true } });
        const css = `
      html,body{margin:0;padding:0}
      body{
        font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
        line-height:1.6;
        color:#111827;
        background:#ffffff;
      }
      img,video{max-width:100%;height:auto}
      table{border-collapse:collapse;width:100%}
      th,td{border:1px solid #e5e7eb;padding:8px;vertical-align:top}
      pre,code{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace}
      h1{font-size:1.875rem;margin:1rem 0 .5rem}
      h2{font-size:1.5rem;margin:1rem 0 .5rem}
      h3{font-size:1.25rem;margin:1rem 0 .5rem}
      h4{font-size:1.125rem;margin:.75rem 0 .5rem}
      p{margin:.5rem 0}
      ul,ol{padding-left:1.25rem;margin:.5rem 0}
      a{color:#2563eb;text-decoration:underline}
    `;
        return `<!doctype html><html><head><meta charset="utf-8"/><style>${css}</style></head><body>${safe}</body></html>`;
    }, [html]);

    useEffect(() => {
        const i = iframeRef.current;
        if (!i) return;
        const adjustHeight = () => {
            try {
                const d = i.contentDocument || i.contentWindow?.document;
                if (!d) return;
                const h = Math.max(d.body?.scrollHeight || 0, d.documentElement?.scrollHeight || 0);
                setHeight(Math.min(Math.max(h, 200), 5000));
            } catch {}
        };
        i.addEventListener("load", adjustHeight);
        const t = setTimeout(adjustHeight, 100);
        return () => {
            i.removeEventListener("load", adjustHeight);
            clearTimeout(t);
        };
    }, [srcDoc]);

    return (
        <iframe
            ref={iframeRef}
            sandbox="allow-same-origin"
            srcDoc={srcDoc}
            style={{
                width: "100%",
                height,
                border: "0",
                background: "#fff",
            }}
        />
    );
}
