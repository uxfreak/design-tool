# Design Tool - Generative Analysis Specification

## Abstract
The Design Tool is a desktop application for React project management with integrated development assistance. Following Generative Analysis methodology, this document serves as the definitive source of truth for the system's purpose, structure, and behavior.

## Table of Contents
1. [Purpose and Abstraction Level](#purpose-and-abstraction-level)
2. [System Propositions (Ontology)](#system-propositions-ontology)
3. [System Requirements (Behavior)](#system-requirements-behavior)
4. [Implementation Architecture](#implementation-architecture)
5. [Communication Patterns](#communication-patterns)
6. [Quality Assurance](#quality-assurance)

---

## Purpose and Abstraction Level

### Purpose Definition
**What are the goals of this abstraction?**
To create a desktop application that enables React developers to bootstrap projects, discover components, manage development servers, and receive AI development assistance through an integrated terminal interface.

**Who will benefit?**
- React developers who need project management tools
- Teams building component libraries
- Developers who want AI-assisted development workflow
- Anyone learning React development patterns

**What, specifically, are those benefits?**
- Reduce project setup time from hours to minutes
- Automate component discovery and documentation
- Provide live development server management
- Integrate Claude Code assistance with project context
- Enable real-time component preview and testing

**How will we measure those benefits?**
- Project creation time < 2 minutes for standard templates
- Component discovery accuracy > 95% for standard React patterns
- Development server startup success rate > 98%
- Terminal session persistence across 100% of navigation events
- Zero data loss during project management operations

### Abstraction Level
This specification operates at the **system design level** - precise enough to generate implementation code while remaining abstract enough to be implementation-agnostic. The level includes entity relationships, behavioral requirements, and interface contracts, but excludes specific code implementations and UI styling details.

---

## System Propositions (Ontology)

### P1: Application Architecture
**P1.1**: One (1) Design Tool application has exactly one (1) Electron main process.
**P1.2**: One (1) Electron main process has exactly one (1) Electron renderer process.
**P1.3**: One (1) Electron renderer process communicates with one (1) main process via secure IPC.

### P2: Projects and Templates
**P2.1**: One (1) Design Tool manages zero or many (0..*) React projects.
**P2.2**: One (1) React project is created from exactly one (1) project template.
**P2.3**: One (1) project template defines exactly one (1) set of scaffolding rules.
**P2.4**: A React project has a unique identifier, name, filesystem path, template reference, creation timestamp, and modification timestamp.
**P2.5**: A project template has an identifier, display name, description, dependency list, and feature list.

### P3: Development Servers
**P3.1**: One (1) React project can have zero or one (0..1) active development server.
**P3.2**: One (1) development server runs on exactly one (1) network port.
**P3.3**: One (1) development server belongs to exactly one (1) React project.
**P3.4**: A development server has a process identifier, network port, status, start time, and project reference.

### P4: Component Discovery System
**P4.1**: One (1) React project contains zero or many (0..*) React components.
**P4.2**: One (1) React component can have zero or many (0..*) component variants.
**P4.3**: One (1) component variant defines exactly one (1) set of component properties.
**P4.4**: A React component has a name, file path, export type, and variant collection.
**P4.5**: A component variant has a name, property set, and optional description.

### P5: Terminal Integration
**P5.1**: One (1) Design Tool has exactly one (1) terminal sidebar.
**P5.2**: One (1) terminal sidebar can have zero or many (0..*) PTY sessions.
**P5.3**: One (1) PTY session belongs to exactly one (1) terminal sidebar.
**P5.4**: One (1) PTY session has exactly one (1) context environment.
**P5.5**: A PTY session has a process identifier, working directory, context data, and lifecycle status.

### P6: Settings and Persistence
**P6.1**: One (1) Design Tool has exactly one (1) settings configuration.
**P6.2**: One (1) settings configuration persists in exactly one (1) electron-store instance.
**P6.3**: A settings configuration has a projects directory, default template, port range, and user preferences.

### P7: User Interface Structure
**P7.1**: One (1) Design Tool has exactly one (1) main window.
**P7.2**: One (1) main window contains exactly one (1) view container.
**P7.3**: One (1) view container displays exactly one (1) active view at any time.
**P7.4**: Active views include dashboard view, project viewer, and settings modal.

---

## System Requirements (Behavior)

### R1: Project Management
**R1.1**: The system SHALL create new React projects using specified templates.
**R1.2**: The system SHALL validate project names for uniqueness and filesystem compatibility.
**R1.3**: The system SHALL display real-time progress during project creation.
**R1.4**: The system SHALL persist project metadata in a project registry.
**R1.5**: The system SHALL allow users to delete projects with confirmation dialogs.
**R1.6**: The system SHALL prevent duplicate project names in the same directory.

### R2: Development Server Management
**R2.1**: The system SHALL start development servers automatically when projects are opened.
**R2.2**: The system SHALL allocate unique ports for each development server.
**R2.3**: The system SHALL monitor development server health and status.
**R2.4**: The system SHALL provide manual start/stop controls for development servers.
**R2.5**: The system SHALL gracefully terminate all servers when the application exits.
**R2.6**: The system SHALL retry server startup on port conflicts.

### R3: Component Discovery
**R3.1**: The system SHALL scan project files to identify React components.
**R3.2**: The system SHALL extract component variants from source code patterns.
**R3.3**: The system SHALL display components in a browsable library interface.
**R3.4**: The system SHALL provide live preview of component variants.
**R3.5**: The system SHALL update component library when files change.
**R3.6**: The system SHALL handle components with no variants gracefully.

### R4: Terminal Integration
**R4.1**: The system SHALL provide an embedded terminal with full shell access.
**R4.2**: The system SHALL inject project context into terminal environment.
**R4.3**: The system SHALL maintain terminal sessions across navigation.
**R4.4**: The system SHALL support Claude Code integration with project awareness.
**R4.5**: The system SHALL provide terminal controls for clear and restart operations.
**R4.6**: The system SHALL handle terminal process failures gracefully.

### R5: User Interface
**R5.1**: The system SHALL provide a dashboard view for project management.
**R5.2**: The system SHALL provide a project viewer with component and workflow tabs.
**R5.3**: The system SHALL provide a settings interface for configuration.
**R5.4**: The system SHALL maintain consistent dark theme across all interfaces.
**R5.5**: The system SHALL provide responsive layouts for different window sizes.
**R5.6**: The system SHALL show loading states during asynchronous operations.

### R6: Data Persistence
**R6.1**: The system SHALL persist all settings using electron-store.
**R6.2**: The system SHALL maintain project registry across application sessions.
**R6.3**: The system SHALL validate data integrity on startup.
**R6.4**: The system SHALL provide settings reset functionality.
**R6.5**: The system SHALL handle corrupted data gracefully with defaults.

### R7: Error Handling
**R7.1**: The system SHALL display user-friendly error messages for all failure cases.
**R7.2**: The system SHALL log detailed error information for debugging.
**R7.3**: The system SHALL prevent data loss during error conditions.
**R7.4**: The system SHALL provide recovery options for common failure scenarios.
**R7.5**: The system SHALL isolate component failures to prevent application crashes.

### R8: Security
**R8.1**: The system SHALL use context isolation for all IPC communication.
**R8.2**: The system SHALL disable node integration in renderer processes.
**R8.3**: The system SHALL validate all user inputs before processing.
**R8.4**: The system SHALL use secure defaults for all configuration options.
**R8.5**: The system SHALL prevent execution of untrusted code.

---

## Implementation Architecture

### Functional Programming Approach
The system follows functional programming principles:
- **Pure Functions**: All business logic implemented as pure functions without side effects
- **Immutable Data**: State updates create new objects rather than mutating existing ones
- **Function Composition**: Complex behaviors built from simple, composable functions
- **Error Handling**: Using Result types rather than exceptions for predictable error flows

### Process Architecture
```
Main Process (Node.js)
├── Project Management (main.js)
├── Development Server Management  
├── PTY Terminal Management
├── Settings Persistence (electron-store)
└── IPC Handler Registry

Renderer Process (Chromium)
├── React Frontend (app.js)
├── Project Dashboard
├── Component Library Viewer
├── Terminal UI (xterm.js)
└── Settings Interface
```

### External Processes
```
React Development Servers
├── Port 3000, 3001, 3002+ (auto-allocated)
├── create-react-app based
└── Environment variable injection

PTY Terminal Sessions
├── Shell processes (bash/powershell)
├── Claude Code integration
└── Project context injection
```

### Communication Patterns
- **IPC Events**: Secure communication via contextBridge
- **Event Streams**: Progress updates during long operations
- **State Management**: Centralized application state in renderer
- **Context Injection**: Environment variables for external processes

---

## Communication Patterns

### IPC Communication Model
Following the NLP-based communication model from Generative Analysis:

**Map vs Territory Principle**: IPC messages are maps (representations) of the actual system state (territory). All IPC communication must account for:
- **Distortion**: Message content may be modified during transmission
- **Deletion**: Required information may be missing from messages
- **Generalization**: Specific details may be replaced with general rules

**Trust No One Principle**: All IPC messages are validated before processing:
```javascript
// Example validation pattern
function validateCreateProjectRequest(data) {
  if (!data.name || typeof data.name !== 'string') {
    return { success: false, error: 'Project name is required' };
  }
  if (!data.templateId || !VALID_TEMPLATES.includes(data.templateId)) {
    return { success: false, error: 'Invalid template specified' };
  }
  return { success: true };
}
```

### Context Awareness System
The terminal integration provides context-aware assistance by injecting environment variables:
```bash
export DESIGN_TOOL_PROJECT_ID="proj_123"
export DESIGN_TOOL_PROJECT_NAME="My App"  
export DESIGN_TOOL_PROJECT_PATH="/path/to/project"
export DESIGN_TOOL_CURRENT_VIEW="component-library"
export DESIGN_TOOL_SERVER_URL="http://localhost:3001"
```

This context enables Claude Code to provide project-specific assistance without additional prompting.

---

## Quality Assurance

### Functional Verification
Following Generative Analysis principles, all functions must be:
1. **Purpose-Defined**: Each function has a clear, measurable purpose
2. **Utility-Validated**: Functions include only details relevant to their purpose
3. **Abstraction-Consistent**: Functions operate at appropriate abstraction levels
4. **Reality-Tested**: Functions are verified against actual user workflows

### Testing Strategy
```javascript
// Example pure function test
describe('createProjectPlan()', () => {
  it('should generate valid project plan for react-basic template', () => {
    const config = { name: 'test-app', templateId: 'react-basic' };
    const plan = createProjectPlan(config);
    
    expect(plan).toHaveProperty('steps');
    expect(plan.steps).toHaveLength(4);
    expect(plan.name).toBe('test-app');
  });
});
```

### Quality Metrics
- **Function Purity**: 100% of business logic functions are pure
- **Error Handling**: 100% of operations return Result types
- **Test Coverage**: >90% for all pure functions
- **Documentation Currency**: All propositions and requirements current with implementation

---

This document serves as the definitive specification for the Design Tool system, following Generative Analysis methodology to ensure precision, clarity, and maintainability.
