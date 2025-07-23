# Design Tool - Technical Reference

> Comprehensive technical documentation following Generative Analysis methodology

## Purpose and Abstraction Level

This document operates at the **implementation detail level** - providing specific API contracts, interface definitions, and technical implementation details for developers extending or maintaining the Design Tool system.

## IPC Communication API

### P1: IPC Communication Architecture
**P1.1**: One (1) Design Tool uses exactly one (1) IPC communication layer via contextBridge
**P1.2**: One (1) contextBridge exposes exactly one (1) electronAPI object to renderer process
**P1.3**: All IPC operations return Result types with success/error states

### Project Management API

#### electronAPI.createProject(projectConfig)
**Purpose**: Creates a new React project with specified configuration

**Parameters**:
```typescript
interface ProjectConfig {
  name: string;           // 3-50 characters, alphanumeric + spaces/hyphens
  templateId: string;     // 'react-basic', 'react-storybook', etc.
}
```

**Returns**:
```typescript
interface CreateProjectResponse {
  success: boolean;
  project?: {
    id: string;           // Generated project ID
    name: string;         // Project name
    path: string;         // Full filesystem path
    templateId: string;   // Template used
    createdAt: string;    // ISO timestamp
    status: string;       // Creation status
  };
  error?: string;         // Error message if success is false
}
```

#### electronAPI.startProjectServer(projectId)
**Purpose**: Starts React development server for specified project

**Parameters**: `projectId` (string) - Unique project identifier

**Returns**:
```typescript
interface ServerResponse {
  success: boolean;
  url?: string;         // Server URL (e.g., 'http://localhost:3001')
  port?: number;        // Allocated port number
  pid?: number;         // Process ID of server
  error?: string;
}
```

**Implementation Details**:
- Automatically allocates available port from configured range (3000+)
- Sets environment variables: `PORT`, `BROWSER=none`
- Monitors stdout for "webpack compiled" confirmation
- Handles port conflicts with automatic retry

### Settings Management API

#### electronAPI.getSettings()
**Purpose**: Retrieves all application settings

**Returns**:
```typescript
interface SettingsResponse {
  success: boolean;
  settings: {
    projectsDirectory: string;      // Base directory for new projects
    defaultTemplate: string;        // Default project template
    devPortStart: number;          // Start of port range
    devPortEnd: number;            // End of port range
    autoOpenBrowser: boolean;      // Auto-open browser on server start
    enableDevTools: boolean;       // Enable Chrome DevTools
    maxRecentProjects: number;     // Max projects in dashboard
  };
}
```

#### electronAPI.saveSettings(settings)
**Purpose**: Saves application settings to persistent storage

**Validation Rules**:
- `projectsDirectory`: Must exist and be writable
- `devPortStart/End`: Must be valid port numbers (1000-65535)
- `maxRecentProjects`: Must be between 5-100

### Terminal PTY API

#### electronAPI.ptyStart(options)
**Purpose**: Starts a new PTY (pseudo-terminal) session

**Parameters**:
```typescript
interface PTYOptions {
  cwd?: string;         // Working directory (defaults to project path)
  cmd?: string;         // Command to run (defaults to 'claude')
  context?: {           // Context information for Claude Code
    projectId?: string;
    projectName?: string;
    projectPath?: string;
    currentFile?: string;
    activeTab?: string;
    serverUrl?: string;
  };
}
```

**Context Injection**: Terminal automatically receives environment variables:
```bash
export DESIGN_TOOL_PROJECT_ID="proj_123"
export DESIGN_TOOL_PROJECT_NAME="My App"
export DESIGN_TOOL_PROJECT_PATH="/path/to/project"
export DESIGN_TOOL_CURRENT_FILE="/path/to/current/file.jsx"
export DESIGN_TOOL_SERVER_URL="http://localhost:3001"
```

#### Event Listeners

**electronAPI.onPtyData(callback)**
Listens for output data from PTY processes.
Returns cleanup function to remove listener.

**electronAPI.onPtyExit(callback)**
Listens for PTY process exit events.

### Component Discovery API

#### electronAPI.discoverComponents(projectId)
**Purpose**: Scans project for React components and extracts metadata

**Returns**:
```typescript
interface ComponentDiscoveryResponse {
  success: boolean;
  components?: Component[];
  error?: string;
}

interface Component {
  name: string;             // Component name (e.g., 'Button')
  filePath: string;         // Absolute path to component file
  relativePath: string;     // Path relative to project root
  exportType: 'default' | 'named';
  props?: PropDefinition[]; // Extracted prop definitions
  variants?: Variant[];     // Detected component variants
  dependencies: string[];   // Import dependencies
  hasStories: boolean;      // Whether .stories file exists
  storiesPath?: string;     // Path to stories file if exists
}

interface Variant {
  name: string;             // Variant name (e.g., 'Primary')
  props: Record<string, any>; // Props for this variant
  description?: string;
}
```

**Discovery Process**:
1. **File Scanning**: Recursively scan project for `.jsx`, `.tsx` files
2. **AST Parsing**: Parse files to extract React components
3. **Prop Analysis**: Extract prop types and default values
4. **Variant Detection**: Look for variant patterns (Component.variants = [...])
5. **Story Detection**: Check for corresponding `.stories` files

## Frontend Utility Functions

### Project Management Functions

#### loadProjects()
**Purpose**: Loads and displays all projects in dashboard
**Process**:
1. Call `electronAPI.listProjects()`
2. Load thumbnails for each project
3. Check server status
4. Update UI with project cards
5. Handle loading states and errors

#### createProject(name, templateId)
**Purpose**: Handles complete project creation workflow
**Process**:
1. Validate input data
2. Show progress modal
3. Call `electronAPI.createProject()`
4. Listen for progress updates
5. Handle completion or errors
6. Refresh project list

### Terminal Management Functions

#### initializeTerminal()
**Purpose**: Sets up terminal sidebar with PTY integration
**Process**:
1. Initialize xterm.js instance
2. Setup fit addon for responsive sizing
3. Start PTY session with current context
4. Setup event listeners for data/exit
5. Handle input forwarding

#### updateTerminalContext(context)
**Purpose**: Updates terminal session with new context information

## Error Handling Patterns

### Error Response Format
All API functions return consistent error responses:
```typescript
interface ErrorResponse {
  success: false;
  error: string;          // Human-readable error message
  errorCode?: string;     // Machine-readable error code
  details?: any;          // Additional error context
}
```

### Common Error Codes
- `VALIDATION_ERROR`: Input validation failed
- `PROJECT_NOT_FOUND`: Specified project doesn't exist
- `SERVER_ERROR`: Development server operation failed
- `FILE_SYSTEM_ERROR`: File system operation failed
- `PORT_ALLOCATION_ERROR`: Cannot allocate port for server
- `PROCESS_ERROR`: Child process operation failed
- `PERMISSION_ERROR`: Insufficient permissions

### Frontend Error Handling Pattern
```javascript
try {
  const result = await window.electronAPI.createProject(config);
  if (!result.success) {
    showErrorNotification(result.error);
    return;
  }
  // Handle success
} catch (error) {
  console.error('Unexpected error:', error);
  showErrorNotification('An unexpected error occurred');
}
```

## Usage Examples

### Complete Project Creation Flow
```javascript
async function createNewProject() {
  try {
    // Validate input
    const nameValidation = validateProjectName(projectName);
    if (!nameValidation.success) {
      showError(nameValidation.error);
      return;
    }

    // Show progress modal
    showCreateProjectModal();
    
    // Create project
    const result = await window.electronAPI.createProject({
      name: projectName,
      templateId: selectedTemplate
    });

    if (result.success) {
      console.log('Project created successfully:', result.project);
      
      // Refresh project list
      await loadProjects();
      
      // Start server in background
      startProjectServerBackground(result.project.id);
      
      // Close modal
      closeCreateProjectModal();
    } else {
      showError(result.error);
    }
  } catch (error) {
    console.error('Project creation failed:', error);
    showError('Failed to create project');
  }
}
```

### Terminal Integration with Context
```javascript
async function setupTerminalWithContext() {
  const context = {
    projectId: currentProject.id,
    projectName: currentProject.name,
    projectPath: currentProject.path,
    currentFile: activeEditor?.filePath,
    serverUrl: projectServerUrl,
    activeTab: 'component-library'
  };

  try {
    const result = await window.electronAPI.ptyStart({
      cwd: currentProject.path,
      cmd: 'claude',
      context: context
    });

    if (result.success) {
      setupTerminalDisplay(result.pid);
    } else {
      showError('Failed to start terminal: ' + result.error);
    }
  } catch (error) {
    console.error('Terminal startup error:', error);
  }
}
```

## Security Architecture

### R1: Security Requirements
**R1.1**: The system SHALL use context isolation for all IPC communication
**R1.2**: The system SHALL disable node integration in renderer processes
**R1.3**: The system SHALL validate all user inputs before processing
**R1.4**: The system SHALL use secure defaults for all configuration options
**R1.5**: The system SHALL prevent execution of untrusted code

### Implementation Details
- **Context Isolation**: `contextIsolation: true` in webPreferences
- **Node Integration**: `nodeIntegration: false` in webPreferences
- **Preload Script**: Secure API exposure via contextBridge
- **Input Validation**: All IPC messages validated before processing
- **Process Isolation**: Main/renderer separation with secure communication

---

This technical reference provides comprehensive implementation details for developers working with the Design Tool system, following Generative Analysis methodology for precision and clarity.