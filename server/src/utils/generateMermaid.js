// utils/generateMermaid.js (Backend Version)

/**
 * Convert diagram JSON structure to Mermaid syntax
 * Backend-compatible version for Node.js
 */

// ============================================================
// CENTRAL ROUTER FUNCTION
// ============================================================

export function generateMermaid(json = {}, type = "flowchart") {
    try {
        console.log('[GENERATE_MERMAID] 🎨 Generating Mermaid code for type:', type);
        console.log('[GENERATE_MERMAID] 📊 JSON structure:', JSON.stringify(json).substring(0, 200) + '...');

        const normalizedType = type.toLowerCase().trim();

        switch (normalizedType) {
            case "flowchart":
                return generateFlowchart(json);

            case "sequence":
                return generateSequence(json);

            case "class":
                return generateClass(json);

            case "er":
            case "entity":
            case "entity relationship":
                return generateER(json);

            case "state":
                return generateState(json);

            case "gantt":
                return generateGantt(json);

            case "journey":
            case "user journey":
                return generateJourney(json);

            case "mindmap":
                return generateMindmap(json);

            case "pie":
                return generatePie(json);

            case "timeline":
                return generateTimeline(json);

            case "requirement":
                return generateRequirement(json);

            case "sankey":
                return generateSankey(json);

            case "usecase":
                return generateUsecase(json);

            case "tree":
                return generateTree(json);

            default:
                console.error('[GENERATE_MERMAID] ❌ Unsupported diagram type:', type);
                return `%% ❌ Unsupported diagram type: ${type}`;
        }
    } catch (err) {
        console.error('[GENERATE_MERMAID] ❌ Error generating diagram:', err.message);
        return `%% ⚠ Error generating ${type} diagram: ${err.message}`;
    }
}

// ============================================================
// INDIVIDUAL DIAGRAM TYPE GENERATORS
// ============================================================

// --------------------- FLOWCHART ---------------------
function generateFlowchart(json) {
    console.log('[GENERATE_MERMAID] 🔄 Generating flowchart...');

    let code = "flowchart TD\n";

    // Add nodes
    if (json.nodes && Array.isArray(json.nodes)) {
        json.nodes.forEach((node) => {
            if (typeof node === 'string') {
                // Simple string node
                code += `  ${node}["${node}"]\n`;
            } else if (node && typeof node === 'object') {
                // Object with id and label
                const id = node.id || 'node';
                const label = node.label || node.id || 'Node';
                code += `  ${id}["${label}"]\n`;
            }
        });
    }

    // Add edges
    if (json.edges && Array.isArray(json.edges)) {
        json.edges.forEach((edge) => {
            if (edge && edge.from && edge.to) {
                const label = edge.label ? `|${edge.label}|` : '';
                code += `  ${edge.from} -->${label} ${edge.to}\n`;
            }
        });
    }

    console.log('[GENERATE_MERMAID] ✅ Flowchart generated');
    return code;
}

// --------------------- SEQUENCE DIAGRAM ---------------------
function generateSequence(json) {
    console.log('[GENERATE_MERMAID] 📨 Generating sequence diagram...');

    let code = "sequenceDiagram\n";

    if (json.messages && Array.isArray(json.messages)) {
        json.messages.forEach((msg) => {
            if (msg && msg.from && msg.to && msg.message) {
                code += `  ${msg.from}->>${msg.to}: ${msg.message}\n`;
            }
        });
    }

    console.log('[GENERATE_MERMAID] ✅ Sequence diagram generated');
    return code;
}

// --------------------- CLASS DIAGRAM ---------------------
function generateClass(json) {
    console.log('[GENERATE_MERMAID] 🏛️ Generating class diagram...');

    let code = "classDiagram\n";

    // Add classes
    if (json.classes && Array.isArray(json.classes)) {
        json.classes.forEach((cls) => {
            if (cls && cls.name) {
                code += `  class ${cls.name} {\n`;

                // Add attributes
                if (cls.attributes && Array.isArray(cls.attributes)) {
                    cls.attributes.forEach((attr) => {
                        code += `    ${attr}\n`;
                    });
                }

                // Add methods
                if (cls.methods && Array.isArray(cls.methods)) {
                    cls.methods.forEach((method) => {
                        code += `    ${method}()\n`;
                    });
                }

                code += "  }\n";
            }
        });
    }

    // Add relations
    if (json.relations && Array.isArray(json.relations)) {
        json.relations.forEach((rel) => {
            if (rel && rel.from && rel.to) {
                const relType = rel.type === 'inherits' || rel.type === 'extends' ? '<|--' : '-->';
                code += `  ${rel.from} ${relType} ${rel.to}\n`;
            }
        });
    }

    console.log('[GENERATE_MERMAID] ✅ Class diagram generated');
    return code;
}

// --------------------- ER DIAGRAM ---------------------
function generateER(json) {
    console.log('[GENERATE_MERMAID] 🗄️ Generating ER diagram...');

    let code = "erDiagram\n";

    // Add entities
    if (json.entities && Array.isArray(json.entities)) {
        json.entities.forEach((entity) => {
            if (entity && entity.name) {
                code += `  ${entity.name} {\n`;

                // Add fields
                if (entity.fields && Array.isArray(entity.fields)) {
                    entity.fields.forEach((field) => {
                        if (field && field.type && field.name) {
                            code += `    ${field.type} ${field.name}\n`;
                        }
                    });
                }

                code += "  }\n";
            }
        });
    }

    // Add relations
    if (json.relations && Array.isArray(json.relations)) {
        json.relations.forEach((rel) => {
            if (rel && rel.from && rel.to) {
                const label = rel.label || 'relates';
                code += `  ${rel.from} ||--o{ ${rel.to} : ${label}\n`;
            }
        });
    }

    console.log('[GENERATE_MERMAID] ✅ ER diagram generated');
    return code;
}

// --------------------- STATE DIAGRAM ---------------------
function generateState(json) {
    console.log('[GENERATE_MERMAID] 🔀 Generating state diagram...');

    let code = "stateDiagram-v2\n";

    // Add states
    if (json.states && Array.isArray(json.states)) {
        json.states.forEach((state) => {
            if (typeof state === 'string') {
                code += `  state ${state}\n`;
            } else if (state && state.name) {
                code += `  state ${state.name}\n`;
            }
        });
    }

    // Add transitions
    if (json.transitions && Array.isArray(json.transitions)) {
        json.transitions.forEach((trans) => {
            if (trans && trans.from && trans.to) {
                const label = trans.label || '';
                code += `  ${trans.from} --> ${trans.to}: ${label}\n`;
            }
        });
    }

    console.log('[GENERATE_MERMAID] ✅ State diagram generated');
    return code;
}

// --------------------- GANTT CHART ---------------------
function generateGantt(json) {
    console.log('[GENERATE_MERMAID] 📅 Generating Gantt chart...');

    let code = "gantt\n";
    code += `  dateFormat  YYYY-MM-DD\n`;
    code += `  title ${json.title || "Project Timeline"}\n`;

    if (json.tasks && Array.isArray(json.tasks)) {
        let currentSection = '';

        json.tasks.forEach((task) => {
            if (task) {
                // Add section if changed
                const section = task.section || "Tasks";
                if (section !== currentSection) {
                    code += `  section ${section}\n`;
                    currentSection = section;
                }

                // Add task
                if (task.name && task.start && task.duration) {
                    const id = task.id || '';
                    code += `  ${task.name} :${id}, ${task.start}, ${task.duration}d\n`;
                }
            }
        });
    }

    console.log('[GENERATE_MERMAID] ✅ Gantt chart generated');
    return code;
}

// --------------------- USER JOURNEY ---------------------
function generateJourney(json) {
    console.log('[GENERATE_MERMAID] 🚶 Generating user journey...');

    let code = "journey\n";
    code += `  title ${json.title || "User Journey"}\n`;

    if (json.sections && Array.isArray(json.sections)) {
        json.sections.forEach((section) => {
            if (section && section.name) {
                code += `  section ${section.name}\n`;

                if (section.steps && Array.isArray(section.steps)) {
                    section.steps.forEach((step) => {
                        if (step && step.user && step.action && step.mood) {
                            code += `    ${step.user}: ${step.action}: ${step.mood}\n`;
                        }
                    });
                }
            }
        });
    }

    console.log('[GENERATE_MERMAID] ✅ User journey generated');
    return code;
}

// --------------------- MINDMAP ---------------------
function generateMindmap(json) {
    console.log('[GENERATE_MERMAID] 🧠 Generating mindmap...');

    let code = "mindmap\n";

    function traverse(node, indent = 1) {
        if (!node) return;

        const space = "  ".repeat(indent);
        const text = node.text || node.label || 'Node';
        code += `${space}${text}\n`;

        if (node.children && Array.isArray(node.children)) {
            node.children.forEach((child) => traverse(child, indent + 1));
        }
    }

    const root = json.root || json;
    traverse(root);

    console.log('[GENERATE_MERMAID] ✅ Mindmap generated');
    return code;
}

// --------------------- PIE CHART ---------------------
function generatePie(json) {
    console.log('[GENERATE_MERMAID] 🥧 Generating pie chart...');

    let code = `pie title ${json.title || "Pie Chart"}\n`;

    if (json.slices && Array.isArray(json.slices)) {
        json.slices.forEach((slice) => {
            if (slice && slice.label && slice.value !== undefined) {
                code += `  "${slice.label}" : ${slice.value}\n`;
            }
        });
    }

    console.log('[GENERATE_MERMAID] ✅ Pie chart generated');
    return code;
}

// --------------------- TIMELINE ---------------------
function generateTimeline(json) {
    console.log('[GENERATE_MERMAID] ⏰ Generating timeline...');

    let code = "timeline\n";

    if (json.events && Array.isArray(json.events)) {
        json.events.forEach((event) => {
            if (event && (event.date || event.year) && event.title) {
                const time = event.date || event.year;
                code += `  ${time}: ${event.title}\n`;
            }
        });
    }

    console.log('[GENERATE_MERMAID] ✅ Timeline generated');
    return code;
}

// --------------------- REQUIREMENT DIAGRAM ---------------------
function generateRequirement(json) {
    console.log('[GENERATE_MERMAID] 📋 Generating requirement diagram...');

    let code = "requirementDiagram\n";

    if (json.requirements && Array.isArray(json.requirements)) {
        json.requirements.forEach((req) => {
            if (req && req.id && req.text) {
                code += `  requirement ${req.id} {\n`;
                code += `    text : ${req.text}\n`;
                code += `    risk : ${req.risk || 'Low'}\n`;
                code += `    verifymethod : ${req.verify || 'Test'}\n`;
                code += `  }\n`;
            }
        });
    }

    console.log('[GENERATE_MERMAID] ✅ Requirement diagram generated');
    return code;
}

// --------------------- SANKEY DIAGRAM ---------------------
function generateSankey(json) {
    console.log('[GENERATE_MERMAID] 🌊 Generating Sankey diagram...');

    let code = "sankey-beta\n";

    if (json.links && Array.isArray(json.links)) {
        json.links.forEach((link) => {
            if (link && link.from && link.to && link.value !== undefined) {
                code += `  ${link.from}["${link.from}"] ${link.value} ${link.to}["${link.to}"]\n`;
            }
        });
    }

    console.log('[GENERATE_MERMAID] ✅ Sankey diagram generated');
    return code;
}

// --------------------- USE CASE DIAGRAM ---------------------
function generateUsecase(json) {
    console.log('[GENERATE_MERMAID] 👤 Generating use case diagram...');

    let code = "flowchart TD\n";

    // Add actors
    if (json.actors && Array.isArray(json.actors)) {
        json.actors.forEach((actor) => {
            if (typeof actor === 'string') {
                code += `  ${actor}["👤 ${actor}"]\n`;
            } else if (actor && (actor.id || actor.label)) {
                const id = actor.id || actor.label;
                const label = actor.label || actor.id;
                code += `  ${id}["👤 ${label}"]\n`;
            }
        });
    }

    // Add use cases
    if (json.usecases && Array.isArray(json.usecases)) {
        json.usecases.forEach((usecase) => {
            if (typeof usecase === 'string') {
                code += `  ${usecase}((${usecase}))\n`;
            } else if (usecase && (usecase.id || usecase.label)) {
                const id = usecase.id || usecase.label;
                const label = usecase.label || usecase.id;
                code += `  ${id}((${label}))\n`;
            }
        });
    }

    // Add relations
    if (json.relations && Array.isArray(json.relations)) {
        json.relations.forEach((rel) => {
            if (rel && rel.actor && rel.usecase) {
                code += `  ${rel.actor} --> ${rel.usecase}\n`;
            }
        });
    }

    console.log('[GENERATE_MERMAID] ✅ Use case diagram generated');
    return code;
}

// --------------------- TREE DIAGRAM ---------------------
function generateTree(json) {
    console.log('[GENERATE_MERMAID] 🌳 Generating tree diagram...');

    let code = "graph TD\n";

    function traverse(node, parent = null) {
        if (!node) return;

        const id = node.id || node.name || node.text || 'node';
        const label = node.label || node.name || node.text || 'Node';

        code += `  ${id}["${label}"]\n`;

        if (parent) {
            code += `  ${parent} --> ${id}\n`;
        }

        if (node.children && Array.isArray(node.children)) {
            node.children.forEach((child) => traverse(child, id));
        }
    }

    const root = json.root || json;
    traverse(root);

    console.log('[GENERATE_MERMAID] ✅ Tree diagram generated');
    return code;
}

// ============================================================
// EXPORT
// ============================================================

export default {
    generateMermaid
};