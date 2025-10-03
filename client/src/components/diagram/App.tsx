import { useState } from "react";
import DiagramRenderer from "./DiagramRenderer";
import { flowchartFromJSON, treeFromJSON, usecaseFromJSON } from "./jsonConverters";

const sampleFlow = `{
  "nodes": ["Start", "Login", "Select Product", "Checkout", "End"],
  "edges": [
    ["Start", "Login"],
    ["Login", "Select Product"],
    ["Select Product", "Checkout"],
    ["Checkout", "End"]
  ]
}`;

const sampleTree = `{
  "root": "Company",
  "children": [
    { "name": "HR", "children": [{ "name": "Recruitment" }] },
    { "name": "Engineering", "children": [{ "name": "Frontend" }, { "name": "Backend" }] }
  ]
}`;

const sampleUsecase = `{
  "actors": ["User", "Admin"],
  "usecases": ["Login", "View Dashboard", "Manage Users"],
  "relations": [
    ["User", "Login"],
    ["User", "View Dashboard"],
    ["Admin", "Manage Users"]
  ]
}`;

export default function App() {
  const [diagramType, setDiagramType] = useState("flowchart");
  const [jsonInput, setJsonInput] = useState(sampleFlow);
  const [chartCode, setChartCode] = useState("");
  const [svgString, setSvgString] = useState("");

  const generateDiagram = () => {
    let parsed;
    try {
      parsed = JSON.parse(jsonInput);
    } catch (err) {
      alert("Invalid JSON. Please fix and try again.");
      return;
    }
    let code = "";
    if (diagramType === "flowchart") code = flowchartFromJSON(parsed);
    if (diagramType === "tree") code = treeFromJSON(parsed);
    if (diagramType === "usecase") code = usecaseFromJSON(parsed);
    setChartCode(code);
    setSvgString("");
  };

  // download SVG
  const downloadSVG = () => {
    if (!svgString) {
      alert("Render the diagram first.");
      return;
    }
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "diagram.svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  // convert SVG -> PNG (approximate; scales to detected or default size)
  const downloadPNG = async () => {
    if (!svgString) {
      alert("Render the diagram first.");
      return;
    }
    function getSvgSize(svg) {
      const viewBox = svg.match(/viewBox="([\d\s.]+)"/);
      if (viewBox) {
        const parts = viewBox[1].trim().split(/\s+/).map(Number);
        return { width: parts[2], height: parts[3] };
      }
      const w = svg.match(/width="([\d.]+)"/);
      const h = svg.match(/height="([\d.]+)"/);
      if (w && h) return { width: parseFloat(w[1]), height: parseFloat(h[1]) };
      return { width: 1200, height: 800 }; // fallback
    }
    const { width, height } = getSvgSize(svgString);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width || img.width || 1200;
      canvas.height = height || img.height || 800;
      const ctx = canvas.getContext("2d");
      // white background (optional)
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const pngUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = pngUrl;
      a.download = "diagram.png";
      a.click();
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      alert("Failed to convert SVG to PNG in this browser.");
    };
    img.src = url;
  };

  // load sample quickly
  const loadSample = (t) => {
    if (t === "flowchart") setJsonInput(sampleFlow);
    if (t === "tree") setJsonInput(sampleTree);
    if (t === "usecase") setJsonInput(sampleUsecase);
    setDiagramType(t);
    setChartCode("");
    setSvgString("");
  };

  return (
    <div style={{ padding: 20, fontFamily: "Inter, Arial, sans-serif" }}>
      <h1>JSON → Diagram (Mermaid)</h1>

      <div style={{ marginBottom: 12 }}>
        <label>
          Diagram type:{" "}
          <select value={diagramType} onChange={(e) => setDiagramType(e.target.value)}>
            <option value="flowchart">Flowchart</option>
            <option value="tree">Tree</option>
            <option value="usecase">Use Case</option>
          </select>
        </label>

        <button onClick={() => loadSample(diagramType)} style={{ marginLeft: 10 }}>
          Load sample
        </button>
      </div>

      <textarea
        rows="10"
        style={{ width: "100%", padding: 10, fontFamily: "monospace" }}
        value={jsonInput}
        onChange={(e) => setJsonInput(e.target.value)}
      />

      <div style={{ marginTop: 10 }}>
        <button onClick={generateDiagram} style={{ marginRight: 8 }}>
          Generate Diagram
        </button>
        <button onClick={downloadSVG} style={{ marginRight: 8 }}>
          Download SVG
        </button>
        <button onClick={downloadPNG}>Download PNG</button>
      </div>

      <hr style={{ margin: "16px 0" }} />

      <div>
        <h3>Preview</h3>
        <DiagramRenderer chartCode={chartCode} onRendered={(svg) => setSvgString(svg)} />
      </div>
    </div>
  );
}
