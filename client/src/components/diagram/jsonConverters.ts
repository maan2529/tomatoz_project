// helper to create safe node ids
const idify = (s = "") => {
  return (
    "n_" +
    String(s)
      .replace(/[^\w]/g, "_")
      .replace(/^_+|_+$/g, "")
  );
};

// Flowchart converter expects: { nodes: [...], edges: [[from,to], ...] }
export function flowchartFromJSON(json = {}) {
  let code = "flowchart TD\n";
  if (Array.isArray(json.nodes)) {
    for (const n of json.nodes) {
      code += `  ${idify(n)}["${n}"]\n`;
    }
  }
  if (Array.isArray(json.edges)) {
    for (const [from, to] of json.edges) {
      code += `  ${idify(from)}["${from}"] --> ${idify(to)}["${to}"]\n`;
    }
  }
  return code;
}

// Tree converter. Accepts either:
// 1) object like { root: "Company", children: [...] } OR
// 2) nested node { name:"A", children:[{name:"B"}] }
export function treeFromJSON(json = {}) {
  let code = "graph TD\n";

  function traverse(node, parentId = null) {
    if (!node) return;
    const name = typeof node === "string" ? node : node.name || node;
    const nodeId = idify(name);
    code += `  ${nodeId}["${name}"]\n`;
    if (parentId) code += `  ${parentId} --> ${nodeId}\n`;
    const children = node.children || [];
    for (const c of children) traverse(c, nodeId);
  }

  if (json.root) {
    traverse({ name: json.root, children: json.children || [] }, null);
  } else {
    // assume passed nested structure
    traverse(json, null);
  }

  return code;
}

// Use-case converter expects:
// { actors: [...], usecases: [...], relations: [[actor,usecase], ...] }
export function usecaseFromJSON(json = {}) {
  let code = "flowchart TD\n";

  const actors = json.actors || [];
  const usecases = json.usecases || [];
  const relations = json.relations || [];

  // Define actors as rectangles on left
  actors.forEach((a, i) => {
    code += `  ${idify(a)}[${a}]\n`;
  });

  // Define use cases as ovals
  usecases.forEach((u) => {
    code += `  ${idify(u)}((${u}))\n`;
  });

  // Connect actors → use cases
  relations.forEach(([actor, usecase]) => {
    code += `  ${idify(actor)} --> ${idify(usecase)}\n`;
  });

  return code;
}

// helper
