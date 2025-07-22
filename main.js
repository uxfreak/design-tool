/**
 * Main Electron Process
 * Basic Electron application following Generative Analysis principles
 */

const { app, BrowserWindow, ipcMain, dialog, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const { spawn } = require('child_process');
const os = require('os');
const pty = require('node-pty');
const Store = require('electron-store');
const https = require('https');
const { URL } = require('url');

// Application state
let mainWindow = null;
let activeProcesses = new Map();
let projectServers = new Map(); // Track running React dev servers by project ID
let usedPorts = new Set([3000, 3001]); // Reserve common dev ports
let terminalProcesses = new Map(); // Track running PTY terminal processes by PID
let terminalSessions = new Map(); // Track terminal sessions with metrics
let inputBuffers = new Map(); // Buffer keystrokes until complete commands
let outputBuffers = new Map(); // Buffer output until meaningful chunks

// Settings store
const store = new Store({
  defaults: {
    projectsDirectory: path.join(os.homedir(), 'DesignToolProjects'),
    defaultTemplate: 'react-storybook',
    devPortStart: 3000,
    devPortEnd: 3999,
    autoOpenBrowser: false,
    enableDevTools: true,
    maxRecentProjects: 20,
    projects: [] // Store project registry in backend
  }
});

// Project creation state
const PROJECT_CREATION_STEPS = {
  PLANNING: 'Planning project structure',
  SCAFFOLDING: 'Creating files and directories', 
  INSTALLING: 'Installing dependencies',
  CONFIGURING: 'Configuring development tools',
  READY: 'Project ready for development'
};

// Pure Functions - Project Creation Layer

/**
 * Create default workflow from project configuration (PURE FUNCTION)
 * @param {Object} projectConfig - Project configuration
 * @returns {Object} Default workflow object
 */
function createDefaultWorkflow(projectConfig) {
  return {
    id: `${projectConfig.id}_landing`,
    name: "Landing Page",
    description: "Default welcome page workflow",
    steps: [
      { 
        id: 'step_1', 
        component: "App", 
        screen: "Welcome Page", 
        order: 0,
        description: "Main application landing page"
      }
    ],
    componentCount: 1,
    isDefault: true,
    createdAt: new Date().toISOString()
  };
}

/**
 * Add workflow to project data (PURE FUNCTION - IMMUTABLE)
 * @param {Object} project - Project object
 * @param {Object} workflow - Workflow to add
 * @returns {Object} New project object with workflow added
 */
function addWorkflowToProject(project, workflow) {
  return {
    ...project,
    workflows: [...(project.workflows || []), workflow],
    lastModified: new Date().toISOString()
  };
}

/**
 * Create project with default workflow (COMPOSITION FUNCTION)
 * @param {Object} projectConfig - Project configuration
 * @returns {Object} Result with project data and workflow
 */
function createProjectWithDefaultWorkflow(projectConfig) {
  try {
    const workflow = createDefaultWorkflow(projectConfig);
    const projectData = addWorkflowToProject(projectConfig, workflow);
    
    return { success: true, project: projectData, workflow };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Validate project path for file system compatibility
 * @param {string} projectPath - Proposed project path
 * @returns {Object} Result object with success/error
 */
function validateProjectPath(projectPath) {
  if (!projectPath || typeof projectPath !== 'string') {
    return { success: false, error: 'Project path is required' };
  }
  
  // Check for invalid characters
  const invalidChars = /[<>:"|?*]/;
  if (invalidChars.test(projectPath)) {
    return { success: false, error: 'Project path contains invalid characters' };
  }
  
  return { success: true, value: projectPath };
}

/**
 * Ensure directory exists, create it if it doesn't
 * @param {string} dirPath - Directory path to ensure exists
 */
async function ensureDirectoryExists(dirPath) {
  try {
    await fs.access(dirPath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.mkdir(dirPath, { recursive: true });
      console.log('📁 Created directory:', dirPath);
    } else {
      throw error;
    }
  }
}

/**
 * Generate project structure based on template
 * @param {Object} template - Project template definition
 * @param {string} projectName - Name of the project
 * @returns {Array} File definitions to create
 */
function generateProjectStructure(template, projectName) {
  const baseStructure = {
    'react-basic': [
      { path: 'package.json', type: 'file', content: generatePackageJson(projectName, template) },
      { path: 'index.html', type: 'file', content: generateIndexHtml(projectName) },
      { path: 'src', type: 'directory' },
      { path: 'src/App.jsx', type: 'file', content: generateAppComponent(projectName) },
      { path: 'src/main.jsx', type: 'file', content: generateMainJs() },
      { path: 'vite.config.js', type: 'file', content: generateViteConfig() }
    ],
    'react-storybook': [
      { path: 'package.json', type: 'file', content: generatePackageJson(projectName, template) },
      { path: 'index.html', type: 'file', content: generateIndexHtml(projectName) },
      { path: 'src', type: 'directory' },
      { path: 'src/App.jsx', type: 'file', content: generateAppComponent(projectName) },
      { path: 'src/main.jsx', type: 'file', content: generateMainJs() },
      { path: 'src/stories', type: 'directory' },
      { path: 'src/stories/Button.jsx', type: 'file', content: generateButtonComponent() },
      { path: 'src/stories/Button.stories.js', type: 'file', content: generateButtonStory() },
      { path: 'vite.config.js', type: 'file', content: generateViteConfig() },
      { path: '.storybook', type: 'directory' },
      { path: '.storybook/main.js', type: 'file', content: generateStorybookMain() }
    ]
  };
  
  return baseStructure[template.id] || baseStructure['react-basic'];
}

/**
 * Allocate unique port for development server
 * @param {Set} usedPorts - Set of currently used ports
 * @returns {number} Available port number
 */
function allocateUniquePort(usedPorts) {
  let port = 6006; // Start with Storybook default
  while (usedPorts.has(port)) {
    port++;
  }
  return port;
}

/**
 * Create project creation plan with steps
 * @param {Object} config - Project configuration
 * @returns {Object} Project creation plan
 */
function createProjectPlan(config) {
  const steps = [
    { id: 'planning', name: PROJECT_CREATION_STEPS.PLANNING, status: 'PENDING', progress: 0 },
    { id: 'scaffolding', name: PROJECT_CREATION_STEPS.SCAFFOLDING, status: 'PENDING', progress: 0 },
    { id: 'installing', name: PROJECT_CREATION_STEPS.INSTALLING, status: 'PENDING', progress: 0 },
    { id: 'configuring', name: PROJECT_CREATION_STEPS.CONFIGURING, status: 'PENDING', progress: 0 },
    { id: 'ready', name: PROJECT_CREATION_STEPS.READY, status: 'PENDING', progress: 0 }
  ];
  
  return {
    projectId: config.id,
    projectName: config.name,
    templateId: config.templateId,
    steps: steps,
    currentStep: 0,
    overallProgress: 0
  };
}

// Template Content Generators

function generatePackageJson(projectName, template) {
  const base = {
    name: projectName.toLowerCase().replace(/\s+/g, '-'),
    private: true,
    version: "0.0.0",
    type: "module",
    scripts: {
      dev: "vite",
      build: "vite build",
      preview: "vite preview"
    },
    dependencies: {
      react: "^18.2.0",
      "react-dom": "^18.2.0"
    },
    devDependencies: {
      "@types/react": "^18.2.15",
      "@types/react-dom": "^18.2.7",
      "@vitejs/plugin-react": "^4.0.3",
      vite: "^4.4.5"
    }
  };
  
  if (template.id.includes('storybook')) {
    base.scripts.storybook = "storybook dev -p 6006";
    base.scripts["build-storybook"] = "storybook build";
    base.devDependencies["@storybook/react"] = "^7.4.0";
    base.devDependencies["@storybook/react-vite"] = "^7.4.0";
    base.devDependencies.storybook = "^7.4.0";
  }
  
  return JSON.stringify(base, null, 2);
}

function generateIndexHtml(projectName) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`;
}

function generateAppComponent(projectName) {
  return `import React from 'react'

function App() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Welcome to ${projectName}</h1>
      <p>Your React project is ready for development!</p>
    </div>
  )
}

export default App`;
}

function generateMainJs() {
  return `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`;
}

function generateViteConfig() {
  return `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`;
}

function generateButtonComponent() {
  return `import React from 'react';

export const Button = ({ primary = false, size = 'medium', backgroundColor, label, ...props }) => {
  const mode = primary ? 'storybook-button--primary' : 'storybook-button--secondary';
  return (
    <button
      type="button"
      className={['storybook-button', \`storybook-button--\${size}\`, mode].join(' ')}
      style={{ backgroundColor }}
      {...props}
    >
      {label}
    </button>
  );
};`;
}

function generateButtonStory() {
  return `import { Button } from './Button';

export default {
  title: 'Example/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export const Primary = {
  args: {
    primary: true,
    label: 'Button',
  },
};

export const Secondary = {
  args: {
    label: 'Button',
  },
};`;
}

function generateStorybookMain() {
  return `export default {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-onboarding',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
};`;
}

// =============================================================================
// THUMBNAIL GENERATION - PURE FUNCTIONS
// =============================================================================

/**
 * Pure function to create thumbnail configuration
 * @param {Object} options - Thumbnail options
 * @returns {Object} Thumbnail configuration
 */
function createThumbnailConfig(options = {}) {
  return {
    width: options.width || 300,
    height: options.height || 200,
    quality: options.quality || 0.8,
    format: options.format || 'png',
    timeout: options.timeout || 10000, // 10 seconds
    waitForLoad: options.waitForLoad || 3000, // 3 seconds
    ...options
  };
}

/**
 * Pure function to create thumbnail file path
 * @param {Object} project - Project object
 * @param {Object} config - Thumbnail configuration
 * @returns {string} Thumbnail file path
 */
function createThumbnailPath(project, config) {
  // Ensure we have a valid project path
  const projectPath = project.path || path.join(store.get('projectsDirectory', os.homedir()), project.name);
  const thumbnailDir = path.join(projectPath, '.thumbnails');
  const timestamp = Date.now();
  const filename = `preview_${project.id}_${timestamp}.${config.format}`;
  const fullPath = path.join(thumbnailDir, filename);
  
  return fullPath;
}

/**
 * Pure function to check if thumbnail needs regeneration
 * @param {string} thumbnailPath - Path to existing thumbnail
 * @param {Object} project - Project object
 * @param {number} maxAge - Max age in milliseconds
 * @returns {Promise<boolean>} True if thumbnail needs regeneration
 */
async function shouldRegenerateThumbnail(thumbnailPath, project, maxAge = 3600000) { // 1 hour
  try {
    const [thumbStats, projectStats] = await Promise.all([
      fs.stat(thumbnailPath),
      fs.stat(path.join(project.path, 'package.json'))
    ]);
    
    const thumbAge = Date.now() - thumbStats.mtime.getTime();
    const isStale = thumbAge > maxAge;
    const isOutdated = projectStats.mtime > thumbStats.mtime;
    
    return isStale || isOutdated;
  } catch (error) {
    // Thumbnail doesn't exist or error occurred
    return true;
  }
}

/**
 * Pure function to create browser window options for thumbnail capture
 * @param {Object} config - Thumbnail configuration
 * @returns {Object} Browser window options
 */
function createThumbnailWindowConfig(config) {
  return {
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: false // Allow loading local content
    },
    paintWhenInitiallyHidden: true,
    enableLargerThanScreen: true
  };
}

/**
 * Pure function to process captured image for thumbnail
 * @param {Electron.NativeImage} image - Captured image
 * @param {Object} config - Thumbnail configuration
 * @returns {Electron.NativeImage} Processed thumbnail
 */
function processImageThumbnail(image, config) {
  const resized = image.resize({
    width: config.width,
    height: config.height,
    quality: 'good'
  });
  
  return resized;
}

/**
 * Impure function to capture project thumbnail
 * @param {Object} project - Project object
 * @param {string} serverUrl - Server URL to capture
 * @param {Object} config - Thumbnail configuration
 * @returns {Promise<string>} Path to generated thumbnail
 */
async function captureProjectThumbnail(project, serverUrl, config) {
  let thumbnailWindow = null;
  
  try {
    // Ensure thumbnail directory exists
    const thumbnailDir = path.dirname(createThumbnailPath(project, config));
    await fs.mkdir(thumbnailDir, { recursive: true });
    
    // Create hidden browser window for capture
    thumbnailWindow = new BrowserWindow(createThumbnailWindowConfig(config));
    
    // Load the project URL
    await thumbnailWindow.loadURL(serverUrl);
    
    // Wait for page to fully load
    await new Promise(resolve => setTimeout(resolve, config.waitForLoad));
    
    // Capture page screenshot
    const image = await thumbnailWindow.capturePage();
    
    // Process image into thumbnail
    const thumbnail = processImageThumbnail(image, config);
    
    // Save thumbnail to file
    const thumbnailPath = createThumbnailPath(project, config);
    const buffer = thumbnail.toPNG();
    await fs.writeFile(thumbnailPath, buffer);
    
    console.log(`📸 Generated thumbnail for ${project.name}: ${thumbnailPath}`);
    return thumbnailPath;
    
  } catch (error) {
    console.error(`❌ Thumbnail generation failed for ${project.name}:`, error.message);
    throw error;
  } finally {
    if (thumbnailWindow && !thumbnailWindow.isDestroyed()) {
      thumbnailWindow.close();
    }
  }
}

/**
 * Pure function to create fallback thumbnail path for templates
 * @param {string} templateId - Template identifier
 * @returns {string} Fallback thumbnail path
 */
function createFallbackThumbnailPath(templateId) {
  // For now, return a special identifier that the frontend can handle
  // The frontend will show a CSS-based fallback instead of trying to load a file
  return `fallback:${templateId}`;
}

/**
 * Impure function to generate or retrieve project thumbnail
 * @param {Object} project - Project object
 * @param {boolean} forceRegenerate - Force thumbnail regeneration
 * @returns {Promise<string>} Path to thumbnail image
 */
async function getProjectThumbnail(project, forceRegenerate = false) {
  const config = createThumbnailConfig();
  
  try {
    // Check if project server is running for fresh thumbnail generation
    const serverInfo = projectServers.get(project.id);
    if (!serverInfo || !serverInfo.url) {
      console.log(`⚠️ No server running for ${project.name}, using fallback thumbnail`);
      
      // Ensure template is a string
      const templateId = typeof project.template === 'string' ? project.template : 'react-basic';
      return createFallbackThumbnailPath(templateId);
    }
    
    // Always generate fresh thumbnail if server is running and regeneration is forced
    if (forceRegenerate) {
      console.log(`📸 Generating fresh thumbnail for ${project.name}`);
      return await captureProjectThumbnail(project, serverInfo.url, config);
    }
    
    // Check if existing thumbnail exists and is recent
    const thumbnailPath = createThumbnailPath(project, config);
    const needsRegeneration = await shouldRegenerateThumbnail(thumbnailPath, project);
    
    if (!needsRegeneration) {
      console.log(`📷 Using existing thumbnail for ${project.name}`);
      return thumbnailPath;
    }
    
    // Generate new thumbnail
    console.log(`📸 Generating new thumbnail for ${project.name}`);
    return await captureProjectThumbnail(project, serverInfo.url, config);
    
  } catch (error) {
    console.error(`❌ Thumbnail generation error for ${project.name}:`, error.message);
    
    // Return fallback thumbnail for template
    const templateId = typeof project.template === 'string' ? project.template : 'react-basic';
    return createFallbackThumbnailPath(templateId);
  }
}

/**
 * Pure function to create window configuration
 * @returns {Object} Window configuration options
 */
function createWindowConfig() {
  const isDev = process.argv.includes('--dev');
  
  return {
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: !isDev, // Disable web security in development to prevent IPC issues
      preload: path.join(__dirname, 'preload.js') // Enable secure IPC
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false // Don't show until ready
  };
}

/**
 * Pure function to create main window
 * @returns {BrowserWindow} Configured window instance
 */
function createMainWindow() {
  const config = createWindowConfig();
  const window = new BrowserWindow(config);

  // Load the HTML file
  window.loadFile('index.html');

  // Show window when ready to prevent visual flash
  window.once('ready-to-show', () => {
    window.show();
    
    // Open DevTools in development
    if (process.argv.includes('--dev')) {
      window.webContents.openDevTools();
    }
  });

  // Enable live reload in development with better file watching
  if (process.argv.includes('--dev')) {
    const fs = require('fs');
    const filesToWatch = ['index.html', 'app.js'];
    
    filesToWatch.forEach(file => {
      fs.watchFile(file, { interval: 1000 }, () => {
        console.log(`🔄 File changed: ${file}, reloading...`);
        window.reload();
      });
    });
  }

  // Handle window closed
  window.on('closed', () => {
    mainWindow = null;
  });

  return window;
}

/**
 * Handle app ready event
 */
function handleAppReady() {
  console.log('🚀 Electron app ready, creating main window...');
  mainWindow = createMainWindow();
}

/**
 * Handle app activate event (macOS)
 */
function handleAppActivate() {
  // On macOS, re-create window when app icon is clicked and no windows are open
  if (mainWindow === null) {
    console.log('🔄 App activated, creating new window...');
    mainWindow = createMainWindow();
  }
}

/**
 * Handle all windows closed event
 */
function handleAllWindowsClosed() {
  // On macOS, keep the app running even when all windows are closed
  if (process.platform !== 'darwin') {
    console.log('🛑 All windows closed, quitting app...');
    app.quit();
  }
}

/**
 * Handle app before quit event
 */
function handleBeforeQuit() {
  console.log('👋 Application shutting down...');
  
  // Clean up file watchers in development
  if (process.argv.includes('--dev') && mainWindow) {
    const fs = require('fs');
    const filesToWatch = ['index.html', 'app.js'];
    filesToWatch.forEach(file => {
      try {
        fs.unwatchFile(file);
      } catch (error) {
        // Ignore cleanup errors
      }
    });
  }
}

// Set up event listeners
app.whenReady().then(handleAppReady);
app.on('activate', handleAppActivate);
app.on('window-all-closed', handleAllWindowsClosed);
app.on('before-quit', handleBeforeQuit);

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (navigationEvent, navigationURL) => {
    navigationEvent.preventDefault();
    console.warn('Blocked new window creation:', navigationURL);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process in development, just log it
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.log('Uncaught Exception:', error);
  // Don't exit the process in development, just log it
});

// IPC Handlers for Project Operations

ipcMain.handle('project:create', async (event, projectConfig) => {
  let projectPath = null;
  
  try {
    console.log('🚀 Starting project creation:', projectConfig.name);
    
    // Create project creation plan
    const plan = createProjectPlan(projectConfig);
    const projectsDirectory = store.get('projectsDirectory');
    
    // Ensure projects directory exists
    await ensureDirectoryExists(projectsDirectory);
    
    projectPath = path.join(projectsDirectory, projectConfig.name);
    
    // Check if project directory already exists
    try {
      await fs.access(projectPath);
      return { success: false, error: `Project directory '${projectConfig.name}' already exists` };
    } catch (error) {
      // Good - directory doesn't exist, we can proceed
    }
    
    // Send initial progress update
    mainWindow.webContents.send('project:progress', {
      projectId: projectConfig.id,
      plan: plan
    });
    
    // Execute creation steps
    const result = await executeProjectCreation(projectConfig, projectPath, plan);
    
    if (result.success) {
      // Create project data with default workflow using pure functions
      const baseProjectData = {
        id: projectConfig.id,
        name: projectConfig.name,
        templateId: projectConfig.templateId,
        template: projectConfig.template,
        path: projectPath,
        status: 'ACTIVE'
      };
      
      const workflowResult = createProjectWithDefaultWorkflow(baseProjectData);
      if (!workflowResult.success) {
        console.warn('Failed to create default workflow:', workflowResult.error);
      }
      
      const projectDataWithWorkflow = workflowResult.success ? workflowResult.project : baseProjectData;
      
      // Add to store with timestamps
      const projects = store.get('projects', []);
      projects.push({
        ...projectDataWithWorkflow,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      });
      store.set('projects', projects);
      
      console.log('✅ Project created and registered:', projectConfig.name);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Project creation failed:', error);
    
    // Cleanup: Remove partially created directory if it exists
    if (projectPath) {
      try {
        await fs.access(projectPath);
        await fs.rmdir(projectPath, { recursive: true });
        console.log('🧹 Cleaned up failed project directory:', projectPath);
      } catch (cleanupError) {
        console.warn('Failed to cleanup project directory:', cleanupError.message);
      }
    }
    
    // Send error progress update
    mainWindow.webContents.send('project:progress', {
      projectId: projectConfig.id,
      error: error.message,
      failed: true
    });
    
    return { success: false, error: error.message };
  }
});

ipcMain.handle('project:open', async (event, projectId) => {
  try {
    console.log('📂 Opening project:', projectId);
    
    // Launch Storybook server
    const result = await launchStorybookForProject(projectId);
    
    return result;
  } catch (error) {
    console.error('Failed to open project:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('project:get-storybook-url', async (event, projectId) => {
  try {
    const process = activeProcesses.get(projectId);
    if (process && process.port) {
      return { success: true, url: `http://localhost:${process.port}` };
    }
    return { success: false, error: 'Storybook server not running' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Settings IPC Handlers

ipcMain.handle('settings:get', async (event) => {
  try {
    return {
      success: true,
      settings: {
        projectsDirectory: store.get('projectsDirectory'),
        defaultTemplate: store.get('defaultTemplate'),
        devPortStart: store.get('devPortStart'),
        devPortEnd: store.get('devPortEnd'),
        autoOpenBrowser: store.get('autoOpenBrowser'),
        enableDevTools: store.get('enableDevTools'),
        maxRecentProjects: store.get('maxRecentProjects')
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('settings:save', async (event, settings) => {
  try {
    // Validate and save each setting
    if (settings.projectsDirectory) store.set('projectsDirectory', settings.projectsDirectory);
    if (settings.defaultTemplate) store.set('defaultTemplate', settings.defaultTemplate);
    if (settings.devPortStart) store.set('devPortStart', settings.devPortStart);
    if (settings.devPortEnd) store.set('devPortEnd', settings.devPortEnd);
    if (settings.autoOpenBrowser !== undefined) store.set('autoOpenBrowser', settings.autoOpenBrowser);
    if (settings.enableDevTools !== undefined) store.set('enableDevTools', settings.enableDevTools);
    if (settings.maxRecentProjects) store.set('maxRecentProjects', settings.maxRecentProjects);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('settings:choose-directory', async (event) => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Choose Projects Directory'
    });
    
    if (result.canceled || !result.filePaths.length) {
      return { success: false, canceled: true };
    }
    
    return { success: true, directory: result.filePaths[0] };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('settings:reset', async (event) => {
  try {
    // Reset to default values
    store.set('projectsDirectory', path.join(os.homedir(), 'DesignToolProjects'));
    store.set('defaultTemplate', 'react-storybook');
    store.set('devPortStart', 3000);
    store.set('devPortEnd', 3999);
    store.set('autoOpenBrowser', false);
    store.set('enableDevTools', true);
    store.set('maxRecentProjects', 20);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Project Registry IPC Handlers

ipcMain.handle('projects:list', async (event) => {
  try {
    const projects = store.get('projects', []);
    
    // Validate projects still exist on file system
    const validProjects = [];
    for (const project of projects) {
      try {
        await fs.access(project.path);
        validProjects.push(project);
      } catch (error) {
        console.warn('Project path no longer exists:', project.path);
        // Remove orphaned project from registry
      }
    }
    
    // Update registry with only valid projects
    if (validProjects.length !== projects.length) {
      store.set('projects', validProjects);
    }
    
    return { success: true, projects: validProjects };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('projects:add', async (event, projectData) => {
  try {
    const projects = store.get('projects', []);
    
    // Check for duplicate IDs
    if (projects.some(p => p.id === projectData.id)) {
      return { success: false, error: 'Project with this ID already exists' };
    }
    
    // Add project to registry
    const newProject = {
      ...projectData,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    
    projects.push(newProject);
    store.set('projects', projects);
    
    return { success: true, project: newProject };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('projects:update', async (event, projectId, updates) => {
  try {
    const projects = store.get('projects', []);
    const projectIndex = projects.findIndex(p => p.id === projectId);
    
    if (projectIndex === -1) {
      return { success: false, error: 'Project not found' };
    }
    
    // Update project
    projects[projectIndex] = {
      ...projects[projectIndex],
      ...updates,
      lastModified: new Date().toISOString()
    };
    
    store.set('projects', projects);
    
    return { success: true, project: projects[projectIndex] };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('projects:remove', async (event, projectId) => {
  try {
    const projects = store.get('projects', []);
    const filteredProjects = projects.filter(p => p.id !== projectId);
    
    if (filteredProjects.length === projects.length) {
      return { success: false, error: 'Project not found' };
    }
    
    // Stop any running dev server for this project
    await stopProjectServer(projectId);
    
    store.set('projects', filteredProjects);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

/**
 * Update project environment file with context variables (IPC HANDLER)
 */
ipcMain.handle('project:update-env', async (event, { projectPath, envVars }) => {
  try {
    const envFilePath = path.join(projectPath, '.claude-env');
    
    // Generate environment file content with header comment
    const header = `# Claude Code Environment Variables
# This file is automatically updated by Design Tool
# It provides context variables for Claude Code terminal sessions
# Source this file in your shell: source .claude-env
#
`;
    
    const envContent = header + Object.entries(envVars)
      .map(([key, value]) => `${key}="${value}"`)
      .join('\n') + '\n';
    
    // Write environment file
    await fs.writeFile(envFilePath, envContent, 'utf8');
    
    console.log(`📝 Updated environment file: ${envFilePath}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to update environment file:', error);
    return { success: false, error: error.message };
  }
});

// Thumbnail Generation IPC Handlers

ipcMain.handle('project:generate-thumbnail', async (event, projectId, forceRegenerate = false) => {
  try {
    console.log('📸 Generating thumbnail for project:', projectId);
    
    const projects = store.get('projects', []);
    const project = projects.find(p => p.id === projectId);
    
    if (!project) {
      return { success: false, error: 'Project not found' };
    }
    
    const thumbnailPath = await getProjectThumbnail(project, forceRegenerate);
    
    // Ensure thumbnailPath is a string
    if (typeof thumbnailPath !== 'string') {
      throw new Error(`Expected string path, got ${typeof thumbnailPath}: ${thumbnailPath}`);
    }
    
    return { 
      success: true, 
      thumbnailPath,
      project: project.name 
    };
  } catch (error) {
    console.error('❌ Thumbnail generation failed:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('project:get-thumbnail', async (event, projectId) => {
  try {
    const projects = store.get('projects', []);
    const project = projects.find(p => p.id === projectId);
    
    if (!project) {
      return { success: false, error: 'Project not found' };
    }
    
    const config = createThumbnailConfig();
    const thumbnailPath = createThumbnailPath(project, config);
    
    // Check if thumbnail exists
    try {
      await fs.access(thumbnailPath);
      return { success: true, thumbnailPath };
    } catch {
      // Return fallback thumbnail
      const templateId = typeof project.template === 'string' ? project.template : 'react-basic';
      const fallbackPath = createFallbackThumbnailPath(templateId);
      return { success: true, thumbnailPath: fallbackPath, isFallback: true };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// React Dev Server Management IPC Handlers

ipcMain.handle('project:start-server', async (event, projectId) => {
  try {
    console.log('🚀 Starting React dev server for project:', projectId);
    
    const projects = store.get('projects', []);
    const project = projects.find(p => p.id === projectId);
    
    if (!project) {
      return { success: false, error: 'Project not found' };
    }
    
    // Check if server is already running
    if (projectServers.has(projectId)) {
      const serverInfo = projectServers.get(projectId);
      if (serverInfo.status === 'running') {
        return { success: true, port: serverInfo.port, url: `http://localhost:${serverInfo.port}` };
      }
    }
    
    const result = await startProjectServer(project);
    return result;
  } catch (error) {
    console.error('Failed to start project server:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('project:stop-server', async (event, projectId) => {
  try {
    console.log('🛑 Stopping React dev server for project:', projectId);
    const result = await stopProjectServer(projectId);
    return result;
  } catch (error) {
    console.error('Failed to stop project server:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('project:get-server-status', async (event, projectId) => {
  try {
    if (projectServers.has(projectId)) {
      const serverInfo = projectServers.get(projectId);
      return { 
        success: true, 
        status: serverInfo.status,
        port: serverInfo.port,
        url: serverInfo.status === 'running' ? `http://localhost:${serverInfo.port}` : null
      };
    }
    
    return { success: true, status: 'stopped' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Project Execution Functions

async function executeProjectCreation(projectConfig, projectPath, plan) {
  try {
    // Step 1: Planning
    await updateProjectStep(plan, 0, 'IN_PROGRESS', 20);
    await sleep(1000); // Simulate planning time
    await updateProjectStep(plan, 0, 'COMPLETED', 100);
    
    // Step 2: Scaffolding
    await updateProjectStep(plan, 1, 'IN_PROGRESS', 0);
    await createProjectStructure(projectConfig, projectPath);
    await updateProjectStep(plan, 1, 'COMPLETED', 100);
    
    // Step 3: Installing dependencies (handled by create-react-app)
    await updateProjectStep(plan, 2, 'IN_PROGRESS', 50);
    console.log('📦 Dependencies already installed by create-react-app');
    await updateProjectStep(plan, 2, 'COMPLETED', 100);
    
    // Step 4: Configuring
    await updateProjectStep(plan, 3, 'IN_PROGRESS', 50);
    await sleep(1000); // Simulate configuration
    await updateProjectStep(plan, 3, 'COMPLETED', 100);
    
    // Step 5: Ready
    await updateProjectStep(plan, 4, 'COMPLETED', 100);
    
    // Update overall progress
    plan.overallProgress = 100;
    plan.currentStep = 4;
    
    mainWindow.webContents.send('project:progress', {
      projectId: projectConfig.id,
      plan: plan,
      completed: true
    });
    
    return { 
      success: true, 
      projectPath: projectPath,
      message: 'Project created successfully!'
    };
    
  } catch (error) {
    console.error('Project creation failed:', error);
    
    // Update current step with error status
    if (plan.currentStep < plan.steps.length) {
      plan.steps[plan.currentStep].status = 'ERROR';
      mainWindow.webContents.send('project:progress', {
        projectId: projectConfig.id,
        plan: plan,
        error: error.message
      });
    }
    
    throw error;
  }
}

async function createProjectStructure(projectConfig, projectPath) {
  // Validate path
  const pathValidation = validateProjectPath(projectPath);
  if (!pathValidation.success) {
    throw new Error(pathValidation.error);
  }
  
  console.log('📦 Using create-react-app for project scaffolding...');
  
  // Use create-react-app to generate the project
  return new Promise((resolve, reject) => {
    // Run create-react-app with project name
    const createProcess = spawn('npx', ['create-react-app', projectConfig.name, '--template', getCreateReactAppTemplate(projectConfig.templateId)], {
      cwd: path.dirname(projectPath),
      stdio: 'pipe'
    });
    
    let output = '';
    let errorOutput = '';
    
    createProcess.stdout.on('data', (data) => {
      output += data.toString();
      console.log('create-react-app:', data.toString().trim());
    });
    
    createProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.warn('create-react-app warning:', data.toString().trim());
    });
    
    createProcess.on('close', async (code) => {
      if (code === 0) {
        console.log('✅ create-react-app completed successfully');
        
        // Add our custom components with variant system
        try {
          await addCustomComponents(projectPath, projectConfig.templateId);
          resolve({ success: true, output });
        } catch (error) {
          reject(new Error(`Failed to add custom components: ${error.message}`));
        }
      } else {
        reject(new Error(`create-react-app failed with code ${code}: ${errorOutput}`));
      }
    });
    
    createProcess.on('error', (error) => {
      reject(new Error(`Failed to start create-react-app: ${error.message}`));
    });
  });
}

async function installProjectDependencies(projectPath) {
  return new Promise((resolve, reject) => {
    const npmProcess = spawn('npm', ['install'], {
      cwd: projectPath,
      stdio: 'pipe'
    });
    
    let output = '';
    
    npmProcess.stdout.on('data', (data) => {
      output += data.toString();
      console.log('npm install:', data.toString());
    });
    
    npmProcess.stderr.on('data', (data) => {
      output += data.toString();
      console.error('npm install error:', data.toString());
    });
    
    npmProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ npm install completed successfully');
        resolve(output);
      } else {
        reject(new Error(`npm install failed with code ${code}`));
      }
    });
    
    npmProcess.on('error', (error) => {
      reject(new Error(`Failed to start npm install: ${error.message}`));
    });
  });
}

async function launchStorybookForProject(projectId) {
  // For now, simulate launching Storybook
  const port = allocateUniquePort(usedPorts);
  usedPorts.add(port);
  
  // Store process info
  activeProcesses.set(projectId, {
    port: port,
    status: 'RUNNING',
    startTime: new Date()
  });
  
  return {
    success: true,
    port: port,
    url: `http://localhost:${port}`
  };
}

async function updateProjectStep(plan, stepIndex, status, progress) {
  if (stepIndex < plan.steps.length) {
    plan.steps[stepIndex].status = status;
    plan.steps[stepIndex].progress = progress;
    plan.currentStep = stepIndex;
    
    // Calculate overall progress
    const completedSteps = plan.steps.filter(step => step.status === 'COMPLETED').length;
    const currentStepProgress = plan.steps[stepIndex].progress / 100;
    plan.overallProgress = Math.round(((completedSteps + currentStepProgress) / plan.steps.length) * 100);
    
    // Send progress update
    mainWindow.webContents.send('project:progress', {
      projectId: plan.projectId,
      plan: plan
    });
  }
}

/**
 * Map our template IDs to create-react-app templates (PURE FUNCTION)
 * @param {string} templateId - Our internal template ID
 * @returns {string} create-react-app template name
 */
function getCreateReactAppTemplate(templateId) {
  const templateMap = {
    'react-basic': 'cra-template',
    'react-typescript': 'cra-template-typescript',
    'react-storybook': 'cra-template', // Use basic template, we'll add custom components
    'react-storybook-tailwind': 'cra-template'
  };
  
  return templateMap[templateId] || 'cra-template';
}

/**
 * Add our custom components with variant system to generated project (PURE FUNCTIONS)
 * @param {string} projectPath - Path to the generated project
 * @param {string} templateId - Template ID to determine which components to add
 */
async function addCustomComponents(projectPath, templateId) {
  console.log('🧩 Adding custom components with variant system...');
  
  // Create components directory
  const componentsPath = path.join(projectPath, 'src', 'components');
  await fs.mkdir(componentsPath, { recursive: true });
  
  // Add Button component with custom variant system
  const buttonComponent = generateCustomButtonComponent();
  await fs.writeFile(path.join(componentsPath, 'Button.jsx'), buttonComponent);
  
  // Add more components based on template
  if (templateId.includes('storybook') || templateId === 'react-basic') {
    const cardComponent = generateCustomCardComponent();
    await fs.writeFile(path.join(componentsPath, 'Card.jsx'), cardComponent);
  }
  
  console.log('✅ Custom components added successfully');
}

/**
 * Generate Button component with custom variant system (PURE FUNCTION)
 * @returns {string} Button component code with variants
 */
function generateCustomButtonComponent() {
  return `import React from 'react';
import './Button.css';

export const Button = ({ 
  variant = 'primary', 
  size = 'medium', 
  children, 
  disabled = false,
  onClick,
  ...props 
}) => {
  const baseClasses = 'btn';
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    outline: 'btn-outline'
  };
  
  const sizeClasses = {
    small: 'btn-small',
    medium: 'btn-medium',
    large: 'btn-large'
  };
  
  const className = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    disabled ? 'btn-disabled' : ''
  ].filter(Boolean).join(' ');
  
  return (
    <button 
      className={className}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children || 'Button'}
    </button>
  );
};

// Custom variant system - define variants directly in component file
Button.variants = [
  { name: 'Primary', props: { variant: 'primary', children: 'Primary Button' } },
  { name: 'Secondary', props: { variant: 'secondary', children: 'Secondary Button' } },
  { name: 'Danger', props: { variant: 'danger', children: 'Delete' } },
  { name: 'Outline', props: { variant: 'outline', children: 'Outline' } },
  { name: 'Small', props: { size: 'small', children: 'Small' } },
  { name: 'Large', props: { size: 'large', children: 'Large Button' } },
  { name: 'Disabled', props: { disabled: true, children: 'Disabled' } }
];

export default Button;`;
}

/**
 * Generate Card component with custom variant system (PURE FUNCTION)
 * @returns {string} Card component code with variants
 */
function generateCustomCardComponent() {
  return `import React from 'react';
import './Card.css';

export const Card = ({ 
  variant = 'default', 
  children, 
  title,
  footer,
  ...props 
}) => {
  const baseClasses = 'card';
  const variantClasses = {
    default: 'card-default',
    elevated: 'card-elevated',
    outlined: 'card-outlined'
  };
  
  const className = [baseClasses, variantClasses[variant]].join(' ');
  
  return (
    <div className={className} {...props}>
      {title && <div className="card-header"><h3>{title}</h3></div>}
      <div className="card-content">
        {children}
      </div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
};

// Custom variant system
Card.variants = [
  { name: 'Default', props: { title: 'Default Card', children: 'This is a default card.' } },
  { name: 'Elevated', props: { variant: 'elevated', title: 'Elevated Card', children: 'This card has a shadow.' } },
  { name: 'Outlined', props: { variant: 'outlined', title: 'Outlined Card', children: 'This card has a border.' } },
  { name: 'With Footer', props: { title: 'Card with Footer', children: 'Card content here.', footer: 'Footer content' } }
];

export default Card;`;
}

/**
 * Start React dev server for project (ASYNC FUNCTION WITH RESULT TYPE)
 * @param {Object} project - Project object with path
 * @returns {Promise<Object>} Result object with server info
 */
async function startProjectServer(project) {
  try {
    // Check if project already had a server with a specific port
    let preferredPort = null;
    if (projectServers.has(project.id)) {
      preferredPort = projectServers.get(project.id).port;
    }
    
    // Find available port (now async), preferring the old port if available
    const port = await findAvailablePort(preferredPort);
    usedPorts.add(port);
    
    console.log(`📡 Starting React dev server on port ${port} for project: ${project.name}`);
    
    // Set environment variables for React dev server
    const env = {
      ...process.env,
      PORT: port.toString(),
      BROWSER: 'none', // Don't auto-open browser
      CI: 'false' // Disable CI mode
    };
    
    // Start npm start process
    const serverProcess = spawn('npm', ['start'], {
      cwd: project.path,
      stdio: 'pipe',
      env: env
    });
    
    // Store server info
    const serverInfo = {
      process: serverProcess,
      port: port,
      status: 'starting',
      startTime: new Date(),
      projectId: project.id,
      projectName: project.name
    };
    
    projectServers.set(project.id, serverInfo);
    
    // Set up process event handlers
    let serverReady = false;
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (!serverReady) {
          serverInfo.status = 'failed';
          reject(new Error('React dev server failed to start within 30 seconds'));
        }
      }, 30000);
      
      serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`[${project.name}] React dev server:`, output.trim());
        
        // Check if server is ready
        if (output.includes('webpack compiled') || output.includes('compiled successfully') || output.includes(`localhost:${port}`)) {
          if (!serverReady) {
            serverReady = true;
            serverInfo.status = 'running';
            clearTimeout(timeout);
            console.log(`✅ React dev server ready at http://localhost:${port}`);
            resolve({ 
              success: true, 
              port: port, 
              url: `http://localhost:${port}`,
              status: 'running'
            });
          }
        }
      });
      
      serverProcess.stderr.on('data', (data) => {
        const error = data.toString();
        console.warn(`[${project.name}] React dev server warning:`, error.trim());
      });
      
      serverProcess.on('close', (code) => {
        console.log(`🛑 React dev server for ${project.name} exited with code ${code}`);
        
        // Only clean up if we're not already handling a stop request
        // (stopProjectServer handles cleanup with proper waiting)
        if (projectServers.has(project.id) && projectServers.get(project.id).status !== 'stopping') {
          usedPorts.delete(port);
          projectServers.delete(project.id);
        }
        
        if (!serverReady && code !== 0) {
          clearTimeout(timeout);
          serverInfo.status = 'failed';
          reject(new Error(`React dev server failed to start (exit code ${code})`));
        }
      });
      
      serverProcess.on('error', (error) => {
        console.error(`❌ Failed to start React dev server for ${project.name}:`, error);
        clearTimeout(timeout);
        usedPorts.delete(port);
        projectServers.delete(project.id);
        serverInfo.status = 'failed';
        reject(error);
      });
    });
    
  } catch (error) {
    console.error('Error starting project server:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Stop React dev server for project (ASYNC FUNCTION WITH RESULT TYPE)
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} Result object
 */
async function stopProjectServer(projectId) {
  try {
    if (!projectServers.has(projectId)) {
      return { success: true, message: 'Server was not running' };
    }
    
    const serverInfo = projectServers.get(projectId);
    
    return new Promise((resolve) => {
      // If process is already killed or doesn't exist, just clean up
      if (!serverInfo.process || serverInfo.process.killed) {
        if (serverInfo.port) {
          usedPorts.delete(serverInfo.port);
        }
        projectServers.delete(projectId);
        console.log(`✅ Stopped React dev server for project ${projectId} (already terminated)`);
        return resolve({ success: true });
      }
      
      // Mark as stopping to coordinate with close handler
      serverInfo.status = 'stopping';
      
      // Wait for process to actually close before cleanup
      serverInfo.process.on('close', () => {
        console.log(`🧹 Process closed, cleaning up port ${serverInfo.port} for project ${projectId}`);
        
        // Give webpack-dev-server a moment to fully release the port
        setTimeout(() => {
          if (serverInfo.port) {
            usedPorts.delete(serverInfo.port);
          }
          projectServers.delete(projectId);
          console.log(`✅ Stopped React dev server for project ${projectId}`);
          resolve({ success: true });
        }, 1000); // 1 second delay to ensure port is fully released
      });
      
      // Kill the process
      serverInfo.process.kill('SIGTERM');
      
      // Force kill after 5 seconds if still running
      setTimeout(() => {
        if (!serverInfo.process.killed) {
          console.log(`🔥 Force killing React dev server for project ${projectId}`);
          serverInfo.process.kill('SIGKILL');
        }
      }, 5000);
      
      // Fallback timeout in case process doesn't emit close event
      setTimeout(() => {
        if (projectServers.has(projectId)) {
          console.log(`⚠️ Timeout waiting for process close, force cleaning up project ${projectId}`);
          if (serverInfo.port) {
            usedPorts.delete(serverInfo.port);
          }
          projectServers.delete(projectId);
          resolve({ success: true });
        }
      }, 10000);
    });
    
  } catch (error) {
    console.error('Error stopping project server:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Find available port for React dev server (ASYNC FUNCTION)
 * @param {number} preferredPort - Preferred port to try first
 * @returns {Promise<number>} Available port number
 */
async function findAvailablePort(preferredPort = null) {
  const net = require('net');
  
  function isPortAvailable(port) {
    return new Promise((resolve) => {
      const server = net.createServer();
      
      server.listen(port, () => {
        server.close(() => {
          resolve(true);
        });
      });
      
      server.on('error', () => {
        resolve(false);
      });
    });
  }
  
  // Try preferred port first if provided
  if (preferredPort && preferredPort >= 3000 && preferredPort <= 9999) {
    if (!usedPorts.has(preferredPort)) {
      const available = await isPortAvailable(preferredPort);
      if (available) {
        console.log(`♻️  Reusing port ${preferredPort} for project restart`);
        return preferredPort;
      }
    }
  }
  
  // Otherwise, find any available port starting from 3000
  let port = 3000;
  while (true) {
    // Check our internal tracking first (faster)
    if (!usedPorts.has(port)) {
      // Then check if port is actually available
      const available = await isPortAvailable(port);
      if (available) {
        return port;
      }
    }
    port++;
    
    // Safety check to prevent infinite loop
    if (port > 9999) {
      throw new Error('No available ports found in range 3000-9999');
    }
  }
}

// =====================================================
// PHASE 5 - COMPONENT DISCOVERY SYSTEM (PURE FUNCTIONS)
// =====================================================

const fsPromises = require('fs').promises;

/**
 * Check if file exists (ASYNC PURE FUNCTION)
 * @param {string} filePath - Path to check
 * @returns {Promise<boolean>} True if file exists
 */
async function fileExists(filePath) {
  try {
    await fsPromises.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get all JavaScript/TypeScript files in directory (ASYNC PURE FUNCTION)
 * @param {string} dirPath - Directory to scan
 * @returns {Promise<string[]>} Array of file paths
 */
async function getComponentFiles(dirPath) {
  try {
    if (!(await fileExists(dirPath))) {
      return [];
    }
    
    const files = await fsPromises.readdir(dirPath, { withFileTypes: true });
    const componentFiles = [];
    
    for (const file of files) {
      if (file.isFile() && /\.(jsx?|tsx?)$/.test(file.name)) {
        const filePath = path.join(dirPath, file.name);
        componentFiles.push(filePath);
      }
    }
    
    return componentFiles.sort(); // Consistent ordering
  } catch (error) {
    console.warn(`Failed to read directory ${dirPath}:`, error.message);
    return [];
  }
}

/**
 * Parse component file content for export and variants (PURE FUNCTION)
 * @param {string} fileContent - Raw file content
 * @param {string} filePath - File path for context
 * @returns {Object} Component info with variants
 */
function parseComponentContent(fileContent, filePath) {
  const fileName = path.basename(filePath, path.extname(filePath));
  
  // Find main export (could be named export or default export)
  const namedExportMatch = fileContent.match(/export\s+(?:const|function)\s+(\w+)/);
  const defaultExportMatch = fileContent.match(/export\s+default\s+(\w+)/);
  
  let componentName = fileName; // Fallback to file name
  if (namedExportMatch) {
    componentName = namedExportMatch[1];
  } else if (defaultExportMatch) {
    componentName = defaultExportMatch[1];
  }
  
  // Extract variants using regex to find ComponentName.variants = [...]
  const variantsPattern = new RegExp(`${componentName}\\.variants\\s*=\\s*(\\[[\\s\\S]*?\\]);`, 'g');
  const variantsMatch = variantsPattern.exec(fileContent);
  
  let variants = [];
  if (variantsMatch) {
    try {
      // Extract the array content and evaluate it safely
      const variantsArrayString = variantsMatch[1];
      // This is a simplified parser - in production, you'd want a proper AST parser
      variants = parseVariantsArray(variantsArrayString);
    } catch (error) {
      console.warn(`Failed to parse variants for ${componentName}:`, error.message);
    }
  }
  
  return {
    name: componentName,
    filePath,
    fileName,
    variants,
    hasVariants: variants.length > 0,
    lastModified: new Date().toISOString()
  };
}

/**
 * Parse variants array string into objects (PURE FUNCTION)
 * @param {string} variantsString - Variants array as string
 * @returns {Array} Parsed variants array
 */
function parseVariantsArray(variantsString) {
  // Simple regex-based parser for our variant structure
  // Matches: { name: 'Name', props: { ... } }
  const variantPattern = /\{\s*name:\s*['"`]([^'"`]+)['"`]\s*,\s*props:\s*(\{[^}]*\})\s*\}/g;
  const variants = [];
  let match;
  
  while ((match = variantPattern.exec(variantsString)) !== null) {
    const name = match[1];
    const propsString = match[2];
    
    try {
      // Parse the props object - this is simplified
      const props = parsePropsObject(propsString);
      variants.push({ name, props });
    } catch (error) {
      console.warn(`Failed to parse variant props: ${propsString}`, error.message);
    }
  }
  
  return variants;
}

/**
 * Parse props object string (SIMPLIFIED PARSER - PURE FUNCTION)
 * @param {string} propsString - Props object as string
 * @returns {Object} Parsed props object
 */
function parsePropsObject(propsString) {
  // This is a very simplified parser for our known prop patterns
  // In production, you'd want to use a proper JavaScript parser like @babel/parser
  
  const props = {};
  
  // Match key: 'value' patterns
  const stringPattern = /(\w+):\s*['"`]([^'"`]*)['"`]/g;
  let match;
  
  while ((match = stringPattern.exec(propsString)) !== null) {
    props[match[1]] = match[2];
  }
  
  // Match key: true/false patterns
  const booleanPattern = /(\w+):\s*(true|false)/g;
  while ((match = booleanPattern.exec(propsString)) !== null) {
    props[match[1]] = match[2] === 'true';
  }
  
  return props;
}

/**
 * Discover components in project (ASYNC COMPOSITION FUNCTION)
 * @param {string} projectPath - Project root path
 * @returns {Promise<Object>} Result with discovered components
 */
async function discoverProjectComponents(projectPath) {
  try {
    const componentsDir = path.join(projectPath, 'src', 'components');
    const componentFiles = await getComponentFiles(componentsDir);
    
    const components = [];
    
    for (const filePath of componentFiles) {
      try {
        const content = await fsPromises.readFile(filePath, 'utf8');
        const componentInfo = parseComponentContent(content, filePath);
        components.push(componentInfo);
      } catch (error) {
        console.warn(`Failed to read component file ${filePath}:`, error.message);
      }
    }
    
    return {
      success: true,
      components,
      totalComponents: components.length,
      totalVariants: components.reduce((sum, comp) => sum + comp.variants.length, 0),
      discoveredAt: new Date().toISOString()
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      components: []
    };
  }
}

// IPC Handler for component discovery
ipcMain.handle('project:discover-components', async (event, projectId) => {
  try {
    const projects = store.get('projects', []);
    const project = projects.find(p => p.id === projectId);
    
    if (!project) {
      return { success: false, error: 'Project not found' };
    }
    
    console.log(`🔍 Discovering components in project: ${project.name}`);
    const result = await discoverProjectComponents(project.path);
    
    if (result.success) {
      console.log(`✅ Discovered ${result.totalComponents} components with ${result.totalVariants} variants`);
    }
    
    return result;
  } catch (error) {
    console.error('Error discovering components:', error);
    return { success: false, error: error.message };
  }
});

// =====================================================
// TERMINAL PTY MANAGEMENT (CLAUDE CODE INTEGRATION)
// =====================================================

// Sumo Logic logging configuration
const SUMO_LOGIC_ENDPOINT = 'https://stag-events.sumologic.net/receiver/v1/http/ZaVnC4dhaV3euHRJTAw1lSCmzI2cOP59Z01zbW_8-Ow9ffu3_xKXWR6cLv24CG4Sk1LtqoE6XA7kDitwQATJYzOAEPZLt3XREiH0aqKelMMOTTdpm3Feqw==';

/**
 * Generate unique session ID (PURE FUNCTION)
 * @returns {string} Session ID
 */
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Create new terminal session with metrics tracking
 * @param {number} pid - Process ID
 * @param {Object} context - Session context
 * @returns {Object} Session object
 */
function createTerminalSession(pid, context) {
  const sessionId = generateSessionId();
  const session = {
    sessionId,
    pid,
    startTime: new Date().toISOString(),
    context: { ...context },
    metrics: {
      totalInputChars: 0,
      totalOutputChars: 0,
      totalInputEvents: 0,
      totalOutputEvents: 0,
      commandsExecuted: 0,
      errorsEncountered: 0,
      successEvents: 0,
      sessionDurationMs: 0,
      avgInputLength: 0,
      avgOutputLength: 0,
      contentTypes: new Map(), // Track frequency of different content types
      lastActivity: new Date().toISOString()
    }
  };
  
  terminalSessions.set(pid, session);
  return session;
}

/**
 * Update terminal session metrics
 * @param {number} pid - Process ID
 * @param {string} event - Event type
 * @param {string} cleanText - Clean text content
 * @param {string} contentType - Content type
 */
function updateSessionMetrics(pid, event, cleanText, contentType) {
  const session = terminalSessions.get(pid);
  if (!session) return;
  
  const now = new Date();
  session.metrics.lastActivity = now.toISOString();
  session.metrics.sessionDurationMs = now.getTime() - new Date(session.startTime).getTime();
  
  if (event === 'terminal_input') {
    session.metrics.totalInputChars += cleanText.length;
    session.metrics.totalInputEvents += 1;
    session.metrics.avgInputLength = Math.round(session.metrics.totalInputChars / session.metrics.totalInputEvents);
    
    // Count commands (lines ending with enter)
    if (cleanText.includes('\n') || cleanText === '\r') {
      session.metrics.commandsExecuted += 1;
    }
  } else if (event === 'terminal_output') {
    session.metrics.totalOutputChars += cleanText.length;
    session.metrics.totalOutputEvents += 1;
    session.metrics.avgOutputLength = Math.round(session.metrics.totalOutputChars / session.metrics.totalOutputEvents);
    
    // Count errors and successes
    if (contentType === 'error') {
      session.metrics.errorsEncountered += 1;
    } else if (contentType === 'success') {
      session.metrics.successEvents += 1;
    }
  }
  
  // Track content type frequency
  const currentCount = session.metrics.contentTypes.get(contentType) || 0;
  session.metrics.contentTypes.set(contentType, currentCount + 1);
}

/**
 * Enhanced input buffering with better command detection (OPTIMIZATION)
 * @param {number} pid - Process ID
 * @param {string} data - Input data
 * @param {Object} context - Context info
 */
async function bufferAndLogInput(pid, data, context) {
  // Initialize buffer if doesn't exist
  if (!inputBuffers.has(pid)) {
    inputBuffers.set(pid, { 
      text: '', 
      lastUpdate: Date.now(), 
      keyCount: 0,
      hasEnter: false 
    });
  }
  
  const buffer = inputBuffers.get(pid);
  
  // Track special keys for better analysis
  const isEnter = data === '\r' || data === '\n';
  const isBackspace = data === '\b' || data === '\x7f';
  const isTab = data === '\t';
  const isEscape = data === '\x1b';
  const isCtrlC = data === '\x03';
  const isArrowKey = data === '\x1b[A' || data === '\x1b[B' || data === '\x1b[C' || data === '\x1b[D';
  
  // Don't buffer control sequences that aren't printable
  if (isEscape || isArrowKey) {
    return; // Skip escape sequences and arrow keys
  }
  
  // Handle backspace by removing from buffer
  if (isBackspace && buffer.text.length > 0) {
    buffer.text = buffer.text.slice(0, -1);
    buffer.lastUpdate = Date.now();
    return;
  }
  
  // Add to buffer (only printable characters)
  if (!isBackspace) {
    buffer.text += data;
    buffer.keyCount++;
  }
  buffer.lastUpdate = Date.now();
  
  // Command completion triggers
  const isCompleteCommand = isEnter;
  const isSignificantInput = buffer.keyCount >= 3 && Date.now() - buffer.lastUpdate > 3000; // 3+ chars + 3sec pause
  const isSpecialCommand = isCtrlC || isTab; // Special commands to log immediately
  
  if (isCompleteCommand || isSignificantInput || isSpecialCommand) {
    const cleanText = stripAnsiCodes(buffer.text).trim();
    
    // Only log meaningful input (not just single characters or whitespace)
    if (cleanText.length > 1 || isSpecialCommand) {
      const contentAnalysis = analyzeTerminalContent(cleanText);
      
      // Determine command type for better categorization
      let commandType = 'text_input';
      if (isEnter) commandType = 'command_executed';
      else if (isCtrlC) commandType = 'command_interrupted';
      else if (isTab) commandType = 'tab_completion';
      else if (isSignificantInput) commandType = 'partial_input';
      
      // Log the command with enhanced metadata
      await logTerminalEvent('user_input', pid, cleanText || '[special_key]', {
        ...context,
        inputLength: cleanText.length,
        keyCount: buffer.keyCount,
        commandType: commandType,
        isComplete: isCompleteCommand,
        specialKey: isCtrlC ? 'ctrl_c' : isTab ? 'tab' : null
      });
      
      // Update metrics
      updateSessionMetrics(pid, 'terminal_input', cleanText || '[special]', contentAnalysis.type);
    }
    
    // Clear buffer
    buffer.text = '';
    buffer.keyCount = 0;
    buffer.hasEnter = false;
  }
  
  // Auto-clear buffer after 10 seconds of inactivity to prevent memory leaks
  setTimeout(() => {
    const currentBuffer = inputBuffers.get(pid);
    if (currentBuffer && Date.now() - currentBuffer.lastUpdate > 10000) {
      currentBuffer.text = '';
      currentBuffer.keyCount = 0;
    }
  }, 10000);
}

/**
 * Check if data is Claude Code UI update that should not be buffered
 * @param {string} data - Raw terminal data
 * @returns {boolean} True if this is a UI update
 */
function isClaudeCodeUIUpdate(data) {
  // Claude Code UI patterns that need immediate pass-through
  return data.includes('╭') || // Box drawing characters
         data.includes('╰') || 
         data.includes('│') ||
         data.includes('✻') || // Special symbols
         data.includes('※') ||
         data.includes('✗') ||
         /\x1b\[\d*;\d*H/.test(data) || // Cursor positioning
         /\x1b\[2J/.test(data) || // Clear screen
         /\x1b\[\d*A/.test(data) || // Cursor up
         /\x1b\[\d*B/.test(data) || // Cursor down
         /\x1b\[K/.test(data) || // Clear to end of line
         data.includes('Welcome to Claude Code') ||
         data.includes('Try "create a util') ||
         data.includes('for shortcuts');
}

/**
 * Buffer output until meaningful chunk, but allow UI updates through (OPTIMIZATION)
 * @param {number} pid - Process ID  
 * @param {string} data - Output data
 * @param {Object} context - Context info
 */
async function bufferAndLogOutput(pid, data, context) {
  // If this is a Claude Code UI update, don't buffer it - just pass through for display
  if (isClaudeCodeUIUpdate(data)) {
    // Don't log UI updates as they're just noise, but let them render
    return;
  }
  
  // Initialize buffer if doesn't exist
  if (!outputBuffers.has(pid)) {
    outputBuffers.set(pid, { text: '', lastUpdate: Date.now(), timer: null });
  }
  
  const buffer = outputBuffers.get(pid);
  buffer.text += data;
  buffer.lastUpdate = Date.now();
  
  // Clear existing timer
  if (buffer.timer) {
    clearTimeout(buffer.timer);
  }
  
  // Set timer to flush buffer after 2 seconds of silence (longer for better batching)
  buffer.timer = setTimeout(async () => {
    const cleanText = stripAnsiCodes(buffer.text).trim();
    
    // Only log meaningful output (not just control chars or whitespace)
    if (cleanText && cleanText.length > 5) { // Increased threshold
      const contentAnalysis = analyzeTerminalContent(cleanText);
      
      // Skip logging if it's just UI fragments that got through
      if (!cleanText.includes('Try "create') && 
          !cleanText.includes('Welcome to') &&
          !cleanText.includes('for shortcuts')) {
        
        // Log the batched output
        await logTerminalEvent('terminal_output', pid, cleanText, {
          ...context,
          outputLength: cleanText.length,
          batchedChunks: buffer.text.split('\n').length
        });
        
        // Update metrics
        updateSessionMetrics(pid, 'terminal_output', cleanText, contentAnalysis.type);
      }
    }
    
    // Clear buffer
    buffer.text = '';
  }, 2000); // 2 second debounce for better batching
  
  // If buffer gets too large, flush immediately to prevent memory issues
  if (buffer.text.length > 3000) { // Smaller threshold to be safer
    clearTimeout(buffer.timer);
    buffer.timer = null;
    
    const cleanText = stripAnsiCodes(buffer.text).trim();
    if (cleanText && cleanText.length > 5) {
      const contentAnalysis = analyzeTerminalContent(cleanText);
      await logTerminalEvent('terminal_output', pid, cleanText.substring(0, 500) + '...', {
        ...context,
        outputLength: cleanText.length,
        truncated: true
      });
      updateSessionMetrics(pid, 'terminal_output', cleanText, contentAnalysis.type);
    }
    buffer.text = '';
  }
}

/**
 * Strip ANSI escape codes and control characters from terminal output (PURE FUNCTION)
 * @param {string} text - Text with ANSI codes and control chars
 * @returns {string} Clean human-readable text
 */
function stripAnsiCodes(text) {
  if (!text) return text;
  
  // Remove ANSI escape sequences and control characters
  return text
    .replace(/\x1b\[[0-9;]*m/g, '') // Color codes
    .replace(/\x1b\[[0-9;]*[A-Za-z]/g, '') // Cursor movement and other codes
    .replace(/\x1b\[\?[0-9;]*[hl]/g, '') // Mode setting codes
    .replace(/\x1b\[[@-Z\\-~]/g, '') // Single character CSI sequences
    .replace(/\x1b[()][0-2]/g, '') // Character set selection
    .replace(/\x1b[[\]()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-Za-z]/g, '') // General ANSI cleanup
    .replace(/\x1b./g, '') // Any remaining escape sequences
    // Remove control characters (but keep printable ones)
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars except \t \n \r
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\r/g, '\n') // Convert remaining \r to \n
    .replace(/\n+/g, '\n') // Collapse multiple newlines
    .trim(); // Remove leading/trailing whitespace
}

/**
 * Extract meaningful content from terminal output (PURE FUNCTION)
 * @param {string} cleanText - ANSI-stripped text
 * @returns {Object} Analysis of the content
 */
function analyzeTerminalContent(cleanText) {
  if (!cleanText) return { type: 'empty', content: '' };
  
  const trimmed = cleanText.trim();
  
  // Command prompts
  if (/^[^@]*@[^:]*:[^$#>]*[$#>]\s*$/.test(trimmed)) {
    return { type: 'prompt', content: trimmed };
  }
  
  // File paths or directories  
  if (/^\/[^\s]*/.test(trimmed) || /^\~\/[^\s]*/.test(trimmed)) {
    return { type: 'path', content: trimmed };
  }
  
  // Error messages
  if (/error|Error|ERROR|failed|Failed|FAILED/i.test(trimmed)) {
    return { type: 'error', content: trimmed };
  }
  
  // Success messages
  if (/success|Success|SUCCESS|completed|Completed|done|Done/i.test(trimmed)) {
    return { type: 'success', content: trimmed };
  }
  
  // Code or structured content (has brackets, semicolons, etc.)
  if (/[{}();,]/.test(trimmed)) {
    return { type: 'code', content: trimmed };
  }
  
  // Command output (starts with typical CLI patterns)
  if (/^(npm|yarn|git|cd|ls|mkdir|cp|mv|rm|cat|grep|find)[\s:]/.test(trimmed)) {
    return { type: 'command_output', content: trimmed };
  }
  
  return { type: 'text', content: trimmed };
}

/**
 * Log terminal event to Sumo Logic (PURE FUNCTION)
 * @param {string} event - Event type (input/output/start/exit)
 * @param {string} pid - Process ID
 * @param {string} data - Terminal data
 * @param {Object} context - Additional context (projectId, projectName, etc.)
 */
async function logTerminalEvent(event, pid, data, context = {}) {
  try {
    // Clean the data for analysis
    const cleanedData = stripAnsiCodes(data);
    const contentAnalysis = analyzeTerminalContent(cleanedData);
    
    // Skip logging if content is empty, just control characters, or noise
    if (!cleanedData || 
        cleanedData.length === 0 || 
        contentAnalysis.type === 'empty' ||
        /^[\s\n\r\t]*$/.test(cleanedData)) {
      return; // Don't log noise
    }
    
    // Get existing session for metrics tracking
    let session = terminalSessions.get(pid);
    if (!session) {
      console.warn(`⚠️ No session found for PID ${pid} - session should have been created at terminal start`);
      // Don't create a new session here - use the PID as fallback
    }
    
    // Update session metrics
    if (session) {
      updateSessionMetrics(pid, event, cleanedData, contentAnalysis.type);
    }
    
    // Convert Map to Object for JSON serialization
    const contentTypeFreqs = session ? Object.fromEntries(session.metrics.contentTypes.entries()) : {};
    
    // Create minimal, readable log entry with session ID and metrics
    const logEntry = {
      time: new Date().toISOString(),
      sessionId: session ? session.sessionId : `unknown_${pid}`,
      event: event,
      pid: pid,
      text: cleanedData, // Clean, readable text
      type: contentAnalysis.type, // Content category
      project: context.projectName || 'unknown',
      view: context.currentView || 'unknown',
      dir: context.workingDirectory ? context.workingDirectory.split('/').pop() : null,
      // Session metrics for analysis
      metrics: session ? {
        sessionDuration: Math.round(session.metrics.sessionDurationMs / 1000), // seconds
        totalChars: session.metrics.totalInputChars + session.metrics.totalOutputChars,
        commands: session.metrics.commandsExecuted,
        errors: session.metrics.errorsEncountered,
        successes: session.metrics.successEvents,
        avgInput: session.metrics.avgInputLength,
        avgOutput: session.metrics.avgOutputLength,
        contentTypes: contentTypeFreqs,
        efficiency: session.metrics.errorsEncountered > 0 ? 
          Math.round((session.metrics.successEvents / (session.metrics.errorsEncountered + session.metrics.successEvents)) * 100) : 100
      } : null
    };

    // Send to Sumo Logic endpoint (non-blocking) using Node.js https
    const postData = JSON.stringify(logEntry);
    const url = new URL(SUMO_LOGIC_ENDPOINT);
    
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      // Don't need to process the response, just log status
      if (res.statusCode >= 400) {
        console.warn(`📊 Sumo Logic response error: ${res.statusCode}`);
      }
      
      // Consume response data to avoid memory leaks
      res.on('data', () => {}); 
      res.on('end', () => {});
    });
    
    req.on('error', (error) => {
      // Don't let logging failures affect terminal functionality
      console.warn('📊 Failed to log terminal event to Sumo Logic:', error.message);
    });
    
    req.write(postData);
    req.end();

  } catch (error) {
    console.warn('📊 Terminal event logging error:', error.message);
  }
}

/**
 * Start a new PTY terminal process (ASYNC FUNCTION)
 * @param {Object} options - Terminal options { cwd, cmd }
 * @returns {Promise<number>} Process PID
 */
ipcMain.handle('pty:start', async (event, { cwd, cmd = 'claude', context = {} }) => {
  try {
    console.log(`🖥️ Starting terminal: ${cmd} in ${cwd}`);
    console.log(`🔧 Process platform: ${process.platform}`);
    
    // Determine shell based on OS
    const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
    
    let command, args;
    if (cmd === 'claude') {
      command = 'claude';
      args = [];
    } else if (cmd === 'shell') {
      command = shell;
      args = [];
    } else {
      command = shell;
      args = [];
    }
    
    console.log(`🚀 Attempting to spawn: ${command} with args: [${args.join(', ')}]`);
    console.log(`📁 Working directory: ${cwd || process.cwd()}`);
    
    // Spawn PTY process
    const ptyProcess = pty.spawn(command, args, {
      name: 'xterm-256color',
      cwd: cwd || process.cwd(),
      env: { ...process.env },
      cols: 80,
      rows: 24,
      useConpty: false // Better Windows compatibility
    });
    
    console.log(`🖥️ Terminal process spawned with PID: ${ptyProcess.pid}`);
    console.log(`🔍 PTY process type: ${typeof ptyProcess}, has onData: ${typeof ptyProcess.onData}`);
    
    // Store process with context information
    terminalProcesses.set(ptyProcess.pid, {
      process: ptyProcess,
      context: {
        ...context,
        startTime: new Date().toISOString(),
        workingDirectory: cwd || process.cwd()
      }
    });
    
    // Create terminal session for metrics tracking
    createTerminalSession(ptyProcess.pid, {
      ...context,
      workingDirectory: cwd || process.cwd()
    });
    
    // Forward data to renderer
    ptyProcess.onData(async (data) => {
      console.log(`🖥️ PTY ${ptyProcess.pid} output: "${data.replace(/\r/g, '\\r').replace(/\n/g, '\\n')}"`);
      console.log(`📤 Sending to renderer: pty:data with PID ${ptyProcess.pid}`);
      
      // Get stored context for enhanced logging
      const storedInfo = terminalProcesses.get(ptyProcess.pid);
      const contextInfo = storedInfo ? storedInfo.context : {};
      
      // Use buffered logging for output
      await bufferAndLogOutput(ptyProcess.pid, data, {
        source: 'pty_process',
        ...contextInfo
      });
      
      if (event.sender && !event.sender.isDestroyed()) {
        event.sender.send('pty:data', { pid: ptyProcess.pid, data });
        console.log(`✅ Data sent to renderer successfully`);
      } else {
        console.error(`❌ Cannot send data - event.sender is destroyed or invalid`);
      }
    });
    
    // Handle process exit
    ptyProcess.onExit(async ({ exitCode, signal }) => {
      console.log(`🖥️ Terminal process ${ptyProcess.pid} exited with code ${exitCode}`);
      
      // Get stored context for exit logging
      const storedInfo = terminalProcesses.get(ptyProcess.pid);
      const contextInfo = storedInfo ? storedInfo.context : {};
      
      // Send final session summary before exit
      const session = terminalSessions.get(ptyProcess.pid);
      if (session) {
        // Update final metrics
        updateSessionMetrics(ptyProcess.pid, 'terminal_exit', `Terminal exited with code ${exitCode}`, 'exit');
        
        // Send session summary
        await logTerminalEvent('session_summary', ptyProcess.pid, 
          `Session ended: ${session.metrics.commandsExecuted} commands, ${session.metrics.errorsEncountered} errors, ${Math.round(session.metrics.sessionDurationMs/1000)}s duration`, 
          { exitCode, signal, source: 'session_end', ...contextInfo }
        );
        
        // Clean up session and buffers
        terminalSessions.delete(ptyProcess.pid);
        inputBuffers.delete(ptyProcess.pid);
        outputBuffers.delete(ptyProcess.pid);
      }
      
      // Log terminal exit event
      await logTerminalEvent('terminal_exit', ptyProcess.pid, `Terminal exited with code ${exitCode}`, {
        exitCode: exitCode,
        signal: signal,
        source: 'pty_process',
        ...contextInfo
      });
      
      terminalProcesses.delete(ptyProcess.pid);
      event.sender.send('pty:exit', { pid: ptyProcess.pid, exitCode, signal });
    });
    
    // Log terminal start event
    await logTerminalEvent('terminal_start', ptyProcess.pid, `Starting terminal: ${command} in ${cwd}`, {
      command: command,
      args: args,
      workingDirectory: cwd || process.cwd(),
      terminalCols: 80,
      terminalRows: 24,
      // Include context from frontend
      ...context
    });
    
    console.log(`✅ Terminal started with PID: ${ptyProcess.pid}`);
    return ptyProcess.pid;
    
  } catch (error) {
    console.error('Failed to start terminal:', error);
    throw error;
  }
});

/**
 * Write data to PTY terminal (IPC HANDLER)
 */
ipcMain.on('pty:write', async (event, { pid, data }) => {
  console.log(`⌨️ IPC pty:write received - PID: ${pid}, Data: "${data.replace(/\r/g, '\\r').replace(/\n/g, '\\n')}" (charCodes: [${Array.from(data).map(c => c.charCodeAt(0)).join(', ')}])`);
  console.log(`🔍 Available PTY processes: [${Array.from(terminalProcesses.keys()).join(', ')}]`);
  
  // Get terminal info and context
  const terminalInfo = terminalProcesses.get(pid);
  const contextInfo = terminalInfo ? terminalInfo.context : {};
  
  // Use buffered logging instead of immediate logging for every keystroke
  await bufferAndLogInput(pid, data, {
    source: 'user_input',
    ...contextInfo
  });
  
  if (terminalInfo && terminalInfo.process) {
    console.log(`✅ Found PTY process ${pid}, writing data...`);
    terminalInfo.process.write(data);
  } else {
    console.error(`❌ PTY process ${pid} not found for write operation`);
    console.error(`📋 Available processes: ${Array.from(terminalProcesses.keys())}`);
  }
});

/**
 * Resize PTY terminal (IPC HANDLER)  
 */
ipcMain.on('pty:resize', (event, { pid, cols, rows }) => {
  const terminalInfo = terminalProcesses.get(pid);
  if (terminalInfo && terminalInfo.process) {
    terminalInfo.process.resize(cols, rows);
  }
});

/**
 * Kill PTY terminal process (IPC HANDLER)
 */
ipcMain.handle('pty:kill', async (event, pid) => {
  const terminalInfo = terminalProcesses.get(pid);
  if (terminalInfo && terminalInfo.process) {
    terminalInfo.process.kill();
    terminalProcesses.delete(pid);
    console.log(`🖥️ Killed terminal process: ${pid}`);
    return true;
  }
  return false;
});

// Clean up all running servers and terminals on app exit
process.on('exit', () => {
  console.log('🧹 Cleaning up running React dev servers...');
  for (const [projectId, serverInfo] of projectServers.entries()) {
    if (serverInfo.process && !serverInfo.process.killed) {
      serverInfo.process.kill('SIGTERM');
    }
  }
  
  console.log('🧹 Cleaning up running terminal processes...');
  for (const [pid, terminalInfo] of terminalProcesses.entries()) {
    if (terminalInfo.process) {
      terminalInfo.process.kill();
    }
  }
  
  // Clean up session data and buffers
  terminalSessions.clear();
  inputBuffers.clear();
  outputBuffers.clear();
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

console.log('🌟 Design Tool starting...');