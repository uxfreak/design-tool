# Design Tool - Comprehensive System Documentation

## Overview

The Design Tool is an Electron-based desktop application for managing React projects with integrated component discovery, live dev servers, and Claude Code terminal integration. The system follows functional programming principles and implements a secure IPC communication architecture.

## Table of Contents

1. [Technical Architecture](#technical-architecture)
2. [Component Interaction Diagram](#component-interaction-diagram)
3. [Data Flow Diagram](#data-flow-diagram)
4. [API Documentation](#api-documentation)
5. [Feature Matrix](#feature-matrix)
6. [System Components](#system-components)
7. [Security Architecture](#security-architecture)
8. [Process Management](#process-management)

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                ELECTRON MAIN PROCESS                             │
│                                   (Node.js)                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────────────────────┐ │
│  │   Main Window   │  │  IPC Handler     │  │    Process Managers            │ │
│  │   Manager       │  │  Registry        │  │                                │ │
│  │                 │  │                  │  │  • Project Server Manager     │ │
│  │  • Window Config│  │  • project:*     │  │  • PTY Terminal Manager       │ │
│  │  • Lifecycle    │  │  • settings:*    │  │  • Thumbnail Generator        │ │
│  │  • DevTools     │  │  • projects:*    │  │  • Component Discovery        │ │
│  │                 │  │  • pty:*         │  │                                │ │
│  └─────────────────┘  └──────────────────┘  └─────────────────────────────────┘ │
│                                                                                 │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────────────────────┐ │
│  │   Data Layer    │  │  Security Layer  │  │    External Process Pool       │ │
│  │                 │  │                  │  │                                │ │
│  │  • electron-    │  │  • Context       │  │  • React Dev Servers (3000+)  │ │
│  │    store        │  │    Isolation     │  │  • node-pty Sessions          │ │
│  │  • Project      │  │  • No Node       │  │  • npm/yarn processes         │ │
│  │    Registry     │  │    Integration   │  │  • Thumbnail Windows          │ │
│  │  • Settings     │  │  • Secure IPC    │  │                                │ │
│  └─────────────────┘  └──────────────────┘  └─────────────────────────────────┘ │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                            ┌─────────────────┐
                            │   preload.js    │
                            │  (IPC Bridge)   │
                            │                 │
                            │ • contextBridge │
                            │ • electronAPI   │
                            │ • Event Wrapper │
                            └─────────────────┘
                                        │
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              ELECTRON RENDERER PROCESS                          │
│                                 (Chromium)                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────────────────────┐ │
│  │  App State      │  │   View Layer     │  │      UI Components             │ │
│  │  Management     │  │                  │  │                                │ │
│  │                 │  │  • Dashboard     │  │  • Project Grid/List           │ │
│  │  • Projects[]   │  │  • Project       │  │  • Modal System               │ │
│  │  • Server       │  │    Viewer        │  │  • Terminal Sidebar           │ │
│  │    Status       │  │  • Settings      │  │  • Status Bar                 │ │
│  │  • Context      │  │  • Modals        │  │  • Header Actions             │ │
│  │    Awareness    │  │                  │  │                                │ │
│  └─────────────────┘  └──────────────────┘  └─────────────────────────████─┘ │
│                                                                                 │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────────────────────┐ │
│  │   Project       │  │  Terminal        │  │    Component System            │ │
│  │   Management    │  │  Integration     │  │                                │ │
│  │                 │  │                  │  │  • Component Discovery        │ │
│  │  • Creation     │  │  • xterm.js      │  │  • Live Preview               │ │
│  │  • Opening      │  │  • PTY Bridge    │  │  • Workflow System            │ │
│  │  • Server       │  │  • Context       │  │  • Thumbnail Generation       │ │
│  │    Control      │  │    Injection     │  │                                │ │
│  │  • Lifecycle    │  │  • Claude Code   │  │                                │ │
│  └─────────────────┘  └──────────────────┘  └─────────────────────────────────┘ │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Interaction Diagram

```
PROJECT CREATION FLOW:
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐    ┌──────────────┐
│   Frontend  │ 1  │   preload    │ 2  │   Main Process  │ 3  │ File System  │
│   Modal     │───▶│   IPC Bridge │───▶│   Handler       │───▶│   Operations │
└─────────────┘    └──────────────┘    └─────────────────┘    └──────────────┘
       ▲                                         │
       │ 8                                      │ 4
       │            ┌──────────────┐             ▼
       └────────────│   Progress   │    ┌─────────────────┐
                    │   Updates    │◀───│   Project       │
                    └──────────────┘  5 │   Structure     │
                                        │   Generator     │
                                        └─────────────────┘
                                                │ 6
                                                ▼
                                        ┌─────────────────┐    ┌──────────────┐
                                        │   Dependency    │ 7  │   npm/yarn   │
                                        │   Installer     │───▶│   Process    │
                                        └─────────────────┘    └──────────────┘

SERVER MANAGEMENT FLOW:
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐    ┌──────────────┐
│   Project   │ 1  │   Server     │ 2  │   Process       │ 3  │   React      │
│   Viewer    │───▶│   Manager    │───▶│   Spawner       │───▶│   Dev Server │
└─────────────┘    └──────────────┘    └─────────────────┘    └──────────────┘
       ▲                                                              │
       │ 6                                                            │ 4
       │            ┌──────────────┐                                  ▼
       └────────────│   Status     │                          ┌──────────────┐
                    │   Updates    │◀─────────────────────────│   Server     │
                    └──────────────┘ 5                        │   Ready      │
                                                              └──────────────┘

TERMINAL INTEGRATION FLOW:
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐    ┌──────────────┐
│   Terminal  │ 1  │   xterm.js   │ 2  │   PTY Bridge    │ 3  │   node-pty   │
│   Sidebar   │───▶│   Frontend   │───▶│   (preload)     │───▶│   Process    │
└─────────────┘    └──────────────┘    └─────────────────┘    └──────────────┘
       ▲                   ▲                                           │
       │ 6                 │ 5                                        │ 4
       │                   │              ┌──────────────┐             ▼
       └───────────────────└──────────────│   Terminal   │    ┌──────────────┐
                                          │   Output     │◀───│   Shell      │
                                          │   Stream     │    │   Session    │
                                          └──────────────┘    └──────────────┘
```

---

## Data Flow Diagram

```
APPLICATION INITIALIZATION:
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐
│   App       │ 1  │   Settings   │ 2  │   Project       │
│   Start     │───▶│   Load       │───▶│   Registry      │
└─────────────┘    │   (electron- │    │   Load          │
                   │    store)    │    └─────────────────┘
                   └──────────────┘             │ 3
                                                ▼
                   ┌──────────────┐    ┌─────────────────┐
                   │   Main       │ 4  │   Dashboard     │
                   │   Window     │◀───│   Render        │
                   │   Display    │    └─────────────────┘
                   └──────────────┘

PROJECT LIFECYCLE DATA FLOW:
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐    ┌──────────────┐
│   User      │ 1  │   Form       │ 2  │   Validation    │ 3  │   Project    │
│   Input     │───▶│   Data       │───▶│   Layer         │───▶│   Config     │
└─────────────┘    └──────────────┘    └─────────────────┘    │   Creation   │
                                                              └──────────────┘
                                                                      │ 4
                                                                      ▼
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐    ┌──────────────┐
│   Project   │ 8  │   Registry   │ 7  │   File System   │ 5  │   Directory  │
│   Available │◀───│   Update     │◀───│   Operations    │◀───│   Creation   │
└─────────────┘    └──────────────┘    └─────────────────┘    └──────────────┘
       │                                        │                     │ 6
       │ 9                                      │                     ▼
       ▼                                        │             ┌──────────────┐
┌─────────────┐                                 │             │   Template   │
│   UI        │                                 │             │   Files      │
│   Update    │                                 │             │   Generation │
└─────────────┘                                 │             └──────────────┘
                                                │
                                                ▼
                                       ┌──────────────┐
                                       │   Thumbnail  │
                                       │   Generation │
                                       │   (async)    │
                                       └──────────────┘

COMPONENT DISCOVERY FLOW:
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐    ┌──────────────┐
│   Project   │ 1  │   File       │ 2  │   AST Parser    │ 3  │   Component  │
│   Open      │───▶│   Scanner    │───▶│   (React)       │───▶│   Metadata   │
└─────────────┘    └──────────────┘    └─────────────────┘    │   Extraction │
                                                              └──────────────┘
                                                                      │ 4
                                                                      ▼
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐    ┌──────────────┐
│   Component │ 7  │   Variant    │ 6  │   Props         │ 5  │   Component  │
│   Library    │◀───│   Detection   │◀───│   Analysis      │◀───│   Tree       │
│   Display   │    └──────────────┘    └─────────────────┘    │   Build      │
└─────────────┘                                               └──────────────┘
```

---

## API Documentation

### IPC Handlers (Main Process)

#### Project Operations

**`project:create`**
- **Purpose**: Create a new React project with selected template
- **Parameters**: `projectConfig: { name, templateId, ...options }`
- **Returns**: `{ success: boolean, project?: Object, error?: string }`
- **Side Effects**: Creates directory structure, installs dependencies, updates registry

**`project:open`**
- **Purpose**: Open existing project in project viewer
- **Parameters**: `projectId: string`
- **Returns**: `{ success: boolean, project?: Object, error?: string }`
- **Side Effects**: Updates project access time, initializes server if needed

**`project:start-server`**
- **Purpose**: Start React development server for project
- **Parameters**: `projectId: string`
- **Returns**: `{ success: boolean, url?: string, port?: number, pid?: number }`
- **Side Effects**: Spawns npm/yarn process, allocates port, registers server

**`project:stop-server`**
- **Purpose**: Stop running development server
- **Parameters**: `projectId: string`
- **Returns**: `{ success: boolean, error?: string }`
- **Side Effects**: Kills server process, deallocates port, updates registry

**`project:get-server-status`**
- **Purpose**: Get current status of project's development server
- **Parameters**: `projectId: string`
- **Returns**: `{ success: boolean, status: 'running'|'stopped', url?: string, port?: number }`

**`project:discover-components`**
- **Purpose**: Scan project for React components and extract metadata
- **Parameters**: `projectId: string`
- **Returns**: `{ success: boolean, components?: Component[], error?: string }`
- **Process**: File system scan → AST parsing → Component extraction → Variant detection

**`project:generate-thumbnail`**
- **Purpose**: Generate or update project thumbnail via headless capture
- **Parameters**: `projectId: string, forceRegenerate?: boolean`
- **Returns**: `{ success: boolean, thumbnailPath?: string, error?: string }`
- **Process**: Server check → Headless window → Page capture → Image processing → Cache storage

**`project:get-thumbnail`**
- **Purpose**: Retrieve existing thumbnail path for project
- **Parameters**: `projectId: string`
- **Returns**: `{ success: boolean, thumbnailPath?: string, fallback?: boolean }`

#### Settings Operations

**`settings:get`**
- **Purpose**: Retrieve all application settings
- **Returns**: `{ success: boolean, settings: Object }`
- **Source**: electron-store with defaults fallback

**`settings:save`**
- **Purpose**: Persist application settings
- **Parameters**: `settings: Object`
- **Returns**: `{ success: boolean, error?: string }`
- **Validation**: Schema validation, path existence checks

**`settings:choose-directory`**
- **Purpose**: Open native directory picker dialog
- **Returns**: `{ success: boolean, directory?: string, cancelled?: boolean }`

**`settings:reset`**
- **Purpose**: Reset all settings to defaults
- **Returns**: `{ success: boolean }`

#### Project Registry Operations

**`projects:list`**
- **Purpose**: Get all registered projects with metadata
- **Returns**: `{ success: boolean, projects: Project[] }`
- **Data**: Includes status, last modified, server state, thumbnail availability

**`projects:add`**
- **Purpose**: Add project to registry (usually after creation)
- **Parameters**: `projectData: Object`
- **Returns**: `{ success: boolean, project: Object }`

**`projects:update`**
- **Purpose**: Update project metadata in registry
- **Parameters**: `projectId: string, updates: Object`
- **Returns**: `{ success: boolean, project: Object }`

**`projects:remove`**
- **Purpose**: Remove project from registry (not filesystem)
- **Parameters**: `projectId: string`
- **Returns**: `{ success: boolean }`

#### Terminal PTY Operations

**`pty:start`**
- **Purpose**: Start new PTY terminal session with Claude Code context
- **Parameters**: `{ cwd?: string, cmd?: string, context?: Object }`
- **Returns**: `{ success: boolean, pid: number, error?: string }`
- **Process**: Shell detection → Context injection → PTY spawn → Process registration

**`pty:write`** (IPC Send)
- **Purpose**: Send input data to PTY process
- **Parameters**: `{ pid: number, data: string }`
- **Side Effects**: Writes to PTY stdin, buffers commands for context

**`pty:resize`** (IPC Send)
- **Purpose**: Resize PTY terminal dimensions
- **Parameters**: `{ pid: number, cols: number, rows: number }`

**`pty:kill`**
- **Purpose**: Terminate PTY process
- **Parameters**: `pid: number`
- **Returns**: `{ success: boolean }`
- **Side Effects**: Kills process, cleanup session data, notify renderer

### Frontend API (Renderer Process)

#### Core Application Functions

**`loadProjects()`**
- **Purpose**: Load and display all projects from registry
- **Process**: IPC call → UI update → Thumbnail loading → Server status check
- **Error Handling**: Fallback UI, retry mechanisms

**`createProject(name, templateId)`**
- **Purpose**: Handle project creation workflow
- **Process**: Validation → Progress tracking → IPC communication → UI updates
- **States**: Validating → Creating → Installing → Configuring → Complete

**`openProject(projectId)`**
- **Purpose**: Open project in viewer mode
- **Process**: Server startup (background) → Component discovery → UI transition
- **Context**: Updates app context, breadcrumbs, terminal CWD

**`deleteProject(projectId)`**
- **Purpose**: Remove project from registry with confirmation
- **Process**: Confirmation dialog → Server cleanup → Registry removal → UI update

#### View Management

**`showDashboard()`**
- **Purpose**: Navigate back to main project dashboard
- **Process**: Server cleanup scheduling → View transition → Context reset

**`showProjectView(projectId)`**
- **Purpose**: Navigate to project-specific view
- **Process**: Project loading → Tab initialization → Server status check

**`showProjectTab(tabId)`**
- **Purpose**: Switch between project tabs (component-library, workflows)
- **States**: `component-library`, `workflows`

**`setViewMode(mode)`**
- **Purpose**: Toggle between grid and list view
- **Parameters**: `mode: 'grid' | 'list'`
- **Persistence**: Updates app state and visual layout

#### Terminal Integration

**`initializeTerminal()`**
- **Purpose**: Initialize xterm.js terminal with PTY connection
- **Process**: DOM setup → xterm.js config → PTY bridge → Event handlers
- **Context**: Injects current project path, active files, server status

**`toggleTerminalSidebar()`**
- **Purpose**: Show/hide terminal sidebar
- **Animation**: Slide transition with resize handles

**`clearTerminal()`, `restartTerminal()`**
- **Purpose**: Terminal control operations
- **Process**: PTY communication → State management → UI feedback

#### Server Management

**`startProjectServerBackground(projectId)`**
- **Purpose**: Non-blocking server startup with progress tracking
- **Process**: Status check → Server spawn → UI indicators → Feature enablement

**`updateServerStatusIndicator(serverState)`**
- **Purpose**: Update status bar and UI indicators
- **States**: `STOPPED`, `STARTING`, `READY`, `FAILED`

**`enableLiveFeatures(projectId)`**
- **Purpose**: Activate live preview capabilities when server ready
- **Features**: Component previews, workflow previews, thumbnail generation

---

## Feature Matrix

| Feature | Implementation Status | Dependencies | Technical Details |
|---------|----------------------|--------------|-------------------|
| **Project Creation** | ✅ Complete | create-react-app, custom templates | Multi-step wizard with progress tracking |
| **Project Registry** | ✅ Complete | electron-store | Persistent project metadata storage |
| **Settings Management** | ✅ Complete | electron-store, native dialogs | Tabbed interface with validation |
| **Project Dashboard** | ✅ Complete | Grid/List view toggle | Dynamic thumbnail loading |
| **Live Dev Servers** | ✅ Complete | npm/yarn, port allocation | Background server management |
| **Component Discovery** | ✅ Complete | AST parsing, file scanning | React component metadata extraction |
| **Component Library Viewer** | ✅ Complete | iframe integration | Live component preview system |
| **Workflow System** | ✅ Complete | Default workflow generation | Visual workflow representation |
| **Thumbnail Generation** | ✅ Complete | Headless Chromium capture | Automatic project preview images |
| **Terminal Integration** | ✅ Complete | node-pty, xterm.js | Claude Code integration with context |
| **Context Awareness** | ✅ Complete | App state management | Project/file/server context tracking |
| **IPC Security** | ✅ Complete | Context isolation, preload bridge | Secure main/renderer communication |
| **Process Management** | ✅ Complete | Child process spawning, cleanup | Dev servers, terminals, installers |
| **Error Handling** | ✅ Complete | Graceful degradation | User-friendly error messages |
| **Design System** | ✅ Complete | CSS custom properties | Consistent theming and spacing |

### Planned Features (Not Implemented)

| Feature | Priority | Estimated Effort | Dependencies |
|---------|----------|------------------|--------------|
| **Storybook Integration** | High | 1-2 weeks | Storybook CLI, iframe embedding |
| **Hot Module Reloading** | Medium | 1 week | Webpack HMR, WebSocket integration |
| **Component Code Editor** | Medium | 2-3 weeks | Monaco Editor, syntax highlighting |
| **Git Integration** | Low | 2-3 weeks | nodegit or CLI integration |
| **Export/Import Projects** | Low | 1 week | ZIP archives, project metadata |
| **Team Collaboration** | Low | 4-6 weeks | Real-time sync, conflict resolution |

---

## System Components

### Main Process Components

#### 1. Window Manager
- **File**: `main.js:createMainWindow()`
- **Responsibility**: Electron window lifecycle, configuration, DevTools
- **Key Features**: 
  - Security-first window config (no node integration)
  - Platform-specific title bar handling
  - Development mode detection

#### 2. IPC Handler Registry
- **File**: `main.js` (ipcMain.handle/on calls)
- **Responsibility**: Secure communication bridge between processes
- **Pattern**: Request/response for queries, events for streaming data
- **Security**: Context isolation, no direct Node.js access in renderer

#### 3. Project Server Manager
- **File**: `main.js` (server-related handlers)
- **Responsibility**: React dev server lifecycle management
- **Features**:
  - Port allocation and conflict resolution
  - Process spawning and cleanup
  - Health monitoring and status reporting
  - Background startup for performance

#### 4. PTY Terminal Manager
- **File**: `main.js` (pty-related handlers)
- **Responsibility**: Terminal session management with Claude Code integration
- **Features**:
  - Shell detection (bash/zsh/fish)
  - Context injection (current project, file, server status)
  - Input/output buffering and processing
  - Session cleanup and resource management

#### 5. Component Discovery Engine
- **File**: `main.js:discoverComponents`
- **Responsibility**: React component analysis and metadata extraction
- **Process**:
  1. File system traversal
  2. React file detection (.jsx, .tsx)
  3. AST parsing for component extraction
  4. Props and variant analysis
  5. Metadata compilation

#### 6. Thumbnail Generator
- **File**: `main.js` (thumbnail-related functions)
- **Responsibility**: Automated project preview generation
- **Process**:
  1. Headless browser window creation
  2. Project URL loading
  3. Screenshot capture
  4. Image processing and optimization
  5. Cache management

#### 7. Settings & Data Persistence
- **File**: `main.js` (electron-store integration)
- **Responsibility**: Application configuration and project registry
- **Features**:
  - Default settings with validation
  - Project metadata persistence
  - Settings migration and backup

### Renderer Process Components

#### 1. Application State Manager
- **File**: `app.js` (appState, appContext objects)
- **Responsibility**: Central state management for UI
- **State Categories**:
  - Project list and metadata
  - Current view and navigation
  - Server status tracking
  - User preferences and context

#### 2. Project Management System
- **File**: `app.js` (project-related functions)
- **Responsibility**: Project lifecycle operations
- **Features**:
  - Creation wizard with progress tracking
  - Project opening and closing
  - Registry synchronization
  - Error handling and recovery

#### 3. View Controller
- **File**: `app.js` (view management functions)
- **Responsibility**: Navigation and view state management
- **Views**:
  - Dashboard (grid/list modes)
  - Project viewer (component library, workflows)
  - Settings modal
  - Creation wizard

#### 4. Component Library Viewer
- **File**: `app.js:loadComponentLibrary`
- **Responsibility**: Interactive component browsing and preview
- **Features**:
  - Live component rendering via iframe
  - Variant selection and preview
  - Server integration for real-time updates
  - Fallback states for offline mode

#### 5. Terminal Integration Layer
- **File**: `app.js:initializeTerminal`
- **Responsibility**: Terminal UI and PTY bridge management
- **Features**:
  - xterm.js terminal emulation
  - Context-aware command injection
  - Resize handling and persistence
  - Claude Code integration

#### 6. Server Status Monitor
- **File**: `app.js` (server status functions)
- **Responsibility**: Development server monitoring and control
- **Features**:
  - Real-time status indicators
  - Background server management
  - Performance optimization (cleanup scheduling)
  - Error detection and retry logic

---

## Security Architecture

### Context Isolation
- **Main Process**: Full Node.js access, handles file system and child processes
- **Renderer Process**: No Node.js access, communicates via secure IPC bridge
- **Preload Script**: Limited API exposure through contextBridge

### IPC Security Model
```javascript
// Secure Pattern: preload.js
contextBridge.exposeInMainWorld('electronAPI', {
  createProject: (config) => ipcRenderer.invoke('project:create', config),
  // Never expose raw ipcRenderer or Node.js APIs
});

// Main Process Validation
ipcMain.handle('project:create', async (event, projectConfig) => {
  // Always validate input from renderer
  const validation = validateProjectName(projectConfig.name);
  if (!validation.success) {
    return { success: false, error: validation.error };
  }
  // Process with validated data
});
```

### Input Validation
- All user inputs validated before processing
- File path sanitization and validation
- Template and configuration schema validation
- SQL injection prevention (though no SQL used)

### Process Isolation
- Child processes (dev servers, terminals) run in isolated contexts
- Process cleanup on application exit
- Resource limit enforcement
- Error boundary isolation

---

## Process Management

### Development Server Management

```javascript
// Server Lifecycle
const serverProcess = spawn('npm', ['start'], {
  cwd: projectPath,
  env: { ...process.env, PORT: allocatedPort, BROWSER: 'none' },
  stdio: ['pipe', 'pipe', 'pipe']
});

// Process Registry
projectServers.set(projectId, {
  process: serverProcess,
  port: allocatedPort,
  url: `http://localhost:${allocatedPort}`,
  status: 'starting'
});

// Cleanup Handler
process.on('exit', () => {
  for (const [projectId, serverInfo] of projectServers) {
    if (serverInfo.process && !serverInfo.process.killed) {
      serverInfo.process.kill('SIGTERM');
    }
  }
});
```

### Terminal Process Management

```javascript
// PTY Session Creation
const ptyProcess = pty.spawn(shell, [], {
  name: 'xterm-color',
  cols: 80,
  rows: 24,
  cwd: contextCwd,
  env: {
    ...process.env,
    DESIGN_TOOL_CONTEXT: JSON.stringify(context)
  }
});

// Session Registry
terminalProcesses.set(ptyProcess.pid, {
  process: ptyProcess,
  context: context,
  startTime: Date.now(),
  lastActivity: Date.now()
});
```

### Resource Management

- **Memory**: Process monitoring and cleanup
- **Ports**: Dynamic allocation with conflict resolution
- **File Handles**: Proper cleanup and error handling
- **CPU**: Background process throttling

---

## Context Awareness System

The application maintains rich context about the user's current state:

```javascript
appContext = {
  currentView: 'dashboard' | 'project-viewer' | 'settings',
  activeProject: { id, name, path, status },
  currentFile: '/path/to/active/file.jsx',
  openFiles: ['/path/to/file1.jsx', '/path/to/file2.tsx'],
  activeTab: 'component-library' | 'workflows',
  serverStatus: { running: boolean, port: number, url: string },
  terminalCwd: '/current/working/directory',
  recentActions: ['created project', 'opened file', 'started server'],
  breadcrumbs: ['Home', 'My Project', 'Components']
};
```

This context is used for:
- **Terminal Enhancement**: Inject relevant paths and commands
- **Claude Code Integration**: Provide file and project context
- **UI State Management**: Breadcrumbs, status indicators
- **Performance Optimization**: Preload relevant data
- **Error Context**: Better error messages with current state

---

## Development Notes

### File Structure
```
design-tool/
├── main.js              # Electron main process
├── preload.js           # Secure IPC bridge
├── app.js               # Frontend application logic
├── index.html           # UI structure and styling
├── design-tokens.css    # Design system tokens
├── package.json         # Dependencies and scripts
└── projects/            # Created projects directory
```

### Dependencies
- **Electron**: Desktop application framework
- **node-pty**: Terminal emulation for cross-platform support
- **electron-store**: Persistent settings and project registry
- **xterm.js**: Terminal UI component with fit addon

### Development Commands
```bash
npm start          # Run in production mode
npm run dev        # Run in development mode with DevTools
npm run dev:watch  # Development with auto-restart on changes
```

### Extension Points
The architecture supports easy extension through:
- **IPC Handler Registration**: Add new backend operations
- **Template System**: Add new project templates
- **Component Discovery**: Extend AST parsing for new patterns
- **Context Injection**: Add new context data for terminals
- **View System**: Add new views and navigation modes

---

## Conclusion

The Design Tool represents a well-architected Electron application that successfully balances functionality, security, and performance. The system's modular design, secure IPC communication, and comprehensive process management make it suitable for production use while remaining extensible for future enhancements.

The integration of Claude Code terminal functionality with project context awareness creates a unique development environment that bridges traditional project management with AI-assisted development workflows.