import { useEffect, useRef } from "react";
import mermaid from "mermaid";

export default function DiagramRenderer({ chartCode }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!chartCode || !ref.current) return;

    // Initialize Mermaid once
    mermaid.initialize({ startOnLoad: false, theme: "default" });

    const id = "graphDiv" + Math.floor(Math.random() * 10000);

    // ✅ v10 render is async
    (async () => {
      try {
        const { svg } = await mermaid.render(id, chartCode);
        ref.current.innerHTML = svg;
      } catch (err) {
        console.error("Mermaid render error:", err);
        ref.current.innerHTML = `<p style="color:red">❌ Invalid Diagram Code</p>`;
      }
    })();
  }, [chartCode]);

  return <div ref={ref}></div>;
}
