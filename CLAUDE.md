# Design Tool - Generative Analysis Source of Truth

## Project Purpose and Scope

**Purpose**: Create a desktop design tool that enables users to bootstrap React projects with Storybook, import components from Figma/web, and compose UIs using natural language via Claude Code MCP integration.

**Scope**: Initially focus on project setup and management functionality only, building incrementally with functional programming principles.

## Propositions (P1-P10) - Structural Relationships

### P1: ElectronApp Entity
An ElectronApp represents the main desktop application container that manages window lifecycle and system integration.
- Each ElectronApp has exactly one main process and zero or many renderer processes
- ElectronApp manages IPC communication between main and renderer processes

### P2: ProjectWorkspace Entity  
A ProjectWorkspace represents a collection of design projects managed by the application.
- Each ProjectWorkspace contains zero or many DesignProject entities
- ProjectWorkspace persists project metadata and provides project discovery

### P3: DesignProject Entity
A DesignProject represents a single design project with React + Storybook configuration.
- Each DesignProject has exactly one file system location (path)
- Each DesignProject has exactly one template type that defines its structure
- Each DesignProject can have zero or one active development server

### P4: ProjectTemplate Entity
A ProjectTemplate represents a pre-configured setup for creating new projects.
- Each ProjectTemplate defines file structure, dependencies, and build configuration
- ProjectTemplate supports variations: basic React, React + TypeScript, React + Storybook + Tailwind

### P5: DevelopmentServer Entity
A DevelopmentServer represents an active development process (Vite dev server, Storybook).
- Each DevelopmentServer belongs to exactly one DesignProject
- Each DevelopmentServer runs on exactly one network port
- DevelopmentServer lifecycle is managed by the ElectronApp

## Requirements (R1-R10) - Behavioral Specifications

### R1: Basic Electron Application
The system SHALL create a basic Electron desktop application that:
- Opens a main window on application start
- Handles window close/minimize/maximize events
- Properly shuts down when all windows are closed (except on macOS)
- Uses secure defaults for web preferences (no node integration, context isolation enabled)

### R2: Project Creation Workflow
The system SHALL enable users to create new design projects by:
- Presenting a project creation form with name and template selection
- Validating project name uniqueness and file system constraints  
- Scaffolding project structure using selected template
- Installing required dependencies via npm/yarn
- Opening the created project for immediate use

### R3: Project Management Interface
The system SHALL provide a project management interface that:
- Displays all existing projects in a grid or list view
- Shows project metadata (name, creation date, last modified, status)
- Allows opening, renaming, and deleting projects
- Persists project information between application sessions

### R4: Development Server Management
The system SHALL manage development servers by:
- Starting Vite dev server for React projects on unique ports
- Starting Storybook server when explicitly requested
- Monitoring server health and displaying status indicators
- Gracefully stopping servers when projects are closed or app exits

### R5: Incremental Feature Development
The system SHALL support incremental feature addition by:
- Using functional programming principles for all business logic
- Implementing pure functions that can be tested in isolation
- Following Generative Analysis documentation practices
- Enabling autonomous build/test/verify loops where possible

## Functional Architecture Principles

### FA1: Pure Function Implementation
All business logic SHALL be implemented as pure functions:
- Functions take inputs as parameters and return outputs without side effects
- Side effects (file I/O, network calls) are isolated in specific service layers
- Functions are easily composable and testable

### FA2: Immutable Data Structures
All data entities SHALL use immutable patterns:
- Project configurations are read-only after creation
- State updates create new objects rather than mutating existing ones
- This enables safe concurrent operations and undo/redo functionality

### FA3: Autonomous Development Loops
The system SHALL include autonomous monitoring capabilities:
- Automated build verification after code changes
- Health checks for development servers and project integrity
- Self-healing for common issues (port conflicts, dependency problems)
- Progress reporting and error recovery

## Current Implementation Phase

### Phase 1: Basic Electron Setup ✅ COMPLETED
**Goal**: Create minimal working Electron application
**Deliverables**:
- ✅ package.json with Electron dependencies
- ✅ main.js with basic window creation and functional structure  
- ✅ index.html with minimal dark mode UI
- ✅ Verified application launches and closes properly

**Success Criteria**:
- ✅ Application launches without errors
- ✅ Window opens with expected dimensions (1200x800) and behavior
- ✅ Application closes cleanly on all platforms
- ✅ No security warnings (nodeIntegration: false, contextIsolation: true)
- ✅ Clean dark mode UI with professional styling

**Implementation Notes**:
- Used pure functions for window configuration (createWindowConfig)
- Implemented proper Electron security practices
- Added development mode detection for DevTools
- Clean separation of concerns in main.js
- Minimal, professional dark mode interface

### Phase 2: Project Management UI ✅ COMPLETED
**Goal**: Add project listing and creation interface
**Deliverables**: 
- ✅ Project creation modal with form validation
- ✅ Project grid/list display with metadata
- ✅ Basic project operations (open, delete)
- ✅ Local storage for project persistence

**Success Criteria**:
- ✅ Professional project management interface with header and navigation
- ✅ Grid and list view toggle functionality
- ✅ Empty state with clear call-to-action for first project
- ✅ Project creation modal with name and template validation
- ✅ Projects persist between app sessions using localStorage
- ✅ Project cards show metadata (name, template, creation date, status)
- ✅ Basic project operations (open placeholder, delete with confirmation)
- ✅ Pure functional programming approach throughout

**Implementation Notes**:
- Used pure functions for validation (validateProjectName, validateProjectTemplate)
- Implemented functional composition pattern for project creation workflow
- Added Result types for error handling and validation
- Local storage with transformation functions (projectToStorageFormat, storageToProjectFormat)
- Responsive grid/list view with CSS Grid and Flexbox
- Professional dark mode UI consistent with Phase 1
- Simulated project creation with loading states

### Phase 3: Project Creation & Storybook Integration ✅ COMPLETED  
**Goal**: Implement full project creation workflow with real-time status updates and Storybook integration
**Deliverables**:
- ✅ Real-time project creation with live status updates
- ✅ File system operations for project scaffolding  
- ✅ Dependency installation automation with npm
- ✅ Automatic Storybook integration and viewing
- ✅ Secure IPC communication between main and renderer processes
- ✅ Progress tracking with visual indicators
- ✅ Embedded Storybook viewer in modal interface

**Success Criteria**:
- ✅ Projects are created with real React + Storybook structure
- ✅ Real-time progress updates during creation (Planning → Scaffolding → Installing → Configuring → Ready)
- ✅ Visual progress bars and status messages in UI
- ✅ Automatic npm install execution with process monitoring
- ✅ Storybook launches automatically when project is opened
- ✅ Embedded Storybook viewer with iframe integration
- ✅ Proper error handling and recovery for failed operations
- ✅ Projects persist with full path and status information

**Implementation Architecture**:
- **IPC Layer**: Secure main-renderer communication using contextBridge and preload script
- **Process Management**: Child process spawning for npm install with stdout/stderr monitoring
- **Real-time Updates**: Event streaming from main to renderer with project:progress events
- **File System Operations**: Complete project scaffolding with React, Vite, and Storybook files
- **Template Engine**: Dynamic file generation with project name and configuration substitution
- **Port Management**: Unique port allocation for development servers
- **Error Recovery**: Graceful handling of creation failures with status updates

### Phase 3.5: Tabbed Project Interface ✅ COMPLETED
**Goal**: Add tabbed interface for Component Library and Workflows management
**Deliverables**:
- ✅ Tabbed project viewer replacing simple Storybook modal
- ✅ Component Library tab with interactive component showcase
- ✅ Workflows tab with workflow management interface
- ✅ Professional workflow cards with preview and metadata
- ✅ Workflow creation and management framework

**Success Criteria**:
- ✅ Clean tabbed interface with Component Library and Workflows tabs
- ✅ Component Library shows realistic component gallery with previews and variants
- ✅ Workflows tab displays existing workflows with visual previews
- ✅ New workflow creation workflow with naming and editing placeholders
- ✅ Professional UI design consistent with application theme
- ✅ Smooth tab switching and content loading

**Implementation Features**:
- **Tabbed Navigation**: Professional tab interface with active state indicators
- **Component Showcase**: Visual component library with interactive previews
- **Workflow Management**: Grid-based workflow listing with creation capabilities
- **Visual Workflow Previews**: Step-by-step workflow visualization
- **Responsive Design**: Adaptive grid layouts for different screen sizes
- **Action Integration**: Workflow creation and editing hooks for future expansion

## Quality Assurance Framework

### QA1: Manual Verification Points
Each development step SHALL include manual verification:
- Application launches and basic functionality works
- UI appears correctly styled and responsive  
- No console errors or warnings
- Cross-platform compatibility (macOS focus initially)

### QA2: Incremental Testing
Each pure function SHALL be testable:
- Unit tests for business logic functions
- Integration tests for file system operations
- End-to-end tests for complete workflows
- Performance benchmarks for large project counts

### QA3: Documentation Currency
Documentation SHALL be updated with each change:
- Propositions updated when entities change
- Requirements updated when behavior changes
- Architecture notes updated when patterns change
- Test results recorded for future reference

## Development Guidelines

### DG1: Minimal Steps Forward
Each development increment SHALL be minimal and verifiable:
- Make smallest possible change that adds value
- Test change thoroughly before proceeding
- Update documentation before moving to next step
- Commit working state at each milestone

### DG2: Functional Programming Discipline
All code SHALL follow functional programming principles:
- Prefer pure functions over stateful classes
- Use immutable data structures
- Handle errors with Result types rather than exceptions
- Compose complex behavior from simple functions

### DG3: Generative Analysis Compliance
Development SHALL follow Generative Analysis methodology:
- Update propositions when domain understanding changes
- Refine requirements based on user feedback and testing
- Maintain single source of truth in this document
- Use precise language to avoid distortion/deletion/generalization

## Current Status & Next Actions

**Phase 1 COMPLETED**: Basic Electron application successfully created and tested
- ✅ Clean package.json with minimal Electron dependencies
- ✅ main.js with functional programming approach and security best practices
- ✅ index.html with professional dark mode UI
- ✅ Application launches, runs, and closes properly
- ✅ Documentation updated with Generative Analysis methodology

### Phase 4: Backend Persistence & Settings System ✅ COMPLETED  
**Goal**: Implement real backend persistence with user-configurable settings
**Deliverables**:
- ✅ Complete settings system with tabbed UI (General/Development/Advanced)
- ✅ Native directory picker for projects directory configuration  
- ✅ electron-store integration for persistent settings storage
- ✅ Real file system operations using user-configured paths
- ✅ Settings validation with user-friendly error handling
- ✅ Default template selection with persistence
- ✅ Configurable development server port ranges
- ✅ Settings reset to defaults functionality

**Success Criteria**:
- ✅ Settings modal opens with professional tabbed interface
- ✅ Directory picker uses native OS file dialogs  
- ✅ Settings persist between application sessions
- ✅ Projects created in user-specified directory with auto-creation
- ✅ All settings validated with appropriate error messages
- ✅ Settings can be reset to defaults with confirmation
- ✅ Project creation uses settings-configured paths and templates
- ✅ Port ranges configurable and validated properly

**Implementation Features**:
- **Settings Architecture**: Complete settings management with electron-store backend
- **Native Integration**: OS-native directory picker with file system validation
- **User Experience**: Professional tabbed settings interface with validation
- **Persistence**: Settings survive app restarts and system changes
- **Error Handling**: Comprehensive validation and error recovery
- **Configuration**: All major app behaviors now user-configurable

**Phase 4 Enhanced - Backend Persistence & Error Handling**:
- **Project Registry**: Complete backend project registry with automatic validation
- **Error Recovery**: Automatic cleanup of failed project creation attempts
- **Default Templates**: Settings-based default template pre-selection
- **Duplicate Prevention**: Clear error messages for existing project directories
- **Orphaned Cleanup**: Automatic removal of orphaned projects from registry
- **Real Persistence**: Projects stored in electron-store with file system validation
- **User-Friendly Errors**: Clear error messages instead of console-only logging

**CURRENT PHASE**: Phase 5 - Living Design System Manager ⚡ IN PROGRESS

**Architecture Decision**: Switched from custom Vite scaffolding to **create-react-app integration** with **live React dev server previews** (no Storybook complexity)

**Major Breakthrough - Live Preview System** ✨:
- ✅ **Real React Dev Server Integration**: Automatically runs `npm start` in background for live previews
- ✅ **Live Iframe Previews**: Shows actual create-react-app landing page in workflow preview modal
- ✅ **Process Management**: Smart port allocation, server lifecycle management, graceful cleanup
- ✅ **Interactive Controls**: Start/stop servers, open in browser, real-time status updates

**Key Changes**:
- ✅ **Fixed Issues**: "Creating..." button state now resets, default workflows now display properly
- ✅ **create-react-app Integration**: Uses `npx create-react-app` for reliable project scaffolding
- ✅ **Live Preview Architecture**: Backend spawns `npm start` processes, frontend shows live iframes
- ✅ **Custom Variant System**: Components define variants as `Button.variants = [...]` directly in files
- ✅ **Pure Function Approach**: All new functions follow functional programming principles

**Implementation Progress**:
1. ✅ **Default workflow creation** from generated React app (COMPLETED)
2. ✅ **Live React dev server preview** showing actual create-react-app landing page (COMPLETED)
3. 🚧 **Real component discovery** from project files (NEXT)
4. 🚧 **Custom variant parsing** and display (NEXT) 
5. 🚧 **Interactive component previews** (NEXT)
6. 🚧 **Living connection** between tool and actual project files (NEXT)

**Goal**: Transform from project creator to living design system manager that reflects actual project state

**Current Template System**:
- **react-basic**: create-react-app + custom Button/Card components with variants
- **react-typescript**: create-react-app TypeScript template + custom components
- **react-storybook**: create-react-app + enhanced custom component library
- **react-storybook-tailwind**: Above + Tailwind CSS integration (future)

## Live Preview Architecture (Phase 5)

### **Technical Implementation**

**Backend Process Management (main.js)**:
```javascript
// React Dev Server State Management
let projectServers = new Map(); // Track running servers by project ID
let usedPorts = new Set([3000, 3001]); // Port allocation

// Key Functions
async function startProjectServer(project) {
  // 1. Find available port (3000, 3001, 3002...)
  // 2. Run `npm start` with PORT env var
  // 3. Monitor stdout for "webpack compiled"
  // 4. Return { success: true, url: "http://localhost:3001" }
}

async function stopProjectServer(projectId) {
  // 1. Send SIGTERM to npm start process
  // 2. Force SIGKILL after 5 seconds if needed
  // 3. Clean up port allocation
}
```

**Frontend Live Preview (app.js)**:
```javascript
// Workflow Preview Flow
async function openWorkflowPreview(project, workflow) {
  // 1. Show loading modal immediately
  // 2. Check server status via IPC
  // 3. Start server if needed (30s timeout)
  // 4. Replace loading with live iframe
}

// Live Preview Content
function generatePreviewContent(serverUrl, status) {
  switch (status) {
    case 'running': return `<iframe src="${serverUrl}" .../>`;
    case 'starting': return LoadingSpinner;
    case 'failed': return ErrorWithRetryButton;
  }
}
```

**IPC Communication Layer**:
- `project:start-server` → Backend spawns `npm start` 
- `project:stop-server` → Backend kills process
- `project:get-server-status` → Backend returns { status, url, port }

### **User Experience Flow**

```
1. User clicks "Landing Page" workflow card
   ↓
2. Modal opens with loading spinner
   ↓
3. Backend checks if React dev server is running
   ↓
4a. IF RUNNING: Shows live iframe immediately
4b. IF STOPPED: Runs `npm start` in project directory
   ↓
5. Backend monitors process stdout for "compiled successfully"
   ↓
6. Frontend replaces spinner with live iframe showing actual React app
   ↓
7. User sees real create-react-app landing page with spinning logo
```

### **Process Lifecycle Management**

- **Auto Port Assignment**: Starts at 3000, increments for conflicts
- **Health Monitoring**: Watches React dev server stdout/stderr
- **Graceful Cleanup**: SIGTERM → wait 5s → SIGKILL if needed
- **App Exit Cleanup**: Kills all running dev servers on application close
- **Error Recovery**: Retry buttons on failed server starts

**Key Architectural Decisions**:
- Using pure functional approach throughout (no classes)
- Live React dev server integration for authentic previews
- Electron security enabled (contextIsolation: true, nodeIntegration: false)
- Process management with proper cleanup and error handling
- Dark mode UI with minimal, clean design
- Following Generative Analysis documentation practices
- Incremental development with manual verification at each step

This document serves as the authoritative source of truth for all design decisions and will be updated as development progresses.