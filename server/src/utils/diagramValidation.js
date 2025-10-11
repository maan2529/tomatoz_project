// utils/diagramPrompts.js

/**
 * AI Prompt Library for Diagram Generation
 * Contains specialized prompts for analyzing content and generating diagram JSON structures
 */

// ============================================================
// STEP 1: Content Analysis Prompt
// ============================================================

export const ANALYSIS_PROMPT = (blogContent, summary) => `
You are an expert technical content analyzer specializing in identifying diagram-worthy information.

Your task: Analyze the following technical blog post and determine if a meaningful diagram can be generated from it.

BLOG SUMMARY:
${summary}

BLOG CONTENT (First 3000 chars):
${blogContent.substring(0, 3000)}

ANALYSIS INSTRUCTIONS:
1. Identify if the content contains any of these diagram-worthy elements:
   - Workflows, processes, or step-by-step procedures (→ Flowchart)
   - API calls, request/response flows, or message exchanges (→ Sequence Diagram)
   - Class hierarchies, OOP structures, or component architectures (→ Class Diagram)
   - Database schemas, entity relationships (→ ER Diagram)
   - State transitions, lifecycle stages (→ State Diagram)
   - Hierarchical concepts, categorizations (→ Mindmap)
   - Statistical data, comparisons, proportions (→ Pie Chart)
   - Project timelines, release schedules (→ Timeline/Gantt)

2. Evaluate diagram viability:
   - GENERATE if: Content has clear visual relationships, flows, or structures
   - SKIP if: Content is purely narrative, opinion-based, or lacks visual elements

3. Select the SINGLE BEST diagram type that represents the core concept

RESPOND IN VALID JSON FORMAT ONLY:
{
  "isViable": true/false,
  "reasoning": "Brief explanation of your decision (2-3 sentences)",
  "recommendedType": "flowchart" | "sequence" | "class" | "er" | "state" | "mindmap" | "pie" | "timeline" | "gantt" | null,
  "confidence": 0.0-1.0,
  "keyElements": ["element1", "element2", "element3"]
}

CRITICAL: Return ONLY valid JSON, no additional text.
`;

// ============================================================
// STEP 2: Type-Specific Generation Prompts
// ============================================================

export const GENERATION_PROMPTS = {

    // --------------------- FLOWCHART ---------------------
    flowchart: (blogContent, summary) => `
You are a flowchart generation expert. Create a flowchart JSON structure from this technical content.

CONTENT:
${summary}

DETAILED CONTENT (First 2500 chars):
${blogContent.substring(0, 2500)}

FLOWCHART RULES:
- Focus on the PRIMARY workflow, process, or algorithm described
- Use 4-8 nodes (not too simple, not too complex)
- Each node should represent a clear step or decision point
- Edges show the flow/sequence between steps

JSON SCHEMA:
{
  "nodes": [
    { "id": "A", "label": "Start/First Step" },
    { "id": "B", "label": "Process/Action" },
    { "id": "C", "label": "Decision/Check" },
    { "id": "D", "label": "End/Result" }
  ],
  "edges": [
    { "from": "A", "to": "B" },
    { "from": "B", "to": "C" },
    { "from": "C", "to": "D" }
  ]
}

EXAMPLE (React Hooks):
{
  "nodes": [
    { "id": "A", "label": "Component Renders" },
    { "id": "B", "label": "useState() Initializes" },
    { "id": "C", "label": "User Interaction" },
    { "id": "D", "label": "setState() Called" },
    { "id": "E", "label": "Component Re-renders" }
  ],
  "edges": [
    { "from": "A", "to": "B" },
    { "from": "B", "to": "C" },
    { "from": "C", "to": "D" },
    { "from": "D", "to": "E" },
    { "from": "E", "to": "C" }
  ]
}

CRITICAL REQUIREMENTS:
- ONLY return valid JSON matching the schema above
- Use single-letter IDs (A, B, C, D, etc.)
- Labels must be concise (max 6 words)
- All edge references must point to existing node IDs
- Minimum 3 nodes, maximum 10 nodes

GENERATE THE FLOWCHART JSON NOW:
`,

    // --------------------- SEQUENCE DIAGRAM ---------------------
    sequence: (blogContent, summary) => `
You are a sequence diagram expert. Create a sequence diagram JSON from this technical content.

CONTENT:
${summary}

DETAILED CONTENT (First 2500 chars):
${blogContent.substring(0, 2500)}

SEQUENCE DIAGRAM RULES:
- Show interactions between 2-5 participants (components, services, APIs)
- Each message represents a request, response, or data flow
- Focus on the main interaction flow described in the content

JSON SCHEMA:
{
  "messages": [
    { "from": "Participant1", "to": "Participant2", "message": "Action or request" },
    { "from": "Participant2", "to": "Participant3", "message": "Response or data" }
  ]
}

EXAMPLE (API Authentication):
{
  "messages": [
    { "from": "User", "to": "Frontend", "message": "Click Login" },
    { "from": "Frontend", "to": "API", "message": "POST /auth/login" },
    { "from": "API", "to": "Database", "message": "Verify credentials" },
    { "from": "Database", "to": "API", "message": "User found" },
    { "from": "API", "to": "Frontend", "message": "Return JWT token" },
    { "from": "Frontend", "to": "User", "message": "Redirect to dashboard" }
  ]
}

CRITICAL REQUIREMENTS:
- ONLY return valid JSON matching the schema above
- Participant names: 1-2 words, PascalCase (e.g., "User", "API", "Database")
- Messages: Clear action verbs (e.g., "Send request", "Return data")
- Minimum 3 messages, maximum 12 messages
- Show complete interaction flow (request → processing → response)

GENERATE THE SEQUENCE DIAGRAM JSON NOW:
`,

    // --------------------- CLASS DIAGRAM ---------------------
    class: (blogContent, summary) => `
You are a class diagram expert. Create a class diagram JSON from this technical content.

CONTENT:
${summary}

DETAILED CONTENT (First 2500 chars):
${blogContent.substring(0, 2500)}

CLASS DIAGRAM RULES:
- Extract 2-5 classes/components from the content
- Include key attributes and methods for each class
- Show inheritance or composition relationships

JSON SCHEMA:
{
  "classes": [
    {
      "name": "ClassName",
      "attributes": ["attribute1", "attribute2"],
      "methods": ["method1", "method2"]
    }
  ],
  "relations": [
    { "from": "ParentClass", "to": "ChildClass", "type": "inherits" }
  ]
}

EXAMPLE (React Components):
{
  "classes": [
    {
      "name": "Component",
      "attributes": ["props", "state"],
      "methods": ["render", "componentDidMount"]
    },
    {
      "name": "UserProfile",
      "attributes": ["userId", "userData"],
      "methods": ["fetchUser", "updateProfile"]
    }
  ],
  "relations": [
    { "from": "Component", "to": "UserProfile", "type": "extends" }
  ]
}

CRITICAL REQUIREMENTS:
- ONLY return valid JSON matching the schema above
- Class names: PascalCase (e.g., "UserService", "DataModel")
- Attributes: camelCase, no types (e.g., "userId", "email")
- Methods: camelCase, no parameters (e.g., "fetchData", "validate")
- Relations optional if no clear inheritance/composition

GENERATE THE CLASS DIAGRAM JSON NOW:
`,

    // --------------------- ER DIAGRAM ---------------------
    er: (blogContent, summary) => `
You are a database ER diagram expert. Create an Entity-Relationship diagram JSON from this technical content.

CONTENT:
${summary}

DETAILED CONTENT (First 2500 chars):
${blogContent.substring(0, 2500)}

ER DIAGRAM RULES:
- Extract 2-4 database entities (tables) from the content
- Include key fields for each entity (id, foreign keys, main attributes)
- Show relationships between entities

JSON SCHEMA:
{
  "entities": [
    {
      "name": "EntityName",
      "fields": [
        { "type": "int", "name": "id" },
        { "type": "string", "name": "fieldName" }
      ]
    }
  ],
  "relations": [
    { "from": "Entity1", "to": "Entity2", "label": "relationship" }
  ]
}

EXAMPLE (Blog System):
{
  "entities": [
    {
      "name": "User",
      "fields": [
        { "type": "int", "name": "id" },
        { "type": "string", "name": "username" },
        { "type": "string", "name": "email" }
      ]
    },
    {
      "name": "Blog",
      "fields": [
        { "type": "int", "name": "id" },
        { "type": "int", "name": "userId" },
        { "type": "string", "name": "title" },
        { "type": "text", "name": "content" }
      ]
    }
  ],
  "relations": [
    { "from": "User", "to": "Blog", "label": "writes" }
  ]
}

CRITICAL REQUIREMENTS:
- ONLY return valid JSON matching the schema above
- Entity names: PascalCase (e.g., "User", "Order")
- Field types: int, string, text, boolean, date, float
- Field names: camelCase (e.g., "userId", "createdAt")
- Always include "id" field as first field

GENERATE THE ER DIAGRAM JSON NOW:
`,

    // --------------------- STATE DIAGRAM ---------------------
    state: (blogContent, summary) => `
You are a state diagram expert. Create a state diagram JSON from this technical content.

CONTENT:
${summary}

DETAILED CONTENT (First 2500 chars):
${blogContent.substring(0, 2500)}

STATE DIAGRAM RULES:
- Identify 3-6 distinct states in the lifecycle/workflow
- Show transitions between states with trigger events

JSON SCHEMA:
{
  "states": [
    { "name": "StateName" }
  ],
  "transitions": [
    { "from": "State1", "to": "State2", "label": "trigger event" }
  ]
}

EXAMPLE (Order Processing):
{
  "states": [
    { "name": "Pending" },
    { "name": "Processing" },
    { "name": "Shipped" },
    { "name": "Delivered" },
    { "name": "Cancelled" }
  ],
  "transitions": [
    { "from": "Pending", "to": "Processing", "label": "confirm payment" },
    { "from": "Processing", "to": "Shipped", "label": "dispatch" },
    { "from": "Shipped", "to": "Delivered", "label": "arrive" },
    { "from": "Pending", "to": "Cancelled", "label": "timeout" }
  ]
}

CRITICAL REQUIREMENTS:
- ONLY return valid JSON matching the schema above
- State names: PascalCase (e.g., "Idle", "Running")
- Transition labels: lowercase action verbs (e.g., "start", "stop", "error")
- Minimum 3 states, maximum 8 states

GENERATE THE STATE DIAGRAM JSON NOW:
`,

    // --------------------- MINDMAP ---------------------
    mindmap: (blogContent, summary) => `
You are a mindmap expert. Create a hierarchical mindmap JSON from this technical content.

CONTENT:
${summary}

DETAILED CONTENT (First 2500 chars):
${blogContent.substring(0, 2500)}

MINDMAP RULES:
- Root node = main topic/concept
- 2-4 primary branches (main categories)
- 2-3 sub-branches per primary branch
- Maximum 3 levels deep

JSON SCHEMA:
{
  "root": {
    "text": "Main Topic",
    "children": [
      {
        "text": "Category 1",
        "children": [
          { "text": "Subconcept 1" },
          { "text": "Subconcept 2" }
        ]
      }
    ]
  }
}

EXAMPLE (React 19 Features):
{
  "root": {
    "text": "React 19",
    "children": [
      {
        "text": "New APIs",
        "children": [
          { "text": "use() hook" },
          { "text": "Actions" }
        ]
      },
      {
        "text": "Performance",
        "children": [
          { "text": "Server Components" },
          { "text": "Auto Batching" }
        ]
      },
      {
        "text": "Developer Experience",
        "children": [
          { "text": "Better Suspense" },
          { "text": "Simplified Forms" }
        ]
      }
    ]
  }
}

CRITICAL REQUIREMENTS:
- ONLY return valid JSON matching the schema above
- Text: Short phrases (2-4 words max)
- 2-4 primary children, 2-3 secondary children each
- Focus on hierarchical relationships

GENERATE THE MINDMAP JSON NOW:
`,

    // --------------------- PIE CHART ---------------------
    pie: (blogContent, summary) => `
You are a data visualization expert. Create a pie chart JSON from this technical content.

CONTENT:
${summary}

DETAILED CONTENT (First 2500 chars):
${blogContent.substring(0, 2500)}

PIE CHART RULES:
- Extract quantitative data, percentages, or proportions
- 3-6 slices (not too many)
- Values should sum to 100 (if percentages) or be meaningful proportions

JSON SCHEMA:
{
  "title": "Chart Title",
  "slices": [
    { "label": "Category 1", "value": 45 },
    { "label": "Category 2", "value": 30 }
  ]
}

EXAMPLE (Browser Usage):
{
  "title": "Browser Market Share 2024",
  "slices": [
    { "label": "Chrome", "value": 65 },
    { "label": "Safari", "value": 18 },
    { "label": "Firefox", "value": 10 },
    { "label": "Edge", "value": 5 },
    { "label": "Others", "value": 2 }
  ]
}

CRITICAL REQUIREMENTS:
- ONLY return valid JSON matching the schema above
- Values: positive numbers (integers or floats)
- Labels: concise (1-3 words)
- If no clear numerical data exists, SKIP this diagram type

GENERATE THE PIE CHART JSON NOW:
`,

    // --------------------- TIMELINE ---------------------
    timeline: (blogContent, summary) => `
You are a timeline visualization expert. Create a timeline JSON from this technical content.

CONTENT:
${summary}

DETAILED CONTENT (First 2500 chars):
${blogContent.substring(0, 2500)}

TIMELINE RULES:
- Extract chronological events, releases, or milestones
- 4-8 events in time order
- Include dates or version numbers

JSON SCHEMA:
{
  "events": [
    { "date": "2024-01", "title": "Event description" },
    { "year": "2024", "title": "Event description" }
  ]
}

EXAMPLE (React Releases):
{
  "events": [
    { "date": "2023-03", "title": "React 18.0 Released" },
    { "date": "2023-06", "title": "React 18.2 - Bug Fixes" },
    { "date": "2024-01", "title": "React 19 RC Announced" },
    { "date": "2024-04", "title": "React 19 Stable Release" }
  ]
}

CRITICAL REQUIREMENTS:
- ONLY return valid JSON matching the schema above
- Use "date" (YYYY-MM) or "year" (YYYY) format
- Titles: concise event descriptions (max 8 words)
- Chronological order (earliest to latest)

GENERATE THE TIMELINE JSON NOW:
`
};

// ============================================================
// HELPER: Get Prompt by Type
// ============================================================

export function getGenerationPrompt(type, blogContent, summary) {
    const normalizedType = type.toLowerCase().trim();
    const promptFunc = GENERATION_PROMPTS[normalizedType];

    if (!promptFunc) {
        throw new Error(`No prompt template found for diagram type: ${type}`);
    }

    return promptFunc(blogContent, summary);
}

// ============================================================
// EXPORT ALL
// ============================================================

export default {
    ANALYSIS_PROMPT,
    GENERATION_PROMPTS,
    getGenerationPrompt
};