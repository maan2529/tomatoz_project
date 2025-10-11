# Diagram Generator Agent - Prompt Update Instructions

## Current Status
✅ Diagram schema updated with new structure (type, structureData, etc.)
✅ Blog schema updated to use `diagramIds` array
✅ EnhancedDiagramPipeline updated to save diagrams with new structure

## Remaining Task: Update DiagramGeneratorAgent.js Prompt

### File Location
`server/src/agents/DiagramGeneratorAgent.js`

### Methods to Update

#### 1. `callGeminiForDiagrams()` method (lines 254-348)
Replace the `systemPrompt` variable with:

```javascript
const systemPrompt = `You are an expert at creating technical diagrams from blog content. Generate clear, structured diagrams that help visualize concepts, workflows, and architectures.

DIAGRAM TYPES:
- "flowChart": For workflows, processes, decision flows, algorithms
- "usecase": For user interactions, feature usage, actor-system relationships  
- "sequence": For time-based interactions, API calls, event sequences
- "class": For object relationships, inheritance, component structures
- "er": For data models, database schemas, entity relationships

CRITICAL RULES:
1. Generate ONLY for technical content with clear relationships
2. Keep diagrams SIMPLE: 5-15 nodes maximum per diagram
3. Use CLEAR node labels (descriptive but concise)
4. Each node must have unique "id" and readable "label"
5. Links can have optional "label" to describe relationships
6. Maximum 3 diagrams per content
7. Choose the most appropriate diagram type for the content

OUTPUT FORMAT (valid JSON only):
{
  "diagrams": [
    {
      "type": "flowChart",
      "title": "Short descriptive title (under 60 chars)",
      "explanation": "2-3 sentence explanation of what this diagram shows",
      "structureData": [{
        "nodes": [
          { "id": "Start", "label": "Start Process" },
          { "id": "Step1", "label": "Check Condition" },
          { "id": "End", "label": "Complete" }
        ],
        "links": [
          { "source": "Start", "target": "Step1", "label": "" },
          { "source": "Step1", "target": "End", "label": "success" }
        ]
      }]
    }
  ]
}

VALIDATION REQUIREMENTS:
- type must be one of: flowChart, usecase, sequence, class, er
- All "source" and "target" in links must match existing node "id" values
- Node "id" must be unique within a diagram
- Each node must have both "id" and "label"
- Minimum 2 nodes per diagram
- structureData must be an array with at least one element

If content is NOT suitable for diagrams, return:
{
  "diagrams": [],
  "reason": "Brief explanation why diagrams are not suitable"
}`;
```

#### 2. `validateDiagramStructure()` method (lines 350-404)
Replace entire method with:

```javascript
validateDiagramStructure(diagram) {
    const errors = [];

    // Validate type
    const validTypes = ["flowChart", "usecase", "sequence", "class", "er"];
    if (!diagram.type || !validTypes.includes(diagram.type)) {
        errors.push(`Invalid diagram type. Must be one of: ${validTypes.join(", ")}`);
    }

    // Validate structureData
    if (!diagram.structureData || !Array.isArray(diagram.structureData) || diagram.structureData.length === 0) {
        errors.push("Missing or empty structureData array");
        return { valid: false, errors };
    }

    const structure = diagram.structureData[0];
    const { nodes, links } = structure;

    // Validate nodes
    if (!Array.isArray(nodes) || nodes.length < 2) {
        errors.push("Must have at least 2 nodes");
    }

    if (nodes && nodes.length > 20) {
        errors.push(`Too many nodes (${nodes.length}), maximum is 20`);
    }

    // Check for unique node IDs and required fields
    if (nodes && Array.isArray(nodes)) {
        const nodeIds = nodes.map(n => n.id);
        const uniqueIds = new Set(nodeIds);
        if (nodeIds.length !== uniqueIds.size) {
            errors.push("Duplicate node IDs found");
        }

        // Validate each node has id and label
        nodes.forEach((node, i) => {
            if (!node.id) errors.push(`Node ${i} missing id`);
            if (!node.label) errors.push(`Node ${i} missing label`);
        });
    }

    // Validate links
    if (!Array.isArray(links)) {
        errors.push("Links must be an array");
    } else if (nodes && Array.isArray(nodes)) {
        const nodeIdSet = new Set(nodes.map(n => n.id));
        links.forEach((link, i) => {
            if (!link.source || !link.target) {
                errors.push(`Link ${i} missing source or target`);
            } else {
                if (!nodeIdSet.has(link.source)) {
                    errors.push(`Link source "${link.source}" references non-existent node`);
                }
                if (!nodeIdSet.has(link.target)) {
                    errors.push(`Link target "${link.target}" references non-existent node`);
                }
            }
        });
    }

    return { valid: errors.length === 0, errors };
}
```

#### 3. `enhanceDiagram()` method (lines 406-428)
Replace entire method with:

```javascript
enhanceDiagram(diagram) {
    // Return the diagram in the new format
    return {
        type: diagram.type,
        title: diagram.title,
        explanation: diagram.explanation || "",
        structureData: diagram.structureData
    };
}
```

## Testing
After making these changes, restart the server and test diagram generation.

## Expected Output Format
Diagrams will now be saved with:
- `type`: One of flowChart, usecase, sequence, class, er
- `title`: Descriptive title
- `explanation`: What the diagram shows
- `structureData`: Array containing nodes and links with labels
- `status`: success/failure
- `blogId`: Reference to parent blog
