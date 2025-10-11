// utils/diagramValidation.js

/**
 * JSON Schema Validation for Generated Diagrams
 * Ensures AI-generated JSON matches expected structure before converting to Mermaid
 */

// ============================================================
// VALIDATION RESULT STRUCTURE
// ============================================================

class ValidationResult {
    constructor(isValid, errors = [], warnings = []) {
        this.isValid = isValid;
        this.errors = errors;
        this.warnings = warnings;
    }

    addError(message) {
        this.errors.push(message);
        this.isValid = false;
    }

    addWarning(message) {
        this.warnings.push(message);
    }

    static success() {
        return new ValidationResult(true, [], []);
    }

    static failure(errors) {
        return new ValidationResult(false, Array.isArray(errors) ? errors : [errors], []);
    }
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

function isNonEmptyArray(value) {
    return Array.isArray(value) && value.length > 0;
}

function isValidNumber(value) {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

// ============================================================
// TYPE-SPECIFIC VALIDATORS
// ============================================================

// --------------------- FLOWCHART ---------------------
function validateFlowchart(json) {
    const result = new ValidationResult(true);

    // Check required fields
    if (!json.nodes || !isNonEmptyArray(json.nodes)) {
        result.addError('Flowchart must have a non-empty "nodes" array');
    }

    if (!json.edges || !Array.isArray(json.edges)) {
        result.addError('Flowchart must have an "edges" array (can be empty)');
    }

    if (!result.isValid) return result;

    // Validate nodes
    const nodeIds = new Set();
    json.nodes.forEach((node, index) => {
        if (typeof node === 'string') {
            // Simple string node
            nodeIds.add(node);
        } else if (typeof node === 'object' && node !== null) {
            // Object node with id and label
            if (!node.id || !isNonEmptyString(node.id)) {
                result.addError(`Node at index ${index} missing valid "id"`);
            } else {
                nodeIds.add(node.id);
            }

            if (!node.label || !isNonEmptyString(node.label)) {
                result.addError(`Node at index ${index} missing valid "label"`);
            }

            // Warn if label is too long
            if (node.label && node.label.length > 50) {
                result.addWarning(`Node "${node.id}" has a long label (${node.label.length} chars). Consider shortening.`);
            }
        } else {
            result.addError(`Node at index ${index} must be a string or object with id/label`);
        }
    });

    // Validate edges
    if (json.edges && json.edges.length > 0) {
        json.edges.forEach((edge, index) => {
            if (!edge.from || !isNonEmptyString(edge.from)) {
                result.addError(`Edge at index ${index} missing valid "from" field`);
            }

            if (!edge.to || !isNonEmptyString(edge.to)) {
                result.addError(`Edge at index ${index} missing valid "to" field`);
            }

            // Check if referenced nodes exist
            if (edge.from && !nodeIds.has(edge.from)) {
                result.addError(`Edge at index ${index} references non-existent node: "${edge.from}"`);
            }

            if (edge.to && !nodeIds.has(edge.to)) {
                result.addError(`Edge at index ${index} references non-existent node: "${edge.to}"`);
            }
        });
    } else {
        result.addWarning('Flowchart has no edges. Nodes will be disconnected.');
    }

    // Check node count
    if (json.nodes.length < 2) {
        result.addWarning('Flowchart has fewer than 2 nodes. Consider adding more detail.');
    }

    if (json.nodes.length > 15) {
        result.addWarning('Flowchart has more than 15 nodes. Consider simplifying for clarity.');
    }

    return result;
}

// --------------------- SEQUENCE DIAGRAM ---------------------
function validateSequence(json) {
    const result = new ValidationResult(true);

    // Check required fields
    if (!json.messages || !isNonEmptyArray(json.messages)) {
        result.addError('Sequence diagram must have a non-empty "messages" array');
        return result;
    }

    // Track participants
    const participants = new Set();

    // Validate messages
    json.messages.forEach((msg, index) => {
        if (!msg.from || !isNonEmptyString(msg.from)) {
            result.addError(`Message at index ${index} missing valid "from" field`);
        } else {
            participants.add(msg.from);
        }

        if (!msg.to || !isNonEmptyString(msg.to)) {
            result.addError(`Message at index ${index} missing valid "to" field`);
        } else {
            participants.add(msg.to);
        }

        if (!msg.message || !isNonEmptyString(msg.message)) {
            result.addError(`Message at index ${index} missing valid "message" field`);
        }

        // Warn if message text is too long
        if (msg.message && msg.message.length > 60) {
            result.addWarning(`Message at index ${index} is very long (${msg.message.length} chars). Consider shortening.`);
        }
    });

    // Check message count
    if (json.messages.length < 2) {
        result.addWarning('Sequence diagram has fewer than 2 messages. Consider adding more interactions.');
    }

    if (json.messages.length > 20) {
        result.addWarning('Sequence diagram has more than 20 messages. Consider simplifying.');
    }

    // Check participant count
    if (participants.size < 2) {
        result.addError('Sequence diagram must have at least 2 participants');
    }

    if (participants.size > 8) {
        result.addWarning(`Sequence diagram has ${participants.size} participants. Consider simplifying.`);
    }

    return result;
}

// --------------------- CLASS DIAGRAM ---------------------
function validateClass(json) {
    const result = new ValidationResult(true);

    // Check required fields
    if (!json.classes || !isNonEmptyArray(json.classes)) {
        result.addError('Class diagram must have a non-empty "classes" array');
        return result;
    }

    // Track class names
    const classNames = new Set();

    // Validate classes
    json.classes.forEach((cls, index) => {
        if (!cls.name || !isNonEmptyString(cls.name)) {
            result.addError(`Class at index ${index} missing valid "name" field`);
        } else {
            if (classNames.has(cls.name)) {
                result.addError(`Duplicate class name: "${cls.name}"`);
            }
            classNames.add(cls.name);
        }

        // Attributes are optional but should be an array if present
        if (cls.attributes && !Array.isArray(cls.attributes)) {
            result.addError(`Class "${cls.name}" has invalid "attributes" (must be array)`);
        }

        // Methods are optional but should be an array if present
        if (cls.methods && !Array.isArray(cls.methods)) {
            result.addError(`Class "${cls.name}" has invalid "methods" (must be array)`);
        }

        // Warn if class has no attributes or methods
        if ((!cls.attributes || cls.attributes.length === 0) &&
            (!cls.methods || cls.methods.length === 0)) {
            result.addWarning(`Class "${cls.name}" has no attributes or methods`);
        }
    });

    // Validate relations (optional)
    if (json.relations && Array.isArray(json.relations)) {
        json.relations.forEach((rel, index) => {
            if (!rel.from || !isNonEmptyString(rel.from)) {
                result.addError(`Relation at index ${index} missing valid "from" field`);
            }

            if (!rel.to || !isNonEmptyString(rel.to)) {
                result.addError(`Relation at index ${index} missing valid "to" field`);
            }

            // Check if referenced classes exist
            if (rel.from && !classNames.has(rel.from)) {
                result.addError(`Relation at index ${index} references non-existent class: "${rel.from}"`);
            }

            if (rel.to && !classNames.has(rel.to)) {
                result.addError(`Relation at index ${index} references non-existent class: "${rel.to}"`);
            }
        });
    }

    return result;
}

// --------------------- ER DIAGRAM ---------------------
function validateER(json) {
    const result = new ValidationResult(true);

    // Check required fields
    if (!json.entities || !isNonEmptyArray(json.entities)) {
        result.addError('ER diagram must have a non-empty "entities" array');
        return result;
    }

    // Track entity names
    const entityNames = new Set();

    // Validate entities
    json.entities.forEach((entity, index) => {
        if (!entity.name || !isNonEmptyString(entity.name)) {
            result.addError(`Entity at index ${index} missing valid "name" field`);
        } else {
            if (entityNames.has(entity.name)) {
                result.addError(`Duplicate entity name: "${entity.name}"`);
            }
            entityNames.add(entity.name);
        }

        if (!entity.fields || !isNonEmptyArray(entity.fields)) {
            result.addError(`Entity "${entity.name}" must have a non-empty "fields" array`);
        } else {
            // Validate fields
            entity.fields.forEach((field, fieldIndex) => {
                if (!field.type || !isNonEmptyString(field.type)) {
                    result.addError(`Entity "${entity.name}", field at index ${fieldIndex} missing valid "type"`);
                }

                if (!field.name || !isNonEmptyString(field.name)) {
                    result.addError(`Entity "${entity.name}", field at index ${fieldIndex} missing valid "name"`);
                }
            });

            // Check if first field is "id"
            if (entity.fields[0] && entity.fields[0].name !== 'id') {
                result.addWarning(`Entity "${entity.name}" should typically start with an "id" field`);
            }
        }
    });

    // Validate relations (optional)
    if (json.relations && Array.isArray(json.relations)) {
        json.relations.forEach((rel, index) => {
            if (!rel.from || !isNonEmptyString(rel.from)) {
                result.addError(`Relation at index ${index} missing valid "from" field`);
            }

            if (!rel.to || !isNonEmptyString(rel.to)) {
                result.addError(`Relation at index ${index} missing valid "to" field`);
            }

            // Check if referenced entities exist
            if (rel.from && !entityNames.has(rel.from)) {
                result.addError(`Relation at index ${index} references non-existent entity: "${rel.from}"`);
            }

            if (rel.to && !entityNames.has(rel.to)) {
                result.addError(`Relation at index ${index} references non-existent entity: "${rel.to}"`);
            }
        });
    }

    return result;
}

// --------------------- STATE DIAGRAM ---------------------
function validateState(json) {
    const result = new ValidationResult(true);

    // Check required fields
    if (!json.states || !isNonEmptyArray(json.states)) {
        result.addError('State diagram must have a non-empty "states" array');
        return result;
    }

    if (!json.transitions || !Array.isArray(json.transitions)) {
        result.addError('State diagram must have a "transitions" array');
    }

    // Track state names
    const stateNames = new Set();

    // Validate states
    json.states.forEach((state, index) => {
        if (typeof state === 'string') {
            stateNames.add(state);
        } else if (typeof state === 'object' && state !== null) {
            if (!state.name || !isNonEmptyString(state.name)) {
                result.addError(`State at index ${index} missing valid "name" field`);
            } else {
                stateNames.add(state.name);
            }
        } else {
            result.addError(`State at index ${index} must be a string or object with "name"`);
        }
    });

    // Validate transitions
    if (json.transitions && json.transitions.length > 0) {
        json.transitions.forEach((trans, index) => {
            if (!trans.from || !isNonEmptyString(trans.from)) {
                result.addError(`Transition at index ${index} missing valid "from" field`);
            }

            if (!trans.to || !isNonEmptyString(trans.to)) {
                result.addError(`Transition at index ${index} missing valid "to" field`);
            }

            if (!trans.label || !isNonEmptyString(trans.label)) {
                result.addError(`Transition at index ${index} missing valid "label" field`);
            }

            // Check if referenced states exist
            if (trans.from && !stateNames.has(trans.from)) {
                result.addError(`Transition at index ${index} references non-existent state: "${trans.from}"`);
            }

            if (trans.to && !stateNames.has(trans.to)) {
                result.addError(`Transition at index ${index} references non-existent state: "${trans.to}"`);
            }
        });
    } else {
        result.addWarning('State diagram has no transitions. States will be disconnected.');
    }

    // Check state count
    if (json.states.length < 2) {
        result.addWarning('State diagram has fewer than 2 states.');
    }

    return result;
}

// --------------------- MINDMAP ---------------------
function validateMindmap(json) {
    const result = new ValidationResult(true);

    // Check root node
    if (!json.root || typeof json.root !== 'object') {
        result.addError('Mindmap must have a "root" object');
        return result;
    }

    // Recursive validation function
    function validateNode(node, path = 'root') {
        if (!node.text || !isNonEmptyString(node.text)) {
            result.addError(`Node at path "${path}" missing valid "text" field`);
        }

        if (node.text && node.text.length > 40) {
            result.addWarning(`Node at path "${path}" has long text (${node.text.length} chars)`);
        }

        if (node.children) {
            if (!Array.isArray(node.children)) {
                result.addError(`Node at path "${path}" has invalid "children" (must be array)`);
            } else {
                node.children.forEach((child, index) => {
                    validateNode(child, `${path}.children[${index}]`);
                });
            }
        }
    }

    validateNode(json.root);

    return result;
}

// --------------------- PIE CHART ---------------------
function validatePie(json) {
    const result = new ValidationResult(true);

    // Check title (optional)
    if (json.title && !isNonEmptyString(json.title)) {
        result.addError('Pie chart "title" must be a non-empty string if provided');
    }

    // Check slices
    if (!json.slices || !isNonEmptyArray(json.slices)) {
        result.addError('Pie chart must have a non-empty "slices" array');
        return result;
    }

    // Validate slices
    let totalValue = 0;
    json.slices.forEach((slice, index) => {
        if (!slice.label || !isNonEmptyString(slice.label)) {
            result.addError(`Slice at index ${index} missing valid "label"`);
        }

        if (!isValidNumber(slice.value) || slice.value <= 0) {
            result.addError(`Slice at index ${index} missing valid positive "value"`);
        } else {
            totalValue += slice.value;
        }
    });

    // Check slice count
    if (json.slices.length < 2) {
        result.addWarning('Pie chart should have at least 2 slices');
    }

    if (json.slices.length > 8) {
        result.addWarning(`Pie chart has ${json.slices.length} slices. Consider grouping smaller values into "Others".`);
    }

    return result;
}

// --------------------- TIMELINE ---------------------
function validateTimeline(json) {
    const result = new ValidationResult(true);

    // Check events
    if (!json.events || !isNonEmptyArray(json.events)) {
        result.addError('Timeline must have a non-empty "events" array');
        return result;
    }

    // Validate events
    json.events.forEach((event, index) => {
        // Must have either "date" or "year"
        if (!event.date && !event.year) {
            result.addError(`Event at index ${index} must have either "date" or "year" field`);
        }

        if (!event.title || !isNonEmptyString(event.title)) {
            result.addError(`Event at index ${index} missing valid "title"`);
        }

        // Validate date format if present
        if (event.date && !/^\d{4}-\d{2}$/.test(event.date)) {
            result.addWarning(`Event at index ${index} has non-standard date format. Expected: YYYY-MM`);
        }

        // Validate year format if present
        if (event.year && !/^\d{4}$/.test(String(event.year))) {
            result.addWarning(`Event at index ${index} has invalid year format. Expected: YYYY`);
        }
    });

    // Check event count
    if (json.events.length < 2) {
        result.addWarning('Timeline should have at least 2 events');
    }

    return result;
}

// ============================================================
// MAIN VALIDATION ROUTER
// ============================================================

export function validateDiagramJSON(json, type) {
    if (!json || typeof json !== 'object') {
        return ValidationResult.failure('Invalid JSON: must be an object');
    }

    const normalizedType = type.toLowerCase().trim();

    switch (normalizedType) {
        case 'flowchart':
            return validateFlowchart(json);

        case 'sequence':
            return validateSequence(json);

        case 'class':
            return validateClass(json);

        case 'er':
        case 'entity':
        case 'entity relationship':
            return validateER(json);

        case 'state':
            return validateState(json);

        case 'mindmap':
            return validateMindmap(json);

        case 'pie':
            return validatePie(json);

        case 'timeline':
            return validateTimeline(json);

        default:
            return ValidationResult.failure(`Unsupported diagram type: ${type}`);
    }
}

// ============================================================
// EXPORT
// ============================================================

export default {
    validateDiagramJSON,
    ValidationResult
};