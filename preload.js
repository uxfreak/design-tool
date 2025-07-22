/**
 * Preload Script - Secure IPC Bridge
 * Following Electron security best practices
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose secure IPC API to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Project operations
  createProject: (projectConfig) => ipcRenderer.invoke('project:create', projectConfig),
  openProject: (projectId) => ipcRenderer.invoke('project:open', projectId),
  getStorybookUrl: (projectId) => ipcRenderer.invoke('project:get-storybook-url', projectId),
  
  // Settings operations
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  chooseDirectory: () => ipcRenderer.invoke('settings:choose-directory'),
  resetSettings: () => ipcRenderer.invoke('settings:reset'),
  
  // Project registry operations
  listProjects: () => ipcRenderer.invoke('projects:list'),
  addProject: (projectData) => ipcRenderer.invoke('projects:add', projectData),
  updateProject: (projectId, updates) => ipcRenderer.invoke('projects:update', projectId, updates),
  removeProject: (projectId) => ipcRenderer.invoke('projects:remove', projectId),
  
  // React dev server operations
  startProjectServer: (projectId) => ipcRenderer.invoke('project:start-server', projectId),
  stopProjectServer: (projectId) => ipcRenderer.invoke('project:stop-server', projectId),
  getProjectServerStatus: (projectId) => ipcRenderer.invoke('project:get-server-status', projectId),
  
  // Thumbnail operations  
  generateProjectThumbnail: (projectId, forceRegenerate) => ipcRenderer.invoke('project:generate-thumbnail', projectId, forceRegenerate),
  getProjectThumbnail: (projectId) => ipcRenderer.invoke('project:get-thumbnail', projectId),
  
  // Component discovery operations
  discoverComponents: (projectId) => ipcRenderer.invoke('project:discover-components', projectId),
  
  // Project environment operations
  updateProjectEnv: (projectPath, envVars) => ipcRenderer.invoke('project:update-env', { projectPath, envVars }),
  
  // Terminal PTY operations
  ptyStart: (options) => ipcRenderer.invoke('pty:start', options),
  ptyWrite: (pid, data) => ipcRenderer.send('pty:write', { pid, data }),
  ptyResize: (pid, cols, rows) => ipcRenderer.send('pty:resize', { pid, cols, rows }),
  ptyKill: (pid) => ipcRenderer.invoke('pty:kill', pid),
  onPtyData: (callback) => {
    const wrappedCallback = (event, data) => {
      console.log('🔍 Preload received pty:data event:', data);
      callback(data);
    };
    ipcRenderer.on('pty:data', wrappedCallback);
    return () => ipcRenderer.removeListener('pty:data', wrappedCallback);
  },
  onPtyExit: (callback) => {
    const wrappedCallback = (event, data) => {
      console.log('🔍 Preload received pty:exit event:', data);
      callback(data);
    };
    ipcRenderer.on('pty:exit', wrappedCallback);  
    return () => ipcRenderer.removeListener('pty:exit', wrappedCallback);
  },
  
  // Event listeners for progress updates
  onProjectProgress: (callback) => {
    ipcRenderer.on('project:progress', callback);
    // Return cleanup function
    return () => ipcRenderer.removeListener('project:progress', callback);
  },
  
  // Remove all listeners (cleanup)
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});