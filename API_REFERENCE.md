# Design Tool - API Reference

## IPC Communication API

This document provides detailed reference for all IPC (Inter-Process Communication) methods available in the Design Tool application.

## Table of Contents

1. [Project Management API](#project-management-api)
2. [Settings Management API](#settings-management-api)
3. [Project Registry API](#project-registry-api)
4. [Terminal PTY API](#terminal-pty-api)
5. [Component Discovery API](#component-discovery-api)
6. [Thumbnail Generation API](#thumbnail-generation-api)
7. [Frontend Utility Functions](#frontend-utility-functions)
8. [Error Handling](#error-handling)

---

## Project Management API

### `electronAPI.createProject(projectConfig)`

Creates a new React project with the specified configuration.

**Parameters:**
```typescript
interface ProjectConfig {
  name: string;           // Project name (3-50 characters, alphanumeric + spaces/hyphens)
  templateId: string;     // Template identifier ('react-basic', 'react-storybook', etc.)
}
```

**Returns:**
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

**Example:**
```javascript
const result = await window.electronAPI.createProject({
  name: "My React App",
  templateId: "react-storybook"
});

if (result.success) {
  console.log('Project created:', result.project);
} else {
  console.error('Creation failed:', result.error);
}
```

---

### `electronAPI.openProject(projectId)`

Opens an existing project in the project viewer.

**Parameters:**
- `projectId` (string): Unique project identifier

**Returns:**
```typescript
interface OpenProjectResponse {
  success: boolean;
  project?: {
    id: string;
    name: string;
    path: string;
    lastModified: string;
    components?: Component[];
    workflows?: Workflow[];
  };
  error?: string;
}
```

---

### `electronAPI.startProjectServer(projectId)`

Starts a React development server for the specified project.

**Parameters:**
- `projectId` (string): Project identifier

**Returns:**
```typescript
interface ServerResponse {
  success: boolean;
  url?: string;         // Server URL (e.g., 'http://localhost:3001')
  port?: number;        // Allocated port number
  pid?: number;         // Process ID of server
  error?: string;
}
```

**Implementation Details:**
- Automatically allocates available port from configured range
- Sets environment variables: `PORT`, `BROWSER=none`
- Monitors server startup and reports when ready
- Handles port conflicts and retries

---

### `electronAPI.stopProjectServer(projectId)`

Stops the running development server for a project.

**Parameters:**
- `projectId` (string): Project identifier

**Returns:**
```typescript
interface StopServerResponse {
  success: boolean;
  error?: string;
}
```

---

### `electronAPI.getProjectServerStatus(projectId)`

Gets the current status of a project's development server.

**Parameters:**
- `projectId` (string): Project identifier

**Returns:**
```typescript
interface ServerStatusResponse {
  success: boolean;
  status: 'running' | 'stopped' | 'starting' | 'failed';
  url?: string;
  port?: number;
  pid?: number;
  uptime?: number;      // Seconds since server started
  error?: string;
}
```

---

## Settings Management API

### `electronAPI.getSettings()`

Retrieves all application settings.

**Returns:**
```typescript
interface SettingsResponse {
  success: boolean;
  settings: {
    projectsDirectory: string;      // Base directory for new projects
    defaultTemplate: string;        // Default project template
    devPortStart: number;          // Start of port range for dev servers
    devPortEnd: number;            // End of port range
    autoOpenBrowser: boolean;      // Auto-open browser on server start
    enableDevTools: boolean;       // Enable Chrome DevTools in dev mode
    maxRecentProjects: number;     // Max projects to show in dashboard
  };
}
```

---

### `electronAPI.saveSettings(settings)`

Saves application settings to persistent storage.

**Parameters:**
```typescript
interface Settings {
  projectsDirectory?: string;
  defaultTemplate?: string;
  devPortStart?: number;
  devPortEnd?: number;
  autoOpenBrowser?: boolean;
  enableDevTools?: boolean;
  maxRecentProjects?: number;
}
```

**Returns:**
```typescript
interface SaveSettingsResponse {
  success: boolean;
  error?: string;
}
```

**Validation:**
- `projectsDirectory`: Must exist and be writable
- `devPortStart/End`: Must be valid port numbers (1000-65535)
- `maxRecentProjects`: Must be between 5-100

---

### `electronAPI.chooseDirectory()`

Opens native directory picker dialog.

**Returns:**
```typescript
interface DirectoryResponse {
  success: boolean;
  directory?: string;   // Selected directory path
  cancelled?: boolean;  // True if user cancelled dialog
}
```

---

### `electronAPI.resetSettings()`

Resets all settings to default values.

**Returns:**
```typescript
interface ResetResponse {
  success: boolean;
}
```

---

## Project Registry API

### `electronAPI.listProjects()`

Gets all registered projects with their metadata.

**Returns:**
```typescript
interface ProjectsResponse {
  success: boolean;
  projects: Project[];
}

interface Project {
  id: string;
  name: string;
  path: string;
  templateId: string;
  template: {
    id: string;
    name: string;
    description: string;
    dependencies: string[];
    features: string[];
  };
  createdAt: string;
  lastModified: string;
  status: 'ACTIVE' | 'CREATING' | 'ERROR';
  thumbnailPath?: string;
  serverStatus?: 'running' | 'stopped';
  workflows?: Workflow[];
}
```

---

### `electronAPI.addProject(projectData)`

Adds a new project to the registry.

**Parameters:**
```typescript
interface ProjectData {
  id: string;
  name: string;
  path: string;
  templateId: string;
  // ... other project properties
}
```

---

### `electronAPI.updateProject(projectId, updates)`

Updates project metadata in the registry.

**Parameters:**
- `projectId` (string): Project identifier
- `updates` (object): Partial project data to update

---

### `electronAPI.removeProject(projectId)`

⚠️ **DESTRUCTIVE**: Removes a project from the registry AND permanently deletes all project files from disk.

**Parameters:**
- `projectId` (string): Project identifier

**Returns:**
```typescript
interface RemoveResponse {
  success: boolean;
  error?: string;
}
```

---

## Terminal PTY API

### `electronAPI.ptyStart(options)`

Starts a new PTY (pseudo-terminal) session.

**Parameters:**
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
    [key: string]: any;
  };
}
```

**Returns:**
```typescript
interface PTYResponse {
  success: boolean;
  pid: number;          // Process ID of PTY session
  error?: string;
}
```

**Context Injection:**
The terminal automatically receives context through environment variables:
```bash
export DESIGN_TOOL_PROJECT_ID="proj_123"
export DESIGN_TOOL_PROJECT_NAME="My App"
export DESIGN_TOOL_PROJECT_PATH="/path/to/project"
export DESIGN_TOOL_CURRENT_FILE="/path/to/current/file.jsx"
export DESIGN_TOOL_SERVER_URL="http://localhost:3001"
```

---

### `electronAPI.ptyWrite(pid, data)`

Sends input data to a PTY process.

**Parameters:**
- `pid` (number): Process ID from ptyStart
- `data` (string): Input data to send

**Note:** This is a send-only operation (no return value)

---

### `electronAPI.ptyResize(pid, cols, rows)`

Resizes the PTY terminal dimensions.

**Parameters:**
- `pid` (number): Process ID
- `cols` (number): Terminal columns
- `rows` (number): Terminal rows

---

### `electronAPI.ptyKill(pid)`

Terminates a PTY process.

**Parameters:**
- `pid` (number): Process ID to terminate

**Returns:**
```typescript
interface KillResponse {
  success: boolean;
}
```

---

### Event Listeners

#### `electronAPI.onPtyData(callback)`

Listens for output data from PTY processes.

**Parameters:**
- `callback` (function): Called with `{ pid: number, data: string }`

**Returns:** Cleanup function to remove listener

**Example:**
```javascript
const cleanup = window.electronAPI.onPtyData((eventData) => {
  console.log(`Output from PID ${eventData.pid}:`, eventData.data);
  // Update terminal display
});

// Later, cleanup when component unmounts
cleanup();
```

#### `electronAPI.onPtyExit(callback)`

Listens for PTY process exit events.

**Parameters:**
- `callback` (function): Called with `{ pid: number, exitCode: number }`

---

## Component Discovery API

### `electronAPI.discoverComponents(projectId)`

Scans a project for React components and extracts metadata.

**Parameters:**
- `projectId` (string): Project identifier

**Returns:**
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

interface PropDefinition {
  name: string;
  type: string;             // TypeScript type or 'any'
  required: boolean;
  defaultValue?: any;
  description?: string;
}

interface Variant {
  name: string;             // Variant name (e.g., 'Primary', 'Secondary')
  props: Record<string, any>; // Props for this variant
  description?: string;
}
```

**Discovery Process:**
1. **File Scanning**: Recursively scan project for `.jsx`, `.tsx` files
2. **AST Parsing**: Parse files to extract React components
3. **Prop Analysis**: Extract prop types and default values
4. **Variant Detection**: Look for variant patterns (prop combinations)
5. **Story Detection**: Check for corresponding `.stories` files

---

## Thumbnail Generation API

### `electronAPI.generateProjectThumbnail(projectId, forceRegenerate)`

Generates a thumbnail image for a project.

**Parameters:**
- `projectId` (string): Project identifier
- `forceRegenerate` (boolean): Force regeneration even if recent thumbnail exists

**Returns:**
```typescript
interface ThumbnailResponse {
  success: boolean;
  thumbnailPath?: string;   // Path to generated thumbnail
  fallback?: boolean;       // True if using template fallback
  error?: string;
}
```

**Process:**
1. **Server Check**: Verify development server is running
2. **Headless Browser**: Create hidden Electron window
3. **Page Load**: Load project URL and wait for render
4. **Screenshot**: Capture page screenshot
5. **Processing**: Resize and optimize image
6. **Caching**: Save to project thumbnail directory

**Fallback Behavior:**
- If server not running: Returns template-based fallback identifier
- If capture fails: Returns error with fallback option
- If project not found: Returns error

---

### `electronAPI.getProjectThumbnail(projectId)`

Retrieves the path to an existing project thumbnail.

**Parameters:**
- `projectId` (string): Project identifier

**Returns:**
```typescript
interface GetThumbnailResponse {
  success: boolean;
  thumbnailPath?: string;
  fallback?: boolean;
  error?: string;
}
```

---

## Frontend Utility Functions

### Project Management

#### `loadProjects()`

Loads and displays all projects in the dashboard.

**Process:**
1. Call `electronAPI.listProjects()`
2. Load thumbnails for each project
3. Check server status
4. Update UI with project cards
5. Handle loading states and errors

#### `createProject(name, templateId)`

Handles the complete project creation workflow.

**Process:**
1. Validate input data
2. Show progress modal
3. Call `electronAPI.createProject()`
4. Listen for progress updates
5. Handle completion or errors
6. Refresh project list

#### `openProject(projectId)`

Opens a project in the project viewer.

**Process:**
1. Start development server in background
2. Discover components
3. Load workflows
4. Update application context
5. Transition to project view

### View Management

#### `showDashboard()`

Navigates back to the main dashboard.

**Process:**
1. Schedule server cleanup (after delay)
2. Clear project context
3. Update breadcrumbs
4. Transition view

#### `setViewMode(mode)`

Toggles between grid and list view modes.

**Parameters:**
- `mode` ('grid' | 'list'): Display mode

### Terminal Management

#### `initializeTerminal()`

Sets up the terminal sidebar with PTY integration.

**Process:**
1. Initialize xterm.js instance
2. Setup fit addon for responsive sizing
3. Start PTY session with current context
4. Setup event listeners for data/exit
5. Handle input forwarding

#### `updateTerminalContext(context)`

Updates the terminal session with new context information.

**Parameters:**
```typescript
interface TerminalContext {
  projectId?: string;
  projectPath?: string;
  currentFile?: string;
  serverUrl?: string;
}
```

---

## Error Handling

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
- `NETWORK_ERROR`: Network operation failed

### Error Handling Patterns

#### Frontend Error Handling
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

#### Graceful Degradation
- **Offline Mode**: Show static component previews when server unavailable
- **Fallback Thumbnails**: Use template-based thumbnails when capture fails
- **Error Boundaries**: Isolate component failures to prevent app crashes
- **Retry Logic**: Automatic retry for transient failures

---

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

---

This API reference provides comprehensive documentation for all available functionality in the Design Tool application. For implementation details and architectural information, refer to the main system documentation.