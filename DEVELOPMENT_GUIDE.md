# Design Tool - Development Guide

## Overview

This guide provides developers with everything needed to understand, extend, and maintain the Design Tool application. The system is a production-ready Electron desktop application for React project management with integrated development servers, component discovery, and Claude Code terminal integration.

## Quick Reference

- **Architecture**: [COMPREHENSIVE_SYSTEM_DOCUMENTATION.md](./COMPREHENSIVE_SYSTEM_DOCUMENTATION.md)
- **API Reference**: [API_REFERENCE.md](./API_REFERENCE.md)
- **System Flows**: [SYSTEM_FLOWS_DOCUMENTATION.md](./SYSTEM_FLOWS_DOCUMENTATION.md)
- **Implementation Plans**: [PHASE_5_IMPLEMENTATION_PLAN.md](./PHASE_5_IMPLEMENTATION_PLAN.md)

## Table of Contents

1. [System Architecture Summary](#system-architecture-summary)
2. [Key Technologies](#key-technologies)
3. [Development Setup](#development-setup)
4. [Project Structure](#project-structure)
5. [Extension Points](#extension-points)
6. [Testing Strategy](#testing-strategy)
7. [Performance Considerations](#performance-considerations)
8. [Security Best Practices](#security-best-practices)
9. [Troubleshooting Guide](#troubleshooting-guide)
10. [Future Roadmap](#future-roadmap)

---

## System Architecture Summary

The Design Tool is built on a secure, multi-process architecture:

### Core Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    ELECTRON APPLICATION                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐         ┌─────────────────────────────┐ │
│  │   MAIN PROCESS  │◀──────▶│    RENDERER PROCESS         │ │
│  │   (Node.js)     │   IPC   │    (Chromium + React)       │ │
│  │                 │         │                             │ │
│  │ • Project Mgmt  │         │ • React Frontend            │ │
│  │ • Server Mgmt   │         │ • Project Dashboard         │ │
│  │ • PTY Terminals │         │ • Component Viewer          │ │
│  │ • File System   │         │ • Terminal UI               │ │
│  │ • Process Spawn │         │ • Settings Modal            │ │
│  └─────────────────┘         └─────────────────────────────┘ │
│           │                                   │              │
│           ▼                                   ▼              │
│  ┌─────────────────┐         ┌─────────────────────────────┐ │
│  │  CHILD PROCESSES│         │     SECURITY LAYER          │ │
│  │                 │         │                             │ │
│  │ • React Servers │         │ • Context Isolation         │ │
│  │ • Terminal PTY  │         │ • No Node Integration       │ │
│  │ • npm/yarn      │         │ • Secure IPC Bridge         │ │
│  │ • Thumbnails    │         │ • Input Validation          │ │
│  └─────────────────┘         └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Principles

1. **Security First**: Context isolation, no Node.js in renderer, secure IPC
2. **Process Isolation**: Child processes for servers and terminals
3. **Functional Programming**: Pure functions, immutable state patterns
4. **Resource Management**: Smart cleanup, memory management
5. **User Experience**: Non-blocking operations, progress feedback
6. **Extensibility**: Plugin architecture, modular design

---

## Key Technologies

### Core Stack
- **Electron 37.2.3**: Desktop application framework
- **Node.js**: Backend runtime environment
- **Chromium**: Frontend rendering engine
- **Vanilla JavaScript**: No frontend framework dependencies

### Key Dependencies

#### Main Process
```json
{
  "electron-store": "^8.1.0",    // Settings persistence
  "node-pty": "^1.0.0",         // Terminal emulation
  "child_process": "built-in"    // Process spawning
}
```

#### Renderer Process
```json
{
  "@xterm/xterm": "^5.5.0",      // Terminal UI
  "@xterm/addon-fit": "^0.10.0", // Terminal responsive sizing
  "lucide": "latest"             // Icon system
}
```

#### Development Tools
```json
{
  "nodemon": "^3.0.1",          // Auto-restart on changes
  "@electron/rebuild": "^4.0.1"  // Native module rebuilding
}
```

---

## Development Setup

### Prerequisites
```bash
# Required software
Node.js >= 18.0.0
npm >= 8.0.0
Git

# Optional but recommended
Claude Code CLI (for terminal integration)
```

### Installation
```bash
# Clone repository
git clone <repository-url>
cd design-tool

# Install dependencies
npm install

# Rebuild native modules for Electron
npm run rebuild

# Start in development mode
npm run dev

# Or start with auto-restart on changes
npm run dev:watch
```

### Development Scripts
```bash
npm start          # Production mode
npm run dev        # Development with DevTools
npm run dev:watch  # Development with auto-restart
```

### Development Environment
```javascript
// Environment detection
const isDev = process.argv.includes('--dev');

// Development features
if (isDev) {
  // Chrome DevTools enabled
  // Web security disabled for local development
  // Hot reload enabled
  // Console logging enabled
}
```

---

## Project Structure

```
design-tool/
├── main.js                 # Electron main process
├── preload.js             # Secure IPC bridge
├── app.js                 # Frontend application logic
├── index.html             # UI structure and styling
├── design-tokens.css      # Design system tokens
├── package.json           # Dependencies and scripts
├── 
├── Documentation/
│   ├── COMPREHENSIVE_SYSTEM_DOCUMENTATION.md
│   ├── API_REFERENCE.md
│   ├── SYSTEM_FLOWS_DOCUMENTATION.md
│   └── DEVELOPMENT_GUIDE.md
│
├── assets/
│   └── thumbnails/        # Generated project thumbnails
│
├── projects/              # Created projects directory
│   ├── my-react-app/
│   ├── another-project/
│   └── .../
│
└── node_modules/          # Dependencies
```

### Code Organization

#### Main Process (`main.js`)
```javascript
// Pure functions for project operations
function createProjectConfig(name, templateId) { ... }
function validateProjectPath(projectPath) { ... }
function generateProjectStructure(template, projectName) { ... }

// Process management
async function startProjectServer(projectId) { ... }
async function startPTYSession(options) { ... }

// IPC handlers
ipcMain.handle('project:create', async (event, config) => { ... });
ipcMain.handle('project:start-server', async (event, projectId) => { ... });
```

#### Frontend (`app.js`)
```javascript
// Application state
let appState = {
  projects: [],
  currentView: 'grid',
  projectServers: new Map()
};

// View management
function showDashboard() { ... }
function showProjectView(projectId) { ... }

// Project operations
async function createProject(name, templateId) { ... }
async function openProject(projectId) { ... }
```

#### Security Layer (`preload.js`)
```javascript
// Secure API exposure
contextBridge.exposeInMainWorld('electronAPI', {
  createProject: (config) => ipcRenderer.invoke('project:create', config),
  startProjectServer: (id) => ipcRenderer.invoke('project:start-server', id),
  // ... other secure APIs
});
```

---

## Extension Points

### 1. Adding New Project Templates

```javascript
// In main.js - PROJECT_TEMPLATES constant
const PROJECT_TEMPLATES = {
  'my-custom-template': {
    id: 'my-custom-template',
    name: 'My Custom Template',
    description: 'Custom React template with specific setup',
    dependencies: ['react', 'react-dom', 'my-custom-lib'],
    features: ['Custom components', 'Special configuration']
  }
};

// Add template generation logic
function generateCustomTemplateStructure(projectName) {
  return [
    { path: 'package.json', type: 'file', content: generateCustomPackageJson(projectName) },
    { path: 'src/CustomApp.jsx', type: 'file', content: generateCustomApp(projectName) },
    // ... more files
  ];
}
```

### 2. Adding New IPC Handlers

```javascript
// In main.js
ipcMain.handle('my-custom-operation', async (event, params) => {
  try {
    // Validate input
    const validation = validateCustomInput(params);
    if (!validation.success) {
      return { success: false, error: validation.error };
    }

    // Perform operation
    const result = await performCustomOperation(params);
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Custom operation failed:', error);
    return { success: false, error: error.message };
  }
});

// In preload.js
contextBridge.exposeInMainWorld('electronAPI', {
  // ... existing APIs
  customOperation: (params) => ipcRenderer.invoke('my-custom-operation', params)
});

// In app.js
async function handleCustomOperation(params) {
  const result = await window.electronAPI.customOperation(params);
  if (result.success) {
    // Handle success
  } else {
    // Handle error
  }
}
```

### 3. Adding New UI Views

```javascript
// In app.js
function showCustomView(params) {
  // Hide other views
  document.getElementById('dashboard-view').style.display = 'none';
  document.getElementById('project-view').style.display = 'none';
  
  // Show custom view
  const customView = document.getElementById('custom-view');
  customView.style.display = 'block';
  
  // Update app state
  appContext.currentView = 'custom';
  updateBreadcrumbs(['Home', 'Custom View']);
  
  // Load custom content
  loadCustomContent(params);
}

// Add to index.html
/*
<div id="custom-view" class="view-container" style="display: none;">
  <div class="custom-content">
    <!-- Custom view content -->
  </div>
</div>
*/
```

### 4. Extending Component Discovery

```javascript
// In main.js - Component discovery extension
async function discoverCustomComponents(projectPath) {
  const files = await scanForCustomFiles(projectPath, ['.vue', '.svelte']);
  const components = [];
  
  for (const file of files) {
    const component = await parseCustomComponent(file);
    if (component) {
      components.push(component);
    }
  }
  
  return components;
}

async function parseCustomComponent(filePath) {
  // Custom parsing logic for different component types
  const content = await fs.readFile(filePath, 'utf-8');
  
  // Parse based on file extension
  if (filePath.endsWith('.vue')) {
    return parseVueComponent(content, filePath);
  } else if (filePath.endsWith('.svelte')) {
    return parseSvelteComponent(content, filePath);
  }
  
  return null;
}
```

---

## Testing Strategy

### Unit Testing Setup

```javascript
// package.json
{
  "devDependencies": {
    "jest": "^29.0.0",
    "electron": "^37.2.3",
    "@testing-library/dom": "^9.0.0"
  },
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}

// jest.config.js
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'main.js',
    'app.js',
    'preload.js',
    '!node_modules/**'
  ]
};
```

### Test Examples

```javascript
// __tests__/project-creation.test.js
const { validateProjectName, createProjectConfig } = require('../main');

describe('Project Creation', () => {
  test('validates project name correctly', () => {
    expect(validateProjectName('Valid Name')).toEqual({
      success: true,
      value: 'Valid Name'
    });
    
    expect(validateProjectName('ab')).toEqual({
      success: false,
      error: 'Project name must be at least 3 characters'
    });
  });

  test('creates project config with defaults', () => {
    const config = createProjectConfig('Test Project', 'react-basic');
    
    expect(config.name).toBe('Test Project');
    expect(config.templateId).toBe('react-basic');
    expect(config.id).toMatch(/^proj_/);
    expect(config.status).toBe('CREATING');
  });
});

// __tests__/frontend.test.js
/**
 * @jest-environment jsdom
 */
const { JSDOM } = require('jsdom');

// Mock electron API
global.window = {
  electronAPI: {
    listProjects: jest.fn(() => Promise.resolve({ success: true, projects: [] }))
  }
};

// Load app.js in test environment
require('../app');

describe('Frontend Functions', () => {
  test('loads projects on initialization', async () => {
    await loadProjects();
    expect(window.electronAPI.listProjects).toHaveBeenCalled();
  });
});
```

### Integration Testing

```javascript
// __tests__/integration/project-flow.test.js
const { app } = require('electron');
const path = require('path');

describe('Project Creation Flow', () => {
  let electronApp;
  
  beforeAll(async () => {
    // Start Electron app for testing
    electronApp = await require('electron').app.whenReady();
  });
  
  afterAll(async () => {
    await electronApp.quit();
  });
  
  test('complete project creation workflow', async () => {
    // Test full project creation process
    const projectConfig = {
      name: 'Test Project',
      templateId: 'react-basic'
    };
    
    // This would test the actual IPC communication
    const result = await simulateProjectCreation(projectConfig);
    
    expect(result.success).toBe(true);
    expect(result.project.name).toBe('Test Project');
  });
});
```

---

## Performance Considerations

### Memory Management

```javascript
// Efficient resource cleanup
class ResourceManager {
  constructor() {
    this.activeProcesses = new Map();
    this.cleanupInterval = setInterval(this.cleanup.bind(this), 60000); // 1 minute
  }
  
  addProcess(id, process) {
    this.activeProcesses.set(id, {
      process,
      lastActivity: Date.now()
    });
  }
  
  cleanup() {
    const now = Date.now();
    const maxIdleTime = 5 * 60 * 1000; // 5 minutes
    
    for (const [id, info] of this.activeProcesses) {
      if (now - info.lastActivity > maxIdleTime) {
        console.log(`Cleaning up idle process: ${id}`);
        info.process.kill();
        this.activeProcesses.delete(id);
      }
    }
  }
}
```

### Async Operation Optimization

```javascript
// Batch async operations
async function loadProjectsOptimized() {
  const projectsResult = await window.electronAPI.listProjects();
  if (!projectsResult.success) return;
  
  // Batch thumbnail loading
  const thumbnailPromises = projectsResult.projects.map(project =>
    window.electronAPI.getProjectThumbnail(project.id)
      .catch(error => ({ success: false, error: error.message }))
  );
  
  // Load thumbnails in parallel with limit
  const thumbnails = await Promise.all(thumbnailPromises);
  
  // Update UI efficiently
  requestAnimationFrame(() => {
    updateProjectDisplay(projectsResult.projects, thumbnails);
  });
}
```

### Caching Strategy

```javascript
// Intelligent caching for expensive operations
class CacheManager {
  constructor() {
    this.cache = new Map();
    this.maxAge = 60 * 60 * 1000; // 1 hour
  }
  
  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }
  
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  // Use for component discovery, thumbnail generation, etc.
  async getOrCompute(key, computeFn) {
    const cached = this.get(key);
    if (cached) return cached;
    
    const value = await computeFn();
    this.set(key, value);
    return value;
  }
}
```

---

## Security Best Practices

### Context Isolation
```javascript
// main.js - Secure window configuration
function createMainWindow() {
  return new BrowserWindow({
    webPreferences: {
      nodeIntegration: false,        // No Node.js in renderer
      contextIsolation: true,        // Isolate contexts
      enableRemoteModule: false,     // No remote module
      preload: path.join(__dirname, 'preload.js'), // Secure bridge
      webSecurity: !isDev           // Enable web security in production
    }
  });
}
```

### Input Validation
```javascript
// Always validate IPC inputs
ipcMain.handle('project:create', async (event, projectConfig) => {
  // Validate all inputs
  if (!projectConfig || typeof projectConfig !== 'object') {
    return { success: false, error: 'Invalid project configuration' };
  }
  
  const nameValidation = validateProjectName(projectConfig.name);
  if (!nameValidation.success) {
    return { success: false, error: nameValidation.error };
  }
  
  const templateValidation = validateProjectTemplate(projectConfig.templateId);
  if (!templateValidation.success) {
    return { success: false, error: templateValidation.error };
  }
  
  // Sanitize file paths
  const sanitizedPath = path.resolve(projectConfig.path);
  if (!sanitizedPath.startsWith(allowedBasePath)) {
    return { success: false, error: 'Invalid project path' };
  }
  
  // Proceed with validated data
  return await createProjectSafely(projectConfig);
});
```

### Process Isolation
```javascript
// Secure child process spawning
function spawnSecureProcess(command, args, options = {}) {
  // Sanitize command and arguments
  const sanitizedCommand = path.basename(command);
  const allowedCommands = ['npm', 'yarn', 'node'];
  
  if (!allowedCommands.includes(sanitizedCommand)) {
    throw new Error(`Command not allowed: ${sanitizedCommand}`);
  }
  
  // Set secure environment
  const secureEnv = {
    ...process.env,
    NODE_ENV: 'production',
    // Remove potentially dangerous env vars
    LD_PRELOAD: undefined,
    LD_LIBRARY_PATH: undefined
  };
  
  return spawn(sanitizedCommand, args, {
    ...options,
    env: secureEnv,
    stdio: ['pipe', 'pipe', 'pipe'] // Control all stdio
  });
}
```

---

## Troubleshooting Guide

### Common Issues

#### 1. PTY Terminal Not Starting
```bash
# Symptoms
- Terminal sidebar shows loading but never initializes
- Console error: "pty.spawn is not a function"

# Solutions
1. Rebuild native modules:
   npm run rebuild

2. Check node-pty installation:
   npm install node-pty --save

3. Verify Python/build tools (Windows):
   npm install --global windows-build-tools
```

#### 2. Development Server Won't Start
```bash
# Symptoms
- Project shows "Server failed to start"
- Port allocation errors

# Solutions
1. Check port availability:
   netstat -tulpn | grep :3000

2. Update port range in settings:
   Settings -> Development -> Port Range

3. Clear port reservation:
   Kill existing processes on ports
```

#### 3. Component Discovery Fails
```bash
# Symptoms
- Component library shows "No components found"
- AST parsing errors in console

# Solutions
1. Check project structure:
   Ensure .jsx/.tsx files exist in src/

2. Verify React syntax:
   Run project build to check for errors

3. Clear component cache:
   Restart application
```

#### 4. Thumbnail Generation Issues
```bash
# Symptoms
- Projects show fallback thumbnails
- Capture errors in console

# Solutions
1. Ensure dev server is running:
   Check server status in project view

2. Check headless browser permissions:
   Disable security software temporarily

3. Clear thumbnail cache:
   Delete assets/thumbnails/ directory
```

### Debug Mode

Enable debug logging:
```javascript
// In main.js
const DEBUG = process.argv.includes('--debug');

function debugLog(message, data = null) {
  if (DEBUG) {
    console.log(`[DEBUG] ${message}`, data);
  }
}

// Usage
debugLog('Starting project server', { projectId, port });
```

### Logging Strategy

```javascript
// Structured logging
class Logger {
  static log(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      context
    };
    
    console.log(JSON.stringify(logEntry));
    
    // In production, write to file
    if (process.env.NODE_ENV === 'production') {
      fs.appendFileSync('app.log', JSON.stringify(logEntry) + '\n');
    }
  }
  
  static error(message, error, context = {}) {
    this.log('ERROR', message, { ...context, error: error.stack });
  }
  
  static info(message, context = {}) {
    this.log('INFO', message, context);
  }
  
  static debug(message, context = {}) {
    if (DEBUG) {
      this.log('DEBUG', message, context);
    }
  }
}
```

---

## Future Roadmap

### Short Term (1-3 months)
- **Storybook Integration**: Native Storybook embedding
- **Hot Module Reloading**: Real-time component updates
- **Component Code Editor**: In-app code editing with Monaco
- **Git Integration**: Version control features

### Medium Term (3-6 months)
- **Team Collaboration**: Real-time project sharing
- **Plugin System**: Third-party extension support
- **Advanced Component Analysis**: Dependency graphs, usage tracking
- **Performance Monitoring**: Built-in performance profiling

### Long Term (6+ months)
- **Cloud Sync**: Project synchronization across devices
- **AI-Powered Features**: Component generation, optimization suggestions
- **Design System Integration**: Figma/Sketch integration
- **Multi-Framework Support**: Vue, Svelte, Angular support

### Architecture Evolution

```javascript
// Plugin system architecture
class PluginManager {
  constructor() {
    this.plugins = new Map();
    this.hooks = new Map();
  }
  
  registerPlugin(plugin) {
    this.plugins.set(plugin.id, plugin);
    
    // Register plugin hooks
    for (const [hookName, handler] of plugin.hooks) {
      if (!this.hooks.has(hookName)) {
        this.hooks.set(hookName, []);
      }
      this.hooks.get(hookName).push(handler);
    }
  }
  
  async executeHook(hookName, data) {
    const handlers = this.hooks.get(hookName) || [];
    
    for (const handler of handlers) {
      data = await handler(data);
    }
    
    return data;
  }
}

// Example plugin
const customTemplatePlugin = {
  id: 'custom-templates',
  name: 'Custom Templates',
  version: '1.0.0',
  
  hooks: new Map([
    ['project:templates', async (templates) => {
      templates.push({
        id: 'custom-template',
        name: 'Custom Template',
        generate: generateCustomTemplate
      });
      return templates;
    }],
    
    ['component:discovery', async (components) => {
      const customComponents = await discoverCustomComponents();
      return [...components, ...customComponents];
    }]
  ])
};
```

---

## Conclusion

The Design Tool represents a sophisticated, production-ready desktop application that successfully combines modern web technologies with desktop application patterns. Its architecture provides a solid foundation for future enhancements while maintaining security, performance, and user experience as core priorities.

The modular design, comprehensive documentation, and extensive extension points make it suitable for both individual developers and team environments. The application's focus on React component development, combined with integrated development tools and Claude Code terminal integration, creates a unique and powerful development environment.

For developers looking to contribute or extend the system, the key areas of focus should be:

1. **Maintaining Security**: Always follow the established security patterns
2. **Performance Optimization**: Consider resource usage in all new features
3. **User Experience**: Maintain the non-blocking, responsive design patterns
4. **Code Quality**: Follow the functional programming and pure function patterns established in the codebase

The comprehensive documentation provided here should serve as a complete reference for understanding, maintaining, and extending the Design Tool application.