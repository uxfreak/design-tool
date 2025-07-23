/**
 * Design Tool - Phase 2 Application Logic
 * Following functional programming principles and Generative Analysis specification
 */

import { createServerManager } from './serverManager.js';
// Handle potential errors gracefully
window.addEventListener('error', (event) => {
    console.log('Window error caught:', event.error);
    event.preventDefault();
});

window.addEventListener('unhandledrejection', (event) => {
    console.log('Unhandled promise rejection caught:', event.reason);
    event.preventDefault();
});

// Application State
let appState = {
    projects: [],
    currentView: 'grid',
    isLoading: false,
    activeCreations: new Map(), // Track active project creations
    openProjects: new Map(), // Track opened projects with Component Library viewer
    projectServers: new Map() // Track server status for each project
};

// Project server state management

// Phase 3: Context Awareness System
let appContext = {
    currentView: 'dashboard', // 'dashboard' | 'project-viewer' | 'settings'
    activeProject: null, // { id, name, path, status }
    currentFile: null, // Current file being viewed/edited
    openFiles: [], // List of open files
    activeTab: null, // 'component-library' | 'workflows' | null
    serverStatus: { running: false, port: null, url: null },
    terminalCwd: null, // Current working directory for terminal
    recentActions: [], // Track recent user actions for context
    breadcrumbs: [] // Navigation breadcrumbs
};

// Pure function constants
const serverManager = createServerManager({ appState, appContext });
const { SERVER_STATUS, startProjectServerBackground, stopAllProjectServers, stopProjectServer, getProjectServerState, updateProjectServerState } = serverManager;
const PROJECT_TEMPLATES = {
    'react-basic': {
        id: 'react-basic',
        name: 'React Basic',
        description: 'Basic React project using create-react-app with custom components',
        dependencies: ['react', 'react-dom'],
        features: ['Custom Button component', 'Custom Card component', 'Variant system']
    },
    'react-typescript': {
        id: 'react-typescript',
        name: 'React + TypeScript',
        description: 'React project with TypeScript support using create-react-app',
        dependencies: ['react', 'react-dom', 'typescript'],
        features: ['TypeScript support', 'Custom components', 'Type-safe variants']
    },
    'react-storybook': {
        id: 'react-storybook',
        name: 'React + Custom Components',
        description: 'React project with custom component variant system (no Storybook)',
        dependencies: ['react', 'react-dom'],
        features: ['Custom Button variants', 'Custom Card variants', 'Component discovery']
    },
    'react-storybook-tailwind': {
        id: 'react-storybook-tailwind',
        name: 'React + Components + Tailwind',
        description: 'React project with custom components (Tailwind to be added)',
        dependencies: ['react', 'react-dom'],
        features: ['Custom components', 'Variant system', 'Tailwind ready']
    }
};

// Pure Functions - Input Validation Layer
function validateProjectName(name) {
    if (!name || typeof name !== 'string') {
        return { success: false, error: 'Project name is required' };
    }
    if (name.length < 3) {
        return { success: false, error: 'Project name must be at least 3 characters' };
    }
    if (name.length > 50) {
        return { success: false, error: 'Project name must be less than 50 characters' };
    }
    if (!/^[a-zA-Z0-9-_\s]+$/.test(name)) {
        return { success: false, error: 'Project name can only contain letters, numbers, hyphens, underscores, and spaces' };
    }
    if (appState.projects.some(project => project.name.toLowerCase() === name.toLowerCase())) {
        return { success: false, error: 'A project with this name already exists' };
    }
    return { success: true, value: name.trim() };
}

function validateProjectTemplate(templateId) {
    if (!templateId || typeof templateId !== 'string') {
        return { success: false, error: 'Template selection is required' };
    }
    if (!PROJECT_TEMPLATES[templateId]) {
        return { success: false, error: 'Invalid template selected' };
    }
    return { success: true, value: templateId };
}

// Pure Functions - Domain Logic Layer
function createProjectConfig(name, templateId) {
    const template = PROJECT_TEMPLATES[templateId];
    const timestamp = new Date();
    
    return {
        id: generateProjectId(),
        name: name,
        templateId: templateId,
        template: template,
        createdAt: timestamp,
        lastModified: timestamp,
        status: 'CREATING',
        path: '', // Will be set during actual creation
        developmentServer: null
    };
}

function generateProjectId() {
    return 'proj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function createProjectDisplayData(projects, viewMode) {
    return projects.map(project => ({
        ...project,
        displayCreatedAt: formatDate(project.createdAt),
        displayLastModified: formatDate(project.lastModified),
        statusDisplay: formatProjectStatus(project.status),
        templateDisplay: project.template?.name || 'Unknown Template'
    }));
}

function formatDate(date) {
    const now = new Date();
    const projectDate = new Date(date);
    const diffInDays = Math.floor((now - projectDate) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return projectDate.toLocaleDateString();
}

function formatProjectStatus(status) {
    const statusMap = {
        'CREATING': { text: 'Creating...', color: '#ff9800' },
        'OPENING': { text: 'Opening...', color: '#2196f3' },
        'RUNNING': { text: 'Running', color: '#4caf50' },
        'ACTIVE': { text: 'Ready', color: '#4caf50' },
        'ARCHIVED': { text: 'Archived', color: '#888' },
        'ERROR': { text: 'Error', color: '#f44336' }
    };
    return statusMap[status] || statusMap['ERROR'];
}

// Pure Functions - Transformation Layer
function projectToStorageFormat(project) {
    return {
        id: project.id,
        name: project.name,
        templateId: project.templateId,
        createdAt: project.createdAt.toISOString(),
        lastModified: project.lastModified.toISOString(),
        status: project.status,
        path: project.path
    };
}

function storageToProjectFormat(storageData) {
    return {
        id: storageData.id,
        name: storageData.name,
        templateId: storageData.templateId,
        template: PROJECT_TEMPLATES[storageData.templateId],
        createdAt: new Date(storageData.createdAt),
        lastModified: new Date(storageData.lastModified),
        status: storageData.status,
        path: storageData.path,
        developmentServer: null
    };
}

function backendToProjectFormat(backendData) {
    return {
        id: backendData.id,
        name: backendData.name,
        templateId: backendData.templateId,
        template: PROJECT_TEMPLATES[backendData.templateId] || { name: 'Unknown Template' },
        createdAt: new Date(backendData.createdAt),
        lastModified: new Date(backendData.lastModified),
        status: backendData.status || 'ACTIVE',
        path: backendData.path,
        workflows: backendData.workflows || [], // Preserve workflows from backend
        developmentServer: null
    };
}

// Effect Functions - Side Effects Managed  
async function loadProjectsFromBackend() {
    try {
        const result = await window.electronAPI.listProjects();
        if (result.success) {
            return result.projects.map(backendToProjectFormat);
        } else {
            console.error('Failed to load projects:', result.error);
            return [];
        }
    } catch (error) {
        console.error('Failed to load projects from backend:', error);
        return [];
    }
}

async function removeProjectFromBackend(projectId) {
    try {
        const result = await window.electronAPI.removeProject(projectId);
        if (!result.success) {
            console.error('Failed to remove project from backend:', result.error);
        }
        return result;
    } catch (error) {
        console.error('Failed to remove project from backend:', error);
        return { success: false, error: error.message };
    }
}

function simulateProjectCreation(projectConfig) {
    return new Promise((resolve) => {
        // Simulate project creation delay
        setTimeout(() => {
            const completedProject = {
                ...projectConfig,
                status: 'ACTIVE',
                path: `/Users/Projects/${projectConfig.name.replace(/\s+/g, '-').toLowerCase()}`,
                lastModified: new Date()
            };
            resolve({ success: true, project: completedProject });
        }, 2000);
    });
}

// Application Functions - Composition Layer with IPC Integration
async function createProject(name, templateId) {
    // Validation
    const nameValidation = validateProjectName(name);
    if (!nameValidation.success) {
        return { success: false, error: nameValidation.error };
    }
    
    const templateValidation = validateProjectTemplate(templateId);
    if (!templateValidation.success) {
        return { success: false, error: templateValidation.error };
    }
    
    // Create project configuration
    const projectConfig = createProjectConfig(nameValidation.value, templateValidation.value);
    
    try {
        // Add to state with 'CREATING' status and immediately update display
        appState.projects = [...appState.projects, projectConfig];
        appState.activeCreations.set(projectConfig.id, { startTime: Date.now() });
        updateProjectsDisplay(); // Show immediately in dashboard
        
        // Use IPC to create project with backend
        const result = await window.electronAPI.createProject(projectConfig);
        
        if (result.success) {
            // Reload projects from backend to get the registered project
            appState.projects = await loadProjectsFromBackend();
            appState.activeCreations.delete(projectConfig.id);
            updateProjectsDisplay();
        } else {
            // Remove failed project from local state
            appState.projects = appState.projects.filter(p => p.id !== projectConfig.id);
            appState.activeCreations.delete(projectConfig.id);
            updateProjectsDisplay();
        }
        
        return result;
    } catch (error) {
        // Remove failed project from local state
        appState.projects = appState.projects.filter(p => p.id !== projectConfig.id);
        appState.activeCreations.delete(projectConfig.id);
        updateProjectsDisplay();
        
        return { success: false, error: 'Failed to create project: ' + error.message };
    }
}

// New function for opening projects with Storybook
async function openProjectWithStorybook(projectId) {
    const project = appState.projects.find(p => p.id === projectId);
    if (!project) {
        return { success: false, error: 'Project not found' };
    }
    
    try {
        // Update project status to show it's opening
        appState.projects = appState.projects.map(p => 
            p.id === projectId ? { ...p, status: 'OPENING' } : p
        );
        updateProjectsDisplay();
        
        // Use IPC to open project and launch Storybook
        const result = await window.electronAPI.openProject(projectId);
        
        if (result.success) {
            // Store Storybook info and update project status
            appState.openProjects.set(projectId, {
                port: result.port,
                url: result.url,
                startTime: Date.now()
            });
            
            appState.projects = appState.projects.map(p => 
                p.id === projectId ? { ...p, status: 'RUNNING' } : p
            );
            updateProjectsDisplay();
            
            // Show Storybook viewer
            showStorybookViewer(projectId, result.url);
        } else {
            // Reset status on failure
            appState.projects = appState.projects.map(p => 
                p.id === projectId ? { ...p, status: 'ACTIVE' } : p
            );
            updateProjectsDisplay();
        }
        
        return result;
    } catch (error) {
        // Reset status on error
        appState.projects = appState.projects.map(p => 
            p.id === projectId ? { ...p, status: 'ERROR' } : p
        );
        updateProjectsDisplay();
        
        return { success: false, error: 'Failed to open project: ' + error.message };
    }
}

// UI Functions
async function initializeApp() {
    console.log('🎨 Design Tool Phase 4 initializing...');
    
    // Load existing projects from backend
    try {
        appState.projects = await loadProjectsFromBackend();
        console.log(`📁 Loaded ${appState.projects.length} projects from backend`);
    } catch (error) {
        console.error('Failed to load projects:', error);
        appState.projects = [];
    }
    
    // Set up event listeners
    setupEventListeners();
    
    // Set up IPC listeners for progress updates
    setupIPCListeners();
    
    // Initial render
    updateProjectsDisplay();
    
    // Initial status bar update
    updateBreadcrumbsAndStatus();
    
    console.log('✅ Design Tool Phase 4 ready');
}

function setupIPCListeners() {
    // Listen for project creation progress updates
    if (window.electronAPI) {
        window.electronAPI.onProjectProgress((event, data) => {
            handleProjectProgress(data);
        });
    }
}

function handleProjectProgress(progressData) {
    const { projectId, plan, completed, error, failed } = progressData;
    
    if (error || failed) {
        console.error('❌ Project creation error:', error);
        
        // Remove failed project from state completely
        appState.projects = appState.projects.filter(p => p.id !== projectId);
        appState.activeCreations.delete(projectId);
        updateProjectsDisplay();
        
        // Show user-friendly error message
        const errorMsg = `Project creation failed: ${error || 'Unknown error'}`;
        alert(errorMsg);
        return;
    }
    
    if (completed) {
        console.log('✅ Project creation completed:', projectId);
        // Clean up progress display
        const projectCard = document.querySelector(`[data-project-id="${projectId}"]`);
        if (projectCard) {
            const progressContainer = projectCard.querySelector('.progress-container');
            if (progressContainer) {
                setTimeout(() => {
                    progressContainer.remove();
                }, 2000); // Remove progress after 2 seconds
            }
        }
        return;
    }
    
    // Update progress in UI
    updateProjectProgress(projectId, plan);
}

function setupEventListeners() {
    // View toggle buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const view = e.target.dataset.view;
            switchView(view);
        });
    });
    
    // Create project form
    document.getElementById('create-project-form').addEventListener('submit', handleCreateProject);
    
    // Modal close events
    document.getElementById('create-project-modal').addEventListener('click', (e) => {
        if (e.target.id === 'create-project-modal') {
            closeCreateProjectModal();
        }
    });
    
    document.getElementById('settings-modal').addEventListener('click', (e) => {
        if (e.target.id === 'settings-modal') {
            closeSettingsModal();
        }
    });
}

function switchView(viewMode) {
    appState.currentView = viewMode;
    
    // Update button states
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === viewMode);
    });
    
    // Update display
    updateProjectsDisplay();
}

function updateProjectsDisplay() {
    const emptyState = document.getElementById('empty-state');
    const projectsDisplay = document.getElementById('projects-display');
    
    if (appState.projects.length === 0) {
        emptyState.style.display = 'flex';
        projectsDisplay.style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        projectsDisplay.style.display = 'block';
        
        // Update container class for view mode
        projectsDisplay.className = appState.currentView === 'grid' ? 'projects-grid' : 'projects-list';
        
        // Render projects with async thumbnail loading
        const displayData = createProjectDisplayData(appState.projects, appState.currentView);
        
        // Show loading placeholder first
        projectsDisplay.innerHTML = displayData.map(project => {
            const config = createProjectCardConfig(project);
            const loadingThumbnail = `
                <div class="project-thumbnail">
                    <div class="thumbnail-loading">
                        <i data-lucide="image" class="thumbnail-icon loading"></i>
                        <span class="thumbnail-text">Loading...</span>
                    </div>
                </div>
            `;
            return createProjectCardHTML(config, loadingThumbnail);
        }).join('');
        
        // Load thumbnails asynchronously
        Promise.all(displayData.map(renderProjectCard))
            .then(cards => {
                projectsDisplay.innerHTML = cards.join('');
                // Re-initialize icons after DOM update
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            })
            .catch(error => {
                console.error('Error loading project thumbnails:', error);
            });
    }
}

/**
 * Pure function to create project card configuration
 * @param {Object} project - Project object
 * @returns {Object} Card configuration
 */
function createProjectCardConfig(project) {
    const statusStyle = `color: ${project.statusDisplay.color}`;
    const isCreating = project.status === 'CREATING';
    const isOpening = project.status === 'OPENING';
    const isRunning = project.status === 'RUNNING';
    
    return {
        project,
        statusStyle,
        isCreating,
        isOpening,
        isRunning,
        cursor: isCreating ? 'default' : 'pointer',
        openButtonColor: isCreating || isOpening ? '#ccc' : (isRunning ? '#4caf50' : '#667eea'),
        deleteButtonColor: isCreating || isOpening ? '#ccc' : '#f44336',
        buttonCursor: isCreating || isOpening ? 'not-allowed' : 'pointer',
        isDisabled: isCreating || isOpening
    };
}

/**
 * Pure function to create thumbnail HTML element
 * @param {Object} config - Card configuration
 * @param {string} thumbnailPath - Path to thumbnail image
 * @returns {string} Thumbnail HTML
 */
/**
 * Pure function to create template icon mapping
 * @param {string} templateId - Template identifier
 * @returns {Object} Icon and color configuration
 */
function getTemplateIconConfig(templateId) {
    const configs = {
        'react-basic': { icon: 'component', color: '#61dafb', name: 'React' },
        'react-typescript': { icon: 'layers', color: '#3178c6', name: 'React + TS' },
        'react-storybook': { icon: 'book-open', color: '#ff4785', name: 'Storybook' },
        'react-storybook-tailwind': { icon: 'palette', color: '#06b6d4', name: 'React + Tailwind' }
    };
    return configs[templateId] || { icon: 'folder', color: '#667eea', name: 'Project' };
}

function createThumbnailElement(config, thumbnailPath = null) {
    // Always show project name prominently, not template name
    const projectName = config.project.name;
    const templateId = config.project.template || 'react-basic';
    const iconConfig = getTemplateIconConfig(templateId);
    
    // Handle live screenshot thumbnails
    if (thumbnailPath && !thumbnailPath.startsWith('fallback:') && thumbnailPath !== 'fallback') {
        return `
            <div class="project-thumbnail">
                <img src="file://${thumbnailPath}" 
                     alt="${projectName} preview" 
                     class="thumbnail-image"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="thumbnail-fallback" style="display: none;">
                    <div class="template-preview" style="border-color: ${iconConfig.color};">
                        <div class="template-icon" style="color: ${iconConfig.color};">
                            <i data-lucide="${iconConfig.icon}" class="template-icon-svg"></i>
                        </div>
                        <div class="template-name">${projectName}</div>
                        <div class="template-subtitle">${iconConfig.name}</div>
                    </div>
                </div>
            </div>
        `;
    } 
    
    // Always show template preview for fallback cases
    return `
        <div class="project-thumbnail template-thumbnail" data-template="${templateId}">
            <div class="template-preview" style="border-color: ${iconConfig.color};">
                <div class="template-icon" style="color: ${iconConfig.color};">
                    <i data-lucide="${iconConfig.icon}" class="template-icon-svg"></i>
                </div>
                <div class="template-name">${projectName}</div>
                <div class="template-subtitle">${iconConfig.name}</div>
            </div>
        </div>
    `;
}

/**
 * Pure function to create project card content HTML
 * @param {Object} config - Card configuration
 * @param {string} thumbnailHtml - Thumbnail HTML element
 * @returns {string} Project card HTML
 */
function createProjectCardHTML(config, thumbnailHtml) {
    return `
        <div class="project-card" data-project-id="${config.project.id}">
            ${thumbnailHtml}
            <div class="project-card-content">
                <div class="project-card-header" 
                     onclick="enhancedOpenProjectViewer('${config.project.id}')" 
                     style="cursor: ${config.cursor};">
                    <div class="project-name" title="${config.project.name}">
                        <i data-lucide="folder" class="project-icon"></i>
                        ${config.project.name}
                    </div>
                    <div class="project-meta" title="${config.project.templateDisplay} • Created ${config.project.displayCreatedAt}">
                        <i data-lucide="layers" class="meta-icon"></i>
                        <span>${config.project.templateDisplay}</span>
                        <i data-lucide="clock" class="meta-icon"></i>
                        <span>${config.project.displayCreatedAt}</span>
                    </div>
                    <div class="project-status" style="${config.statusStyle}" title="${config.project.statusDisplay.text}">
                        <i data-lucide="activity" class="status-icon"></i>
                        ${config.project.statusDisplay.text}
                    </div>
                </div>
                <div class="project-actions">
                    <button 
                        onclick="enhancedOpenProjectViewer('${config.project.id}')" 
                        ${config.isDisabled ? 'disabled' : ''} 
                        class="project-action-btn primary"
                        style="background: ${config.openButtonColor}; cursor: ${config.buttonCursor};"
                        title="${config.isRunning ? 'View Project' : 'Open Project'}">
                        <i data-lucide="${config.isRunning ? 'eye' : 'play'}" class="icon"></i>
                        ${config.isRunning ? 'View' : 'Open'}
                    </button>
                    <button 
                        onclick="generateProjectThumbnail('${config.project.id}')" 
                        ${config.isDisabled ? 'disabled' : ''} 
                        class="project-action-btn secondary"
                        style="cursor: ${config.buttonCursor};"
                        title="Refresh Thumbnail">
                        <i data-lucide="camera" class="icon"></i>
                        Capture
                    </button>
                    <button 
                        onclick="deleteProject('${config.project.id}')" 
                        ${config.isDisabled ? 'disabled' : ''} 
                        class="project-action-btn danger"
                        style="background: ${config.deleteButtonColor}; cursor: ${config.buttonCursor};"
                        title="Delete Project">
                        <i data-lucide="trash-2" class="icon"></i>
                        Delete
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Async function to render project card with thumbnail
 * @param {Object} project - Project object
 * @returns {Promise<string>} Project card HTML with thumbnail
 */
async function renderProjectCard(project) {
    const config = createProjectCardConfig(project);
    
    try {
        // Try to get existing thumbnail
        const thumbnailResult = await window.electronAPI.getProjectThumbnail(project.id);
        const thumbnailPath = thumbnailResult.success ? thumbnailResult.thumbnailPath : null;
        
        const thumbnailHtml = createThumbnailElement(config, thumbnailPath);
        return createProjectCardHTML(config, thumbnailHtml);
    } catch (error) {
        console.error('Error loading thumbnail for project:', project.name, error);
        // Fall back to template-based thumbnail
        const thumbnailHtml = createThumbnailElement(config);
        return createProjectCardHTML(config, thumbnailHtml);
    }
}

/**
 * Generate or refresh project thumbnail
 * @param {string} projectId - Project ID
 */
async function generateProjectThumbnail(projectId) {
    try {
        console.log('📸 Generating thumbnail for project:', projectId);
        
        // Find the project card and show loading state
        const projectCard = document.querySelector(`[data-project-id="${projectId}"]`);
        const thumbnailElement = projectCard?.querySelector('.project-thumbnail');
        
        if (thumbnailElement) {
            thumbnailElement.innerHTML = `
                <div class="thumbnail-loading">
                    <i data-lucide="camera" class="thumbnail-icon loading"></i>
                    <span class="thumbnail-text">Capturing...</span>
                </div>
            `;
            
            // Re-initialize icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
        
        // Generate thumbnail
        const result = await window.electronAPI.generateProjectThumbnail(projectId, true);
        
        if (result.success) {
            console.log('✅ Thumbnail generated successfully:', result.thumbnailPath);
            
            // Update the thumbnail in the UI
            if (thumbnailElement) {
                thumbnailElement.innerHTML = `
                    <img src="file://${result.thumbnailPath}?t=${Date.now()}" 
                         alt="${result.project} preview" 
                         class="thumbnail-image"
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="thumbnail-fallback" style="display: none;">
                        <i data-lucide="image" class="thumbnail-icon"></i>
                        <span class="thumbnail-text">Failed to load</span>
                    </div>
                `;
                
                // Re-initialize icons
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }
        } else {
            throw new Error(result.error);
        }
        
    } catch (error) {
        console.error('❌ Failed to generate thumbnail:', error);
        
        // Show error state
        const projectCard = document.querySelector(`[data-project-id="${projectId}"]`);
        const thumbnailElement = projectCard?.querySelector('.project-thumbnail');
        
        if (thumbnailElement) {
            thumbnailElement.innerHTML = `
                <div class="thumbnail-fallback">
                    <i data-lucide="alert-circle" class="thumbnail-icon error"></i>
                    <span class="thumbnail-text">Capture failed</span>
                </div>
            `;
            
            // Re-initialize icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }
}

// Modal Functions
async function openCreateProjectModal() {
    document.getElementById('create-project-modal').classList.add('show');
    document.getElementById('project-name').focus();
    
    // Load default template from settings
    try {
        const settingsResult = await window.electronAPI.getSettings();
        if (settingsResult.success) {
            const defaultTemplate = settingsResult.settings.defaultTemplate || 'react-storybook';
            document.getElementById('project-template').value = defaultTemplate;
        }
    } catch (error) {
        console.warn('Failed to load default template setting:', error);
        // Fallback to react-storybook
        document.getElementById('project-template').value = 'react-storybook';
    }
}

function closeCreateProjectModal() {
    document.getElementById('create-project-modal').classList.remove('show');
    const form = document.getElementById('create-project-form');
    form.reset();
    
    // Reset submit button state
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.title = 'Create Project';
        submitBtn.disabled = false;
    }
}

async function handleCreateProject(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const name = formData.get('projectName');
    const templateId = formData.get('projectTemplate');
    
    // Disable form
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.title = 'Creating Project...';
    submitBtn.disabled = true;
    
    try {
        // Close modal immediately so user can see the progress
        closeCreateProjectModal();
        
        const result = await createProject(name, templateId);
        
        if (result.success) {
            console.log('✅ Project created successfully');
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function openProject(projectId) {
    const project = appState.projects.find(p => p.id === projectId);
    if (!project) {
        alert('Project not found');
        return;
    }
    
    if (project.status === 'CREATING') {
        alert('Project is still being created. Please wait...');
        return;
    }
    
    console.log('Opening project viewer:', project.name);
    
    // Remove existing modal if present
    const existingModal = document.getElementById('project-viewer');
    if (existingModal) {
        document.body.removeChild(existingModal);
    }
    
    // Create and show new modal
    const modal = createProjectViewerModal(projectId);
    document.body.appendChild(modal);
    
    // Show modal with fade-in effect
    setTimeout(() => modal.classList.add('show'), 10);
    
    // Initialize with component library tab
    switchProjectTab('component-library');
}

function updateProjectProgress(projectId, plan) {
    // Store progress data
    const creationData = appState.activeCreations.get(projectId);
    if (creationData) {
        creationData.plan = plan;
        appState.activeCreations.set(projectId, creationData);
    }
    
    // Update the project card with progress
    const projectCard = document.querySelector(`[data-project-id="${projectId}"]`);
    if (projectCard) {
        updateProjectCardProgress(projectCard, plan);
    }
}

function updateProjectCardProgress(projectCard, plan) {
    // Find or create progress container
    let progressContainer = projectCard.querySelector('.progress-container');
    if (!progressContainer) {
        progressContainer = document.createElement('div');
        progressContainer.className = 'progress-container';
        projectCard.appendChild(progressContainer);
    }
    
    const currentStep = plan.steps[plan.currentStep];
    const progressHtml = `
        <div class="progress-info">
            <div class="progress-step">${currentStep.name}</div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${plan.overallProgress}%"></div>
            </div>
            <div class="progress-percentage">${plan.overallProgress}%</div>
        </div>
    `;
    
    progressContainer.innerHTML = progressHtml;
}

function showStorybookViewer(projectId, storybookUrl) {
    // Create or show project viewer with tabs
    let projectViewer = document.getElementById('project-viewer');
    if (!projectViewer) {
        projectViewer = createProjectViewerModal();
        document.body.appendChild(projectViewer);
    }
    
    // Update project name in header
    const project = appState.projects.find(p => p.id === projectId);
    const titleElement = projectViewer.querySelector('.project-viewer-title');
    titleElement.textContent = project.name;
    
    // Store current project ID
    projectViewer.dataset.projectId = projectId;
    
    // Show the modal and default to Component Library tab
    projectViewer.classList.add('show');
    switchProjectTab('component-library');
    
    console.log('📖 Project viewer opened for:', project.name);
}

function switchProjectTab(tabId) {
    const viewer = document.getElementById('project-viewer');
    if (!viewer) return;
    
    const projectId = viewer.dataset.projectId;
    const project = appState.projects.find(p => p.id === projectId);
    
    // Update tab buttons
    viewer.querySelectorAll('.project-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabId);
    });
    
    // Update tab content
    const contentArea = viewer.querySelector('.project-content');
    
    if (tabId === 'component-library') {
        showComponentLibraryContent(contentArea, project);
    } else if (tabId === 'workflows') {
        showWorkflowsContent(contentArea, project);
    }
}

async function showComponentLibraryContent(contentArea, project) {
    // Show loading state initially
    contentArea.innerHTML = `
        <div class="component-library-loading">
            <div class="loading-spinner"></div>
            <p>Discovering components...</p>
            <small>Scanning ${project.name} for React components</small>
        </div>
    `;
    
    try {
        // Discover real components from project and get server status
        const [componentResult, serverStatus] = await Promise.all([
            window.electronAPI.discoverComponents(project.id),
            window.electronAPI.getProjectServerStatus(project.id)
        ]);
        
        if (componentResult.success) {
            const componentLibraryContent = generateComponentLibraryHTML(componentResult, project, serverStatus);
            contentArea.innerHTML = `<iframe src="data:text/html;charset=utf-8,${encodeURIComponent(componentLibraryContent)}" class="project-iframe"></iframe>`;
            
            // Add message listener for iframe communication (server start requests and refresh)
            const messageListener = async (event) => {
                if (event.data && event.data.action === 'startServer') {
                    try {
                        console.log('🚀 Starting dev server from component library...');
                        const result = await window.electronAPI.startProjectServer(project.id);
                        if (result.success) {
                            // Refresh the component library to show live previews
                            showComponentLibraryContent(contentArea, project);
                        } else {
                            console.error('Failed to start server:', result.error);
                        }
                    } catch (error) {
                        console.error('Error starting dev server:', error);
                    }
                } else if (event.data && event.data.action === 'refreshComponents') {
                    try {
                        console.log('🔄 Refreshing component library...');
                        // Re-discover components and refresh the view
                        showComponentLibraryContent(contentArea, project);
                    } catch (error) {
                        console.error('Error refreshing components:', error);
                    }
                }
            };
            
            // Remove any existing listeners and add the new one
            window.removeEventListener('message', messageListener);
            window.addEventListener('message', messageListener);
            
        } else {
            contentArea.innerHTML = generateComponentLibraryError(componentResult.error, project);
        }
        
    } catch (error) {
        console.error('Failed to discover components:', error);
        contentArea.innerHTML = generateComponentLibraryError(error.message, project);
    }
}

/**
 * Generate Component Library HTML from discovered components with Storybook-like interface (PURE FUNCTION)
 * @param {Object} discoveryResult - Result from component discovery
 * @param {Object} project - Project object
 * @param {Object} serverStatus - Server status object
 * @returns {string} HTML content
 */
function generateComponentLibraryHTML(discoveryResult, project, serverStatus) {
    const { components, totalComponents, totalVariants } = discoveryResult;
    
    const sidebarHTML = generateComponentSidebar(components);
    const selectedComponent = components.length > 0 ? components[0] : null;
    const mainContentHTML = selectedComponent 
        ? generateComponentVariantsView(selectedComponent, serverStatus)
        : generateEmptyComponentView();
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Component Library - ${project.name}</title>
            <style>
                * { box-sizing: border-box; }
                body { 
                    margin: 0; 
                    padding: 0;
                    font-family: var(--font-primary, 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif); 
                    background: var(--color-surface-primary, #1a1a1a); 
                    color: var(--color-text-primary, #ffffff); 
                    height: 100vh;
                    overflow: hidden;
                }
                
                .storybook-layout {
                    display: flex;
                    height: 100vh;
                }
                
                /* Left Sidebar */
                .storybook-sidebar {
                    width: 300px;
                    min-width: 300px;
                    background: var(--color-surface-secondary, #1f1f1f);
                    border-right: 1px solid var(--color-border-primary, #333);
                    display: flex;
                    flex-direction: column;
                }
                
                .sidebar-header {
                    padding: var(--space-6, 1.5rem) var(--space-4, 1rem);
                    border-bottom: 1px solid var(--color-border-primary, #333);
                    background: var(--gradient-primary, linear-gradient(135deg, #667eea 0%, #764ba2 100%));
                }
                
                .sidebar-header-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }
                
                .sidebar-title {
                    font-size: var(--text-lg, 1.05rem);
                    font-weight: var(--weight-semibold, 600);
                    color: white;
                    margin: 0 0 var(--space-2, 0.5rem) 0;
                }
                
                .sidebar-stats {
                    font-size: var(--text-sm, 0.85rem);
                    color: rgba(255, 255, 255, 0.8);
                    margin: 0;
                }
                
                .refresh-btn {
                    background: rgba(255, 255, 255, 0.2);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    color: white;
                    padding: 0.5rem;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 1rem;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 2rem;
                    height: 2rem;
                }
                
                .refresh-btn:hover {
                    background: rgba(255, 255, 255, 0.3);
                    border-color: rgba(255, 255, 255, 0.5);
                    transform: scale(1.05);
                }
                
                .refresh-btn:active {
                    transform: scale(0.95);
                }
                
                .refresh-btn.refreshing {
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .components-nav {
                    flex: 1;
                    overflow-y: auto;
                    padding: var(--space-4, 1rem);
                }
                
                .nav-section-title {
                    font-size: var(--text-xs, 0.75rem);
                    font-weight: var(--weight-semibold, 600);
                    color: var(--color-text-secondary, #ccc);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin: 0 0 var(--space-3, 0.75rem) 0;
                    padding-left: var(--space-2, 0.5rem);
                }
                
                .component-nav-item {
                    display: flex;
                    align-items: center;
                    gap: var(--space-3, 0.75rem);
                    padding: var(--space-3, 0.75rem);
                    margin-bottom: var(--space-2, 0.5rem);
                    border-radius: var(--radius-lg, 8px);
                    cursor: pointer;
                    transition: all var(--duration-fast, 0.15s) var(--ease-out, ease-out);
                    border: 1px solid transparent;
                }
                
                .component-nav-item:hover {
                    background: var(--color-surface-tertiary, #2a2a2a);
                    border-color: var(--color-border-secondary, #444);
                }
                
                .component-nav-item.active {
                    background: var(--color-primary-light, rgba(102, 126, 234, 0.1));
                    border-color: var(--color-primary, #667eea);
                }
                
                .component-nav-icon {
                    font-size: var(--icon-lg, 20px);
                    opacity: 0.7;
                }
                
                .component-nav-name {
                    font-size: var(--text-base, 1rem);
                    font-weight: var(--weight-medium, 500);
                    color: var(--color-text-primary, #ffffff);
                }
                
                .component-nav-variants {
                    font-size: var(--text-xs, 0.75rem);
                    color: var(--color-text-tertiary, #888);
                    margin-top: var(--space-1, 0.25rem);
                }
                
                /* Main Content Area */
                .storybook-main {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                
                .main-header {
                    padding: var(--space-6, 1.5rem) var(--space-8, 2rem);
                    border-bottom: 1px solid var(--color-border-primary, #333);
                    background: var(--color-surface-secondary, #1f1f1f);
                }
                
                .component-name {
                    font-size: var(--text-3xl, 1.5rem);
                    font-weight: var(--weight-semibold, 600);
                    color: var(--color-text-primary, #ffffff);
                    margin: 0 0 var(--space-2, 0.5rem) 0;
                }
                
                .component-path {
                    font-size: var(--text-sm, 0.85rem);
                    color: var(--color-text-tertiary, #888);
                    font-family: var(--font-mono, 'SF Mono', Monaco, monospace);
                    background: var(--color-surface-primary, #1a1a1a);
                    padding: var(--space-2, 0.5rem) var(--space-3, 0.75rem);
                    border-radius: var(--radius-sm, 4px);
                    border: 1px solid var(--color-border-primary, #333);
                    display: inline-block;
                }
                
                .main-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: var(--space-8, 2rem);
                }
                
                .variants-section {
                    margin-bottom: var(--space-10, 2.5rem);
                }
                
                .section-title {
                    font-size: var(--text-xl, 1.2rem);
                    font-weight: var(--weight-semibold, 600);
                    color: var(--color-text-primary, #ffffff);
                    margin: 0 0 var(--space-6, 1.5rem) 0;
                    display: flex;
                    align-items: center;
                    gap: var(--space-2, 0.5rem);
                }
                
                .variants-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: var(--space-6, 1.5rem);
                }
                
                .variant-card {
                    background: var(--card-bg, var(--color-surface-tertiary, #2a2a2a));
                    border: 1px solid var(--color-border-primary, #333);
                    border-radius: var(--radius-lg, 8px);
                    overflow: hidden;
                    transition: all var(--duration-normal, 0.2s) var(--ease-out, ease-out);
                    box-shadow: var(--shadow-md, 0 4px 8px rgba(0, 0, 0, 0.1));
                }
                
                .variant-card:hover {
                    transform: translateY(-2px);
                    border-color: var(--card-hover-border, var(--color-primary, #667eea));
                    box-shadow: var(--shadow-lg, 0 8px 24px rgba(102, 126, 234, 0.1));
                }
                
                .variant-header {
                    padding: var(--space-4, 1rem) var(--space-5, 1.25rem);
                    background: var(--color-surface-secondary, #1f1f1f);
                    border-bottom: 1px solid var(--color-border-primary, #333);
                }
                
                .variant-name {
                    font-size: var(--text-lg, 1.05rem);
                    font-weight: var(--weight-medium, 500);
                    color: var(--color-text-primary, #ffffff);
                    margin: 0;
                }
                
                .variant-preview {
                    padding: var(--space-8, 2rem);
                    min-height: 120px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--color-surface-primary, #1a1a1a);
                    position: relative;
                }
                
                .variant-placeholder {
                    padding: var(--space-6, 1.5rem) var(--space-8, 2rem);
                    border: 2px dashed var(--color-border-secondary, #444);
                    border-radius: var(--radius-md, 6px);
                    text-align: center;
                    color: var(--color-text-tertiary, #888);
                    background: linear-gradient(135deg, var(--color-primary, #667eea) 0%, var(--color-secondary, #764ba2) 100%);
                    background-clip: text;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    font-weight: var(--weight-medium, 500);
                }
                
                /* Live Preview Styles */
                .variant-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                
                .variant-status {
                    display: flex;
                    align-items: center;
                    gap: var(--space-2, 0.5rem);
                    font-size: var(--text-xs, 0.75rem);
                    color: var(--color-text-secondary, #ccc);
                }
                
                .status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    display: inline-block;
                }
                
                .status-live {
                    background: var(--color-success, #4caf50);
                    animation: pulse 2s ease-in-out infinite;
                }
                
                .status-offline {
                    background: var(--color-text-tertiary, #888);
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                
                .live-preview {
                    padding: 0;
                    height: 300px;
                    background: white;
                    border-radius: 0 0 var(--radius-lg, 8px) var(--radius-lg, 8px);
                    overflow: hidden;
                }
                
                .component-iframe {
                    width: 100%;
                    height: 100%;
                    border: none;
                    background: white;
                }
                
                .preview-overlay {
                    position: absolute;
                    top: var(--space-2, 0.5rem);
                    right: var(--space-2, 0.5rem);
                    opacity: 0;
                    transition: opacity var(--duration-fast, 0.15s);
                }
                
                .variant-card:hover .preview-overlay {
                    opacity: 1;
                }
                
                .open-in-new {
                    background: var(--color-surface-tertiary, #2a2a2a);
                    border: 1px solid var(--color-border-primary, #333);
                    color: var(--color-text-primary, #ffffff);
                    padding: var(--space-2, 0.5rem) var(--space-3, 0.75rem);
                    border-radius: var(--radius-sm, 4px);
                    font-size: var(--text-sm, 0.85rem);
                    cursor: pointer;
                    transition: all var(--duration-fast, 0.15s);
                    backdrop-filter: blur(10px);
                }
                
                .open-in-new:hover {
                    background: var(--color-primary, #667eea);
                    border-color: var(--color-primary, #667eea);
                }
                
                .variant-placeholder.offline {
                    border-color: var(--color-text-tertiary, #888);
                    background: none;
                    color: var(--color-text-secondary, #ccc);
                }
                
                .placeholder-icon {
                    font-size: 2rem;
                    margin-bottom: var(--space-3, 0.75rem);
                    opacity: 0.5;
                }
                
                .placeholder-text {
                    font-size: var(--text-lg, 1.05rem);
                    font-weight: var(--weight-medium, 500);
                    margin-bottom: var(--space-2, 0.5rem);
                }
                
                .placeholder-subtitle {
                    font-size: var(--text-sm, 0.85rem);
                    margin-bottom: var(--space-4, 1rem);
                    opacity: 0.7;
                }
                
                .start-server-btn {
                    background: var(--gradient-primary, linear-gradient(135deg, #667eea 0%, #764ba2 100%));
                    border: none;
                    color: white;
                    padding: var(--space-3, 0.75rem) var(--space-5, 1.25rem);
                    border-radius: var(--radius-md, 6px);
                    font-size: var(--text-sm, 0.85rem);
                    font-weight: var(--weight-medium, 500);
                    cursor: pointer;
                    transition: all var(--duration-fast, 0.15s);
                    box-shadow: var(--shadow-md, 0 4px 8px rgba(0, 0, 0, 0.1));
                }
                
                .start-server-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: var(--shadow-lg, 0 8px 24px rgba(102, 126, 234, 0.1));
                }
                
                /* Loading and transition states */
                .variant-card.transitioning {
                    opacity: 0.7;
                    transition: opacity var(--duration-slow, 0.3s);
                }
                
                .variant-preview.loading {
                    background: var(--color-surface-tertiary, #2a2a2a);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .preview-loading-spinner {
                    width: 24px;
                    height: 24px;
                    border: 2px solid var(--color-text-tertiary, #888);
                    border-top: 2px solid var(--color-primary, #667eea);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                /* Smooth status transitions */
                .variant-status {
                    transition: all var(--duration-normal, 0.2s);
                }
                
                .status-dot {
                    transition: background-color var(--duration-normal, 0.2s);
                }
                
                /* Auto-refresh indicator */
                .component-iframe.refreshing {
                    opacity: 0.5;
                    transition: opacity var(--duration-fast, 0.15s);
                }
                
                .component-iframe.loaded {
                    opacity: 1;
                    transition: opacity var(--duration-normal, 0.2s);
                }
                
                .empty-state {
                    text-align: center;
                    padding: var(--space-20, 5rem) var(--space-8, 2rem);
                    color: var(--color-text-secondary, #ccc);
                }
                
                .empty-icon {
                    font-size: 4rem;
                    margin-bottom: var(--space-6, 1.5rem);
                    opacity: 0.3;
                }
                
                .empty-title {
                    font-size: var(--text-2xl, 1.3rem);
                    font-weight: var(--weight-medium, 500);
                    margin: 0 0 var(--space-4, 1rem) 0;
                }
                
                .empty-description {
                    font-size: var(--text-base, 1rem);
                    line-height: var(--leading-relaxed, 1.5);
                    max-width: 500px;
                    margin: 0 auto;
                }
                
                /* Scrollbar styling */
                .components-nav::-webkit-scrollbar,
                .main-content::-webkit-scrollbar {
                    width: 6px;
                }
                
                .components-nav::-webkit-scrollbar-track,
                .main-content::-webkit-scrollbar-track {
                    background: var(--color-surface-primary, #1a1a1a);
                }
                
                .components-nav::-webkit-scrollbar-thumb,
                .main-content::-webkit-scrollbar-thumb {
                    background: var(--color-border-secondary, #444);
                    border-radius: 3px;
                }
                
                .components-nav::-webkit-scrollbar-thumb:hover,
                .main-content::-webkit-scrollbar-thumb:hover {
                    background: var(--color-hover, #555);
                }
            </style>
        </head>
        <body>
            <div class="storybook-layout">
                ${sidebarHTML}
                <div class="storybook-main">
                    ${mainContentHTML}
                </div>
            </div>
            
            <script>
                // Component navigation functionality and server state
                let selectedComponent = '${selectedComponent ? selectedComponent.name : ''}';
                const components = ${JSON.stringify(components)};
                let serverStatus = ${JSON.stringify(serverStatus)};
                const projectId = '${project.id}';
                let statusCheckInterval;
                
                function selectComponent(componentName) {
                    console.log('🔍 selectComponent called with:', componentName);
                    selectedComponent = componentName;
                    
                    // Update navigation active state
                    console.log('🔍 Updating navigation active state...');
                    document.querySelectorAll('.component-nav-item').forEach(item => {
                        item.classList.remove('active');
                    });
                    const targetNav = document.querySelector('[data-component="' + componentName + '"]');
                    if (targetNav) {
                        targetNav.classList.add('active');
                        console.log('🔍 Nav item activated:', componentName);
                    } else {
                        console.log('❌ Nav item not found for:', componentName);
                    }
                    
                    // Update main content
                    console.log('🔍 Finding component:', componentName);
                    const component = components.find(c => c.name === componentName);
                    if (component) {
                        console.log('🔍 Component found:', component);
                        const mainContent = document.querySelector('.storybook-main');
                        if (mainContent) {
                            console.log('🔍 Updating main content...');
                            mainContent.innerHTML = generateMainContent(component);
                            console.log('🔍 Main content updated successfully');
                        } else {
                            console.log('❌ Main content element not found');
                        }
                    } else {
                        console.log('❌ Component not found:', componentName);
                    }
                }
                
                function generateMainContent(component) {
                    if (!component) return '';
                    
                    const relativePath = component.filePath.includes('src/components/') 
                        ? component.filePath.split('src/components/')[1] 
                        : component.fileName;
                    
                    const variantsHTML = component.hasVariants && component.variants.length > 0
                        ? component.variants.map(variant => generateVariantCard(component, variant)).join('')
                        : generateVariantCard(component, { name: 'Default' });
                    
                    return '<div class="main-header">' +
                        '<h1 class="component-name">' + component.name + '</h1>' +
                        '<div class="component-path">' + relativePath + '</div>' +
                        '</div>' +
                        '<div class="main-content">' +
                            '<div class="variants-section">' +
                                '<h2 class="section-title">' +
                                    '✨ Variants (' + (component.hasVariants ? component.variants.length : 1) + ')' +
                                '</h2>' +
                                '<div class="variants-grid">' +
                                    variantsHTML +
                                '</div>' +
                            '</div>' +
                        '</div>';
                }
                
                // Generate individual variant card with isolated component preview
                function generateVariantCard(component, variant) {
                    // Always show isolated component preview (like Storybook)
                    const componentStoryUrl = generateComponentStoryUrl(component, variant);
                    
                    return '<div class="variant-card" data-variant="' + variant.name + '">' +
                        '<div class="variant-header">' +
                            '<h3 class="variant-name">' + variant.name + '</h3>' +
                            '<div class="variant-status">' +
                                '<span class="status-dot status-ready"></span>' +
                                '<span>Component Preview</span>' +
                            '</div>' +
                        '</div>' +
                        '<div class="variant-preview live-preview">' +
                            '<iframe ' +
                                'src="' + componentStoryUrl + '" ' +
                                'class="component-iframe" ' +
                                'frameborder="0" ' +
                                'sandbox="allow-scripts allow-same-origin" ' +
                                'loading="lazy">' +
                            '</iframe>' +
                            '<div class="preview-overlay">' +
                                '<button class="open-in-new" onclick="window.open(\'' + componentStoryUrl + '\', \'_blank\')" title="Open in new window">' +
                                    '⤴️' +
                                '</button>' +
                            '</div>' +
                        '</div>' +
                    '</div>';
                }
                
                // Generate component story URL for isolated rendering
                function generateComponentStoryUrl(component, variant) {
                    // Create an isolated component preview using data: URL with complete HTML
                    const componentPreviewHTML = generateIsolatedComponentHTML(component, variant);
                    return 'data:text/html;charset=utf-8,' + encodeURIComponent(componentPreviewHTML);
                }
                
                // Generate isolated component HTML with real React rendering (moved from global scope to iframe scope)
                function generateIsolatedComponentHTML(component, variant) {
                    const variantProps = variant.props || {};
                    const propsString = Object.entries(variantProps)
                        .map(([key, value]) => key + '={' + JSON.stringify(value) + '}')
                        .join(' ');
                    
                    // Check if server is running for live preview
                    const hasServerRunning = serverStatus && serverStatus.success && serverStatus.status === 'running';
                    const serverUrl = hasServerRunning ? serverStatus.url : null;
                    
                    // Use Storybook for real component previews
                    return generateStorybookComponentHTML(component, variant, hasServerRunning, serverUrl);
                }
                
                // Generate Storybook component HTML for real component previews
                function generateStorybookComponentHTML(component, variant, hasServerRunning, serverUrl) {
                    const variantProps = variant.props || {};
                    const propsString = Object.entries(variantProps)
                        .map(([key, value]) => key + '={' + JSON.stringify(value) + '}')
                        .join(' ');
                    
                    // Generate Storybook story URL for the component variant
                    const storyId = 'components-' + component.name.toLowerCase() + '--' + (variant.name || 'default').toLowerCase().replace(/\s+/g, '-');
                    const storybookUrl = hasServerRunning && serverUrl 
                        ? serverUrl.replace(':3000', ':6006') + '/iframe.html?id=' + storyId + '&viewMode=story'
                        : null;
                    
                    if (storybookUrl) {
                        // Show real Storybook component preview
                        return generateRealStorybookHTML(component, variant, storybookUrl, propsString);
                    } else {
                        // Show startup message with instructions
                        return generateStorybookStartupHTML(component, variant, propsString);
                    }
                }
                
                // Generate real Storybook iframe preview
                function generateRealStorybookHTML(component, variant, storybookUrl, propsString) {
                    return '<!DOCTYPE html>' +
                        '<html>' +
                        '<head>' +
                            '<title>' + component.name + ' - ' + variant.name + ' (Storybook)</title>' +
                            '<style>' +
                                '* { box-sizing: border-box; }' +
                                'body { margin: 0; padding: 1rem; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif; background: #ffffff; }' +
                                '.preview-container { max-width: 600px; margin: 0 auto; }' +
                                '.storybook-header { text-align: center; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #eee; }' +
                                '.component-name { font-size: 1.2rem; font-weight: 600; margin: 0; color: #333; }' +
                                '.storybook-badge { background: #ff4785; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.7rem; margin-left: 0.5rem; }' +
                                '.storybook-frame { width: 100%; height: 400px; border: 1px solid #eee; border-radius: 6px; background: white; }' +
                                '.component-code { background: #f8f9fa; padding: 0.75rem; border-radius: 4px; font-family: monospace; font-size: 0.8rem; margin-top: 1rem; color: #666; }' +
                            '</style>' +
                        '</head>' +
                        '<body>' +
                            '<div class="preview-container">' +
                                '<div class="storybook-header">' +
                                    '<div class="component-name">' + component.name + ' - ' + variant.name + '<span class="storybook-badge">STORYBOOK</span></div>' +
                                '</div>' +
                                '<iframe src="' + storybookUrl + '" class="storybook-frame" frameborder="0"></iframe>' +
                                '<div class="component-code">&lt;' + component.name + ' ' + propsString + ' /&gt;</div>' +
                            '</div>' +
                        '</body>' +
                        '</html>';
                }
                
                // Generate startup instructions when Storybook isn't running
                function generateStorybookStartupHTML(component, variant, propsString) {
                    return '<!DOCTYPE html>' +
                        '<html>' +
                        '<head>' +
                            '<title>' + component.name + ' - ' + variant.name + '</title>' +
                            '<style>' +
                                '* { box-sizing: border-box; }' +
                                'body { margin: 0; padding: 2rem; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif; background: #f8f9fa; }' +
                                '.startup-container { max-width: 500px; margin: 0 auto; background: white; border-radius: 8px; padding: 2rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center; }' +
                                '.storybook-logo { font-size: 3rem; margin-bottom: 1rem; }' +
                                '.component-name { font-size: 1.3rem; font-weight: 600; margin-bottom: 0.5rem; color: #333; }' +
                                '.variant-name { color: #666; margin-bottom: 2rem; }' +
                                '.instructions { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 1rem; margin-bottom: 1.5rem; color: #856404; }' +
                                '.start-btn { background: #ff4785; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; font-weight: 500; cursor: pointer; transition: background 0.2s; }' +
                                '.start-btn:hover { background: #e63946; }' +
                                '.component-code { background: #f1f3f4; padding: 1rem; border-radius: 4px; font-family: monospace; font-size: 0.9rem; margin-top: 1.5rem; color: #666; }' +
                            '</style>' +
                        '</head>' +
                        '<body>' +
                            '<div class="startup-container">' +
                                '<div class="storybook-logo">📚</div>' +
                                '<div class="component-name">' + component.name + '</div>' +
                                '<div class="variant-name">Variant: ' + (variant.name || 'Default') + '</div>' +
                                '<div class="instructions">' +
                                    '<strong>Storybook Ready!</strong><br>' +
                                    'This project includes Storybook for real component previews. Start the development server to see live components.' +
                                '</div>' +
                                '<button class="start-btn" onclick="window.parent.postMessage({action: \'startServer\'}, \'*\')">' +
                                    '🚀 Start Dev Server' +
                                '</button>' +
                                '<div class="component-code">&lt;' + component.name + ' ' + propsString + ' /&gt;</div>' +
                            '</div>' +
                        '</body>' +
                        '</html>';
                }
                
                
                // Start development server for live previews
                async function startDevServer() {
                    try {
                        const result = await window.parent.electronAPI.startProjectServer(projectId);
                        if (result.success) {
                            // Refresh the component library to show live previews
                            window.location.reload();
                        } else {
                            alert('Failed to start development server: ' + result.error);
                        }
                    } catch (error) {
                        console.error('Error starting dev server:', error);
                        alert('Error starting development server');
                    }
                }
                
                // Real-time server status monitoring
                async function checkServerStatus() {
                    try {
                        const response = await window.parent.electronAPI.getProjectServerStatus(projectId);
                        const previousStatus = serverStatus?.status;
                        serverStatus = response;
                        
                        // If server status changed from non-ready to ready, refresh previews
                        if (previousStatus !== 'ready' && serverStatus?.status === 'ready') {
                            console.log('🚀 Server is now ready! Loading live previews...');
                            updateAllVariantPreviews();
                        }
                        // If server stopped, update to show offline state
                        else if (previousStatus === 'ready' && serverStatus?.status !== 'ready') {
                            console.log('⏹️ Server stopped. Updating to offline state...');
                            updateAllVariantPreviews();
                        }
                        
                        // Update server status indicators
                        updateServerStatusIndicators();
                        
                    } catch (error) {
                        console.error('Failed to check server status:', error);
                    }
                }
                
                // Update all variant previews based on current server status
                function updateAllVariantPreviews() {
                    const currentComponent = components.find(c => c.name === selectedComponent);
                    if (currentComponent) {
                        const mainContent = document.querySelector('.storybook-main');
                        if (mainContent) {
                            mainContent.innerHTML = generateMainContent(currentComponent);
                        }
                    }
                }
                
                // Update server status indicators across all variant cards with smooth transitions
                function updateServerStatusIndicators() {
                    const variantCards = document.querySelectorAll('.variant-card');
                    const isServerReady = serverStatus?.status === 'ready';
                    const isServerStarting = serverStatus?.status === 'starting';
                    
                    variantCards.forEach(card => {
                        const statusEl = card.querySelector('.variant-status');
                        const dotEl = statusEl?.querySelector('.status-dot');
                        const textEl = statusEl?.querySelector('.status-dot + span');
                        
                        if (!dotEl || !textEl) return;
                        
                        // Update visual state
                        if (isServerReady) {
                            dotEl.classList.remove('status-offline');
                            dotEl.classList.add('status-live');
                            textEl.textContent = 'Live Preview';
                            card.classList.remove('transitioning');
                        } else if (isServerStarting) {
                            dotEl.classList.remove('status-offline');
                            dotEl.classList.add('status-live');
                            textEl.textContent = 'Server starting...';
                            card.classList.add('transitioning');
                        } else {
                            dotEl.classList.remove('status-live');
                            dotEl.classList.add('status-offline');
                            textEl.textContent = 'Server stopped';
                            card.classList.remove('transitioning');
                        }
                    });
                }
                
                // Start real-time monitoring when page loads
                function startServerMonitoring() {
                    console.log('🔄 Starting real-time server monitoring for project:', projectId);
                    
                    // Initial check
                    checkServerStatus();
                    
                    // Set up periodic checks - more frequent initially, then slower
                    let checkCount = 0;
                    const quickCheck = () => {
                        checkServerStatus();
                        checkCount++;
                        
                        // First 30 checks (1 minute) - check every 2 seconds
                        // After that - check every 5 seconds
                        const interval = checkCount < 30 ? 2000 : 5000;
                        statusCheckInterval = setTimeout(quickCheck, interval);
                    };
                    
                    statusCheckInterval = setTimeout(quickCheck, 1000); // First check after 1 second
                }
                
                // Stop monitoring when page unloads
                function stopServerMonitoring() {
                    if (statusCheckInterval) {
                        clearTimeout(statusCheckInterval);
                        statusCheckInterval = null;
                        console.log('⏹️ Stopped server monitoring');
                    }
                }
                
                // Initialize monitoring
                startServerMonitoring();
                
                // Clean up on page unload
                window.addEventListener('beforeunload', stopServerMonitoring);
                
                // Refresh components function to communicate with parent
                function refreshComponents() {
                    const refreshBtn = document.querySelector('.refresh-btn');
                    if (refreshBtn) {
                        refreshBtn.classList.add('refreshing');
                        refreshBtn.textContent = '⏳';
                    }
                    
                    // Send refresh request to parent window
                    window.parent.postMessage({ action: 'refreshComponents' }, '*');
                    
                    // Reset button state after animation
                    setTimeout(() => {
                        if (refreshBtn) {
                            refreshBtn.classList.remove('refreshing');
                            refreshBtn.textContent = '🔄';
                        }
                    }, 1000);
                }
                
                // Add event delegation for component navigation clicks
                function initializeNavigation() {
                    console.log('🔍 Initializing component navigation...');
                    
                    // Add click handler with debugging
                    document.addEventListener('click', function(event) {
                        console.log('🔍 Click detected:', event.target);
                        const navItem = event.target.closest('.component-nav-item');
                        if (navItem) {
                            console.log('🔍 Nav item found:', navItem);
                            const componentName = navItem.getAttribute('data-component');
                            console.log('🔍 Component name:', componentName);
                            if (componentName) {
                                console.log('🔍 Calling selectComponent with:', componentName);
                                selectComponent(componentName);
                            }
                        }
                    });
                    
                    // Initialize first component selection
                    if (selectedComponent) {
                        const firstComponent = document.querySelector('[data-component="' + selectedComponent + '"]');
                        if (firstComponent) {
                            firstComponent.classList.add('active');
                            console.log('🔍 First component activated:', selectedComponent);
                        }
                    }
                }
                
                // Initialize when DOM is ready
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', initializeNavigation);
                } else {
                    initializeNavigation();
                }
            </script>
        </body>
        </html>
    `;
}

/**
 * Generate standalone HTML for isolated component preview with live rendering support (PURE FUNCTION)
 * This function exists in both global scope and iframe scope to support different call paths
 * @param {Object} component - Component object
 * @param {Object} variant - Variant object
 * @param {Object} serverStatus - Optional server status for live preview support
 * @returns {string} Complete HTML document for component preview
 */
function generateIsolatedComponentHTML(component, variant, serverStatus = null) {
    const variantProps = variant.props || {};
    const propsString = Object.entries(variantProps)
        .map(([key, value]) => `${key}={${JSON.stringify(value)}}`)
        .join(' ');
    
    // Check if server is running for live preview
    const hasServerRunning = serverStatus && serverStatus.success && serverStatus.status === 'running';
    const serverUrl = hasServerRunning ? serverStatus.url : null;
    
    // Use Storybook for real component previews (global scope version)
    return generateGlobalStorybookComponentHTML(component, variant, hasServerRunning, serverUrl, propsString);
}

// Generate Storybook component HTML for real component previews (global scope)
function generateGlobalStorybookComponentHTML(component, variant, hasServerRunning, serverUrl, propsString) {
    // Generate Storybook story URL for the component variant
    const storyId = 'components-' + component.name.toLowerCase() + '--' + (variant.name || 'default').toLowerCase().replace(/\s+/g, '-');
    const storybookUrl = hasServerRunning && serverUrl 
        ? serverUrl.replace(':3000', ':6006') + '/iframe.html?id=' + storyId + '&viewMode=story'
        : null;
    
    if (storybookUrl) {
        // Show real Storybook component preview
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${component.name} - ${variant.name} (Storybook)</title>
                <style>
                    * { box-sizing: border-box; }
                    body { margin: 0; padding: 1rem; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; background: #ffffff; }
                    .preview-container { max-width: 600px; margin: 0 auto; }
                    .storybook-header { text-align: center; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #eee; }
                    .component-name { font-size: 1.2rem; font-weight: 600; margin: 0; color: #333; }
                    .storybook-badge { background: #ff4785; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.7rem; margin-left: 0.5rem; }
                    .storybook-frame { width: 100%; height: 400px; border: 1px solid #eee; border-radius: 6px; background: white; }
                    .component-code { background: #f8f9fa; padding: 0.75rem; border-radius: 4px; font-family: monospace; font-size: 0.8rem; margin-top: 1rem; color: #666; }
                </style>
            </head>
            <body>
                <div class="storybook-header">
                    <div class="component-name">${component.name} - ${variant.name}<span class="storybook-badge">STORYBOOK</span></div>
                </div>
                <iframe src="${storybookUrl}" class="storybook-frame" frameborder="0"></iframe>
                <div class="component-code">&lt;${component.name} ${propsString} /&gt;</div>
            </body>
            </html>
        `;
    } else {
        // Show startup message with instructions
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${component.name} - ${variant.name}</title>
                <style>
                    * { box-sizing: border-box; }
                    body { margin: 0; padding: 2rem; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; background: #f8f9fa; }
                    .startup-container { max-width: 500px; margin: 0 auto; background: white; border-radius: 8px; padding: 2rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center; }
                    .storybook-logo { font-size: 3rem; margin-bottom: 1rem; }
                    .component-name { font-size: 1.3rem; font-weight: 600; margin-bottom: 0.5rem; color: #333; }
                    .variant-name { color: #666; margin-bottom: 2rem; }
                    .instructions { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 1rem; margin-bottom: 1.5rem; color: #856404; }
                    .start-btn { background: #ff4785; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; font-weight: 500; cursor: pointer; transition: background 0.2s; }
                    .start-btn:hover { background: #e63946; }
                    .component-code { background: #f1f3f4; padding: 1rem; border-radius: 4px; font-family: monospace; font-size: 0.9rem; margin-top: 1.5rem; color: #666; }
                </style>
            </head>
            <body>
                <div class="startup-container">
                    <div class="storybook-logo">📚</div>
                    <div class="component-name">${component.name}</div>
                    <div class="variant-name">Variant: ${variant.name || 'Default'}</div>
                    <div class="instructions">
                        <strong>Storybook Ready!</strong><br>
                        This project includes Storybook for real component previews. Start the development server to see live components.
                    </div>
                    <div class="component-code">&lt;${component.name} ${propsString} /&gt;</div>
                </div>
            </body>
            </html>
        `;
    }
}

/**
 * Generate component sidebar HTML for Storybook-like interface (PURE FUNCTION)
 * @param {Array} components - Array of component objects
 * @returns {string} HTML for sidebar navigation
 */
function generateComponentSidebar(components) {
    const componentsNavHTML = components.length > 0 
        ? components.map(component => {
            const relativePath = component.filePath.includes('src/components/') 
                ? component.filePath.split('src/components/')[1] 
                : component.fileName;
                
            return `
                <div class="component-nav-item" data-component="${component.name}">
                    <div class="component-nav-icon">🧩</div>
                    <div>
                        <div class="component-nav-name">${component.name}</div>
                        <div class="component-nav-variants">
                            ${component.hasVariants ? `${component.variants.length} variants` : 'No variants'}
                        </div>
                    </div>
                </div>
            `;
        }).join('')
        : `
            <div style="text-align: center; padding: 2rem; color: var(--color-text-tertiary, #888);">
                <div style="font-size: 2rem; margin-bottom: 1rem;">📦</div>
                <div style="font-size: 0.9rem;">No components found</div>
            </div>
        `;

    return `
        <div class="storybook-sidebar">
            <div class="sidebar-header">
                <div class="sidebar-header-content">
                    <div>
                        <h2 class="sidebar-title">Components</h2>
                        <p class="sidebar-stats">${components.length} components found</p>
                    </div>
                    <button class="refresh-btn" onclick="refreshComponents()" title="Refresh components">
                        🔄
                    </button>
                </div>
            </div>
            <div class="components-nav">
                <div class="nav-section-title">Library</div>
                ${componentsNavHTML}
            </div>
        </div>
    `;
}

/**
 * Generate main content view for selected component with live previews (PURE FUNCTION)
 * @param {Object} component - Selected component object
 * @param {Object} serverStatus - Server status object
 * @returns {string} HTML for main content area
 */
function generateComponentVariantsView(component, serverStatus) {
    const relativePath = component.filePath.includes('src/components/') 
        ? component.filePath.split('src/components/')[1] 
        : component.fileName;
    
    // Generate variant cards using the new live preview system
    const variantsHTML = component.hasVariants && component.variants.length > 0
        ? component.variants.map(variant => generateVariantCardHTML(component, variant, serverStatus)).join('')
        : generateVariantCardHTML(component, { name: 'Default' }, serverStatus);
    
    return `
        <div class="main-header">
            <h1 class="component-name">${component.name}</h1>
            <div class="component-path">${relativePath}</div>
        </div>
        <div class="main-content">
            <div class="variants-section">
                <h2 class="section-title">
                    ✨ Variants
                    (${component.hasVariants ? component.variants.length : 1})
                </h2>
                <div class="variants-grid">
                    ${variantsHTML}
                </div>
            </div>
        </div>
    `;
}


/**
 * Generate variant card HTML with live preview support (PURE FUNCTION)
 * @param {Object} component - Component object
 * @param {Object} variant - Variant object
 * @param {Object} serverStatus - Server status object
 * @returns {string} HTML for variant card
 */
function generateVariantCardHTML(component, variant, serverStatus) {
    // Always show isolated component preview (like Storybook) with server status for live rendering
    const componentPreviewHTML = generateIsolatedComponentHTML(component, variant, serverStatus);
    const componentStoryUrl = `data:text/html;charset=utf-8,${encodeURIComponent(componentPreviewHTML)}`;
    
    return `
        <div class="variant-card">
            <div class="variant-header">
                <h3 class="variant-name">${variant.name || 'Default'}</h3>
                <div class="variant-status">
                    <span class="status-dot status-ready"></span>
                    Component Preview
                </div>
            </div>
            <div class="variant-preview live-preview">
                <iframe 
                    src="${componentStoryUrl}" 
                    class="component-iframe"
                    frameborder="0"
                    sandbox="allow-scripts allow-same-origin"
                    loading="lazy">
                </iframe>
                <div class="preview-overlay">
                    <button class="open-in-new" onclick="window.open('${componentStoryUrl}', '_blank')" title="Open in new window">
                        ⤴️
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Generate empty state for component view (PURE FUNCTION)
 * @returns {string} HTML for empty state
 */
function generateEmptyComponentView() {
    return `
        <div class="main-content">
            <div class="empty-state">
                <div class="empty-icon">📦</div>
                <h2 class="empty-title">No Components Available</h2>
                <p class="empty-description">
                    No React components were found in this project. 
                    <br><br>
                    Components should be placed in the <code>src/components/</code> directory 
                    with <code>.jsx</code> or <code>.tsx</code> extensions to be discovered automatically.
                </p>
            </div>
        </div>
    `;
}

/**
 * Generate component card HTML (PURE FUNCTION - LEGACY, kept for compatibility)
 * @param {Object} component - Component info
 * @returns {string} HTML for component card
 */
function generateComponentCard(component) {
    const variantsHTML = component.hasVariants 
        ? `<div class="variants-list">
             ${component.variants.map(variant => `<span class="variant-badge">${variant.name}</span>`).join('')}
           </div>`
        : `<p class="no-variants">No variants defined</p>`;
    
    const relativePath = component.filePath.includes('src/components/') 
        ? component.filePath.split('src/components/')[1] 
        : component.fileName;
    
    return `
        <div class="component-card${component.hasVariants ? ' has-variants' : ''}">
            <h3 class="component-title">
                ${component.name}
                ${component.hasVariants ? '<span class="variant-sparkle">✨</span>' : ''}
            </h3>
            <div class="component-file-path">${relativePath}</div>
            <div class="component-description">
                ${component.hasVariants 
                    ? `React component with ${component.variants.length} variant${component.variants.length === 1 ? '' : 's'}` 
                    : 'React component (no variants defined)'
                }
            </div>
            <div class="component-variants">
                <div class="variants-title">Variants</div>
                ${variantsHTML}
            </div>
        </div>
    `;
}

/**
 * Generate no components card (PURE FUNCTION)
 * @returns {string} HTML for no components state
 */
function generateNoComponentsCard() {
    return `
        <div class="component-card no-components-card">
            <div class="no-components-icon">📦</div>
            <h3 class="component-title">No Components Found</h3>
            <p class="component-description">
                No React components were found in the <code>src/components/</code> directory.
                <br><br>
                Components should be placed in <code>src/components/</code> with the <code>.jsx</code> or <code>.tsx</code> extension.
            </p>
            <button class="refresh-btn" onclick="location.reload()">Refresh</button>
        </div>
    `;
}

/**
 * Generate error state HTML (PURE FUNCTION) 
 * @param {string} errorMessage - Error message
 * @param {Object} project - Project object
 * @returns {string} HTML for error state
 */
function generateComponentLibraryError(errorMessage, project) {
    return `
        <div class="component-library-error" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; background: #1a1a1a; color: #ffffff; padding: 3rem; text-align: center;">
            <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;">⚠️</div>
            <h3 style="color: #ff6b6b; margin-bottom: 0.5rem;">Failed to Discover Components</h3>
            <p style="color: #ccc; margin-bottom: 0.5rem;">Unable to scan components in ${project.name}</p>
            <small style="color: #888; margin-bottom: 2rem;">${errorMessage}</small>
            <button class="btn-primary" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 500; transition: all 0.2s; box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 20px rgba(102, 126, 234, 0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 16px rgba(102, 126, 234, 0.3)';" onclick="showComponentLibraryContent(document.querySelector('.project-content'), ${JSON.stringify(project).replace(/"/g, '&quot;')})">
                Retry Discovery
            </button>
        </div>
    `;
}

function showWorkflowsContent(contentArea, project) {
    // Get real workflows from project data or use empty array
    const workflows = project.workflows || [];
    
    // Generate workflow cards from real data
    const workflowCards = workflows.map(workflow => {
        const workflowPreview = generateWorkflowPreview(workflow);
        const isDefault = workflow.isDefault ? ' default-workflow' : '';
        
        return `
            <div class="workflow-card${isDefault}" onclick="openWorkflowEditor('${project.id}', '${workflow.id}')">
                <div class="workflow-preview">
                    ${workflowPreview}
                </div>
                <h3>${workflow.name}</h3>
                <p>${workflow.description}</p>
                <div class="workflow-meta">
                    <span class="component-count">${workflow.componentCount} components</span>
                    <span class="step-count">${workflow.steps.length} steps</span>
                    ${workflow.isDefault ? '<span class="default-badge">Default</span>' : ''}
                </div>
            </div>
        `;
    }).join('');
    
    // Show empty state if no workflows, or display real workflows
    const workflowsContent = workflows.length === 0 ? `
        <div class="workflow-card empty-workflow" onclick="createNewWorkflow('${project.id}')">
            <div class="empty-workflow-content">
                <div class="empty-icon">⚡</div>
                <h3>Create Your First Workflow</h3>
                <p>Design user flows by connecting your components</p>
            </div>
        </div>
    ` : workflowCards;
    
    contentArea.innerHTML = `
        <div class="workflows-container">
            <div class="workflows-header">
                <div class="workflows-title-section">
                    <h2>Workflows</h2>
                    <p>Compose screens and user flows using your components</p>
                </div>
                <button class="create-workflow-btn" onclick="createNewWorkflow('${project.id}')">
                    + New Workflow
                </button>
            </div>
            
            <div class="workflows-grid">
                ${workflowsContent}
            </div>
        </div>
    `;
}

/**
 * Generate workflow preview from workflow steps (PURE FUNCTION)
 * @param {Object} workflow - Workflow object
 * @returns {string} HTML string for workflow preview
 */
function generateWorkflowPreview(workflow) {
    const steps = workflow.steps || [];
    
    if (steps.length === 0) {
        return '<div class="workflow-step">Empty Workflow</div>';
    }
    
    return steps
        .sort((a, b) => a.order - b.order)
        .map((step, index) => {
            const isLast = index === steps.length - 1;
            return `
                <div class="workflow-step">${step.screen || step.component}</div>
                ${isLast ? '' : '<div class="workflow-arrow">→</div>'}
            `;
        })
        .join('');
}

function createProjectViewerModal(projectId) {
    const modal = document.createElement('div');
    modal.id = 'project-viewer';
    modal.className = 'project-viewer-modal';
    modal.dataset.projectId = projectId;
    modal.innerHTML = `
        <div class="project-viewer-modal-content">
            <div class="project-viewer-header">
                <div class="project-viewer-title-section">
                    <h3 class="project-viewer-title">Project Viewer</h3>
                </div>
                <div class="project-viewer-tabs">
                    <button class="project-tab active" data-tab="component-library" onclick="switchProjectTab('component-library')" title="Component Library">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px; margin-right: 0.5rem;">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                        </svg>
                        Components
                    </button>
                    <button class="project-tab" data-tab="workflows" onclick="switchProjectTab('workflows')" title="Workflows">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px; margin-right: 0.5rem;">
                            <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"></polygon>
                        </svg>
                        Workflows
                    </button>
                </div>
                <button class="close-project-viewer-btn" onclick="closeProjectViewer()" title="Close Project Viewer">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="project-content">
                <!-- Content will be dynamically loaded here -->
            </div>
        </div>
    `;
    return modal;
}

function closeProjectViewer() {
    const modal = document.getElementById('project-viewer');
    if (modal) {
        modal.classList.remove('show');
        // Clean up any iframes
        const iframe = modal.querySelector('.project-iframe');
        if (iframe) {
            iframe.srcdoc = '';
        }
        
        // NOTE: We intentionally DO NOT cleanup terminals here
        // so they persist between project viewer sessions
        console.log('📝 Project viewer closed, terminals preserved for later use');
    }
}

// Workflow Management Functions
function createNewWorkflow(projectId) {
    console.log('Creating new workflow for project:', projectId);
    
    // For now, show a simple prompt for workflow name
    const workflowName = prompt('Enter workflow name:');
    if (workflowName) {
        openWorkflowEditor(projectId, 'new', workflowName);
    }
}

function openWorkflowEditor(projectId, workflowId, workflowName = null) {
    console.log('Opening workflow preview:', projectId, workflowId);
    
    const project = appState.projects.find(p => p.id === projectId);
    if (!project) {
        alert('Project not found');
        return;
    }
    
    const workflow = project.workflows?.find(w => w.id === workflowId);
    if (!workflow) {
        alert('Workflow not found');
        return;
    }
    
    if (workflow.isDefault) {
        // For default "Landing Page" workflow, show the actual React app
        openWorkflowPreview(project, workflow);
    } else {
        // For custom workflows, show editor (future implementation)
        const displayName = workflowName || workflow.name || 'Workflow';
        alert(`Workflow Editor: "${displayName}"\n\nThis will open a drag-and-drop canvas where you can:\n- Drag components from your library\n- Connect them to create user flows\n- Define navigation and interactions\n- Preview the complete workflow\n\n(Coming in next phase!)`);
    }
}

/**
 * Open workflow preview showing actual React app (ASYNC FUNCTION)
 * @param {Object} project - Project object
 * @param {Object} workflow - Workflow object
 */
async function openWorkflowPreview(project, workflow) {
    // Create or get existing modal
    let modal = document.getElementById('workflow-preview-modal');
    if (!modal) {
        modal = createWorkflowPreviewModal();
        document.body.appendChild(modal);
    }
    
    // Update modal content
    const modalTitle = modal.querySelector('.workflow-preview-title');
    const modalContent = modal.querySelector('.workflow-preview-content');
    
    if (modalTitle) {
        modalTitle.textContent = `${workflow.name} - ${project.name}`;
    }
    
    // Show loading first
    modalContent.innerHTML = `
        <div class="workflow-loading">
            <div class="loading-spinner"></div>
            <p>Loading workflow preview...</p>
        </div>
    `;
    
    modal.classList.add('show');
    
    // Generate preview content based on workflow type
    try {
        if (workflow.isDefault && workflow.name === 'Landing Page') {
            const previewContent = await generateLandingPagePreview(project, workflow);
            modalContent.innerHTML = previewContent;
        } else {
            modalContent.innerHTML = generateGenericWorkflowPreview(project, workflow);
        }
    } catch (error) {
        console.error('Error generating workflow preview:', error);
        modalContent.innerHTML = `
            <div class="server-error">
                <h3>Error loading preview</h3>
                <p>Failed to load workflow preview: ${error.message}</p>
                <button class="btn-primary" onclick="closeWorkflowPreview()">Close</button>
            </div>
        `;
    }
}

/**
 * Create workflow preview modal (PURE FUNCTION)
 * @returns {HTMLElement} Modal element
 */
function createWorkflowPreviewModal() {
    const modal = document.createElement('div');
    modal.id = 'workflow-preview-modal';
    modal.className = 'workflow-preview-modal';
    modal.innerHTML = `
        <div class="workflow-preview-modal-content">
            <div class="workflow-preview-header">
                <h3 class="workflow-preview-title">Workflow Preview</h3>
                <button class="close-workflow-preview-btn" onclick="closeWorkflowPreview()">&times;</button>
            </div>
            <div class="workflow-preview-content">
                <!-- Preview content will be loaded here -->
            </div>
        </div>
    `;
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeWorkflowPreview();
        }
    });
    
    return modal;
}

/**
 * Generate Landing Page preview content using pre-started dev server (ASYNC FUNCTION)
 * @param {Object} project - Project object
 * @param {Object} workflow - Workflow object  
 * @returns {string} HTML content for preview
 */
async function generateLandingPagePreview(project, workflow) {
    const step = workflow.steps[0];
    
    // Get server status from our state management
    const serverState = getProjectServerState(project.id);
    let serverUrl = serverState.url;
    let serverStatus = serverState.status;
    
    // Convert our status to expected format
    switch (serverState.status) {
        case SERVER_STATUS.READY:
            serverStatus = 'running';
            break;
        case SERVER_STATUS.STARTING:
            serverStatus = 'starting';
            break;
        case SERVER_STATUS.FAILED:
            serverStatus = 'failed';
            break;
        default:
            serverStatus = 'starting';
            // If server isn't started yet, trigger background start
            startProjectServerBackground(project.id);
    }
    
    return `
        <div class="workflow-preview-container">
            <div class="workflow-step-info">
                <div class="step-header">
                    <span class="step-badge">Step 1</span>
                    <h4>${step.screen || step.component}</h4>
                </div>
                <p>${step.description || workflow.description}</p>
            </div>
            
            <div class="app-preview-frame">
                <div class="browser-chrome">
                    <div class="browser-controls">
                        <span class="browser-dot red"></span>
                        <span class="browser-dot yellow"></span>
                        <span class="browser-dot green"></span>
                    </div>
                    <div class="browser-address">${serverUrl ? new URL(serverUrl).host : 'starting...'}</div>
                </div>
                <div class="app-preview-content" id="live-preview-${project.id}">
                    ${generatePreviewContent(serverUrl, serverStatus, project)}
                </div>
            </div>
            
            <div class="workflow-actions">
                <button class="btn-secondary" onclick="closeWorkflowPreview()">Close</button>
                <button class="btn-primary" onclick="openProjectInBrowser('${project.id}')">Open in Browser</button>
                <button class="btn-secondary" onclick="stopProjectServer('${project.id}')">Stop Server</button>
            </div>
        </div>
    `;
}

/**
 * Generate preview content based on server status (PURE FUNCTION)
 * @param {string|null} serverUrl - React dev server URL
 * @param {string} serverStatus - Server status (running, starting, failed)
 * @param {Object} project - Project object
 * @returns {string} HTML content for preview area
 */
function generatePreviewContent(serverUrl, serverStatus, project) {
    switch (serverStatus) {
        case 'running':
            return `<iframe src="${serverUrl}" frameborder="0" style="width: 100%; height: 500px; background: white;"></iframe>`;
        
        case 'starting':
            return `
                <div class="server-loading">
                    <div class="loading-spinner"></div>
                    <p>Starting React dev server for ${project.name}...</p>
                    <small>This may take 10-30 seconds</small>
                </div>
            `;
        
        case 'failed':
            return `
                <div class="server-error">
                    <h3>Failed to start React dev server</h3>
                    <p>Could not start the development server for ${project.name}</p>
                    <button class="btn-primary" onclick="retryStartServer('${project.id}')">Retry</button>
                </div>
            `;
        
        default:
            return `
                <div class="server-loading">
                    <p>Loading preview for ${project.name}...</p>
                </div>
            `;
    }
}

/**
 * Generate generic workflow preview (PURE FUNCTION)
 * @param {Object} project - Project object
 * @param {Object} workflow - Workflow object
 * @returns {string} HTML content for generic workflow
 */
function generateGenericWorkflowPreview(project, workflow) {
    const stepsHtml = workflow.steps
        .sort((a, b) => a.order - b.order)
        .map((step, index) => `
            <div class="workflow-step-card">
                <div class="step-number">${index + 1}</div>
                <div class="step-details">
                    <h4>${step.screen || step.component}</h4>
                    <p>${step.description || 'Workflow step'}</p>
                </div>
            </div>
        `).join('');
    
    return `
        <div class="generic-workflow-preview">
            <div class="workflow-info">
                <h4>${workflow.name}</h4>
                <p>${workflow.description}</p>
                <div class="workflow-stats">
                    <span class="stat">${workflow.steps.length} steps</span>
                    <span class="stat">${workflow.componentCount} components</span>
                </div>
            </div>
            <div class="workflow-steps">
                ${stepsHtml}
            </div>
            <div class="workflow-actions">
                <button class="btn-secondary" onclick="closeWorkflowPreview()">Close</button>
                <button class="btn-primary" onclick="editWorkflow('${project.id}', '${workflow.id}')">Edit Workflow</button>
            </div>
        </div>
    `;
}

function closeWorkflowPreview() {
    const modal = document.getElementById('workflow-preview-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

async function openProjectInBrowser(projectId) {
    try {
        console.log('Opening project in browser:', projectId);
        
        const statusResult = await window.electronAPI.getProjectServerStatus(projectId);
        if (statusResult.success && statusResult.status === 'running' && statusResult.url) {
            // Server is running, open in default browser
            window.open(statusResult.url, '_blank');
        } else {
            alert('React dev server is not running. Please start the server first by opening the workflow preview.');
        }
    } catch (error) {
        console.error('Error opening project in browser:', error);
        alert('Failed to open project in browser: ' + error.message);
    }
}

async function stopProjectServer(projectId) {
    try {
        console.log('Stopping React dev server:', projectId);
        
        const result = await window.electronAPI.stopProjectServer(projectId);
        if (result.success) {
            // Update preview content to show server stopped
            const previewContainer = document.getElementById(`live-preview-${projectId}`);
            if (previewContainer) {
                previewContainer.innerHTML = `
                    <div class="server-stopped">
                        <p>React dev server stopped</p>
                        <button class="btn-primary" onclick="retryStartServer('${projectId}')">Start Server</button>
                    </div>
                `;
            }
            console.log('✅ React dev server stopped successfully');
        } else {
            alert('Failed to stop server: ' + result.error);
        }
    } catch (error) {
        console.error('Error stopping project server:', error);
        alert('Failed to stop server: ' + error.message);
    }
}

async function retryStartServer(projectId) {
    try {
        console.log('Retrying React dev server start:', projectId);
        
        const previewContainer = document.getElementById(`live-preview-${projectId}`);
        if (previewContainer) {
            previewContainer.innerHTML = `
                <div class="server-loading">
                    <div class="loading-spinner"></div>
                    <p>Starting React dev server...</p>
                    <small>This may take 10-30 seconds</small>
                </div>
            `;
        }
        
        const result = await window.electronAPI.startProjectServer(projectId);
        if (result.success) {
            // Server started, update preview
            if (previewContainer) {
                previewContainer.innerHTML = `<iframe src="${result.url}" frameborder="0" style="width: 100%; height: 500px; background: white;"></iframe>`;
            }
            console.log('✅ React dev server started successfully');
        } else {
            if (previewContainer) {
                previewContainer.innerHTML = `
                    <div class="server-error">
                        <h3>Failed to start React dev server</h3>
                        <p>Error: ${result.error}</p>
                        <button class="btn-primary" onclick="retryStartServer('${projectId}')">Retry</button>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error retrying server start:', error);
        const previewContainer = document.getElementById(`live-preview-${projectId}`);
        if (previewContainer) {
            previewContainer.innerHTML = `
                <div class="server-error">
                    <h3>Error</h3>
                    <p>${error.message}</p>
                    <button class="btn-primary" onclick="retryStartServer('${projectId}')">Retry</button>
                </div>
            `;
        }
    }
}

function editWorkflow(projectId, workflowId) {
    console.log('Editing workflow:', projectId, workflowId);
    alert('Workflow Editor coming in next phase!\n\nThis will open a drag-and-drop interface for editing workflows.');
}

// Legacy function for backward compatibility
function closeStorybookViewer() {
    closeProjectViewer();
}

async function deleteProject(projectId) {
    const project = appState.projects.find(p => p.id === projectId);
    const projectName = project ? project.name : 'this project';
    
    const confirmMessage = `⚠️ DELETE PROJECT: ${projectName}

This will permanently delete:
• All project files and folders from your computer
• node_modules directory (can be large, 100MB+)
• Source code, components, and assets
• Project configuration (.mcp.json, package.json, etc.)
• Any unsaved changes

This action cannot be undone.

Are you sure you want to continue?`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    try {
        // Remove from backend
        const result = await removeProjectFromBackend(projectId);
        
        if (result.success) {
            // Remove from local state
            appState.projects = appState.projects.filter(p => p.id !== projectId);
            updateProjectsDisplay();
            console.log('🗑️ Project deleted:', projectId);
        } else {
            alert('Failed to delete project: ' + result.error);
        }
    } catch (error) {
        console.error('Failed to delete project:', error);
        alert('Failed to delete project: ' + error.message);
    }
}

// Settings Management Functions

function openSettingsModal() {
    document.getElementById('settings-modal').classList.add('show');
    loadCurrentSettings();
}

function closeSettingsModal() {
    document.getElementById('settings-modal').classList.remove('show');
}

function switchSettingsTab(tabId) {
    // Update tab buttons
    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabId);
    });
    
    // Update tab content
    document.querySelectorAll('.settings-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === `${tabId}-settings`);
    });
}

async function loadCurrentSettings() {
    try {
        const result = await window.electronAPI.getSettings();
        
        if (result.success) {
            const settings = result.settings;
            
            // General settings
            document.getElementById('projects-directory').value = settings.projectsDirectory || '';
            document.getElementById('default-template').value = settings.defaultTemplate || 'react-storybook';
            
            // Development settings
            document.getElementById('dev-port-start').value = settings.devPortStart || 3000;
            document.getElementById('dev-port-end').value = settings.devPortEnd || 3999;
            document.getElementById('auto-open-browser').checked = settings.autoOpenBrowser || false;
            
            // Advanced settings
            document.getElementById('enable-dev-tools').checked = settings.enableDevTools !== false;
            document.getElementById('max-recent-projects').value = settings.maxRecentProjects || 20;
        }
    } catch (error) {
        console.error('Failed to load settings:', error);
        alert('Failed to load settings: ' + error.message);
    }
}

async function chooseProjectsDirectory() {
    try {
        const result = await window.electronAPI.chooseDirectory();
        
        if (result.success) {
            document.getElementById('projects-directory').value = result.directory;
        } else if (!result.canceled) {
            alert('Failed to choose directory: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Failed to choose directory:', error);
        alert('Failed to choose directory: ' + error.message);
    }
}

async function saveSettings() {
    try {
        const settings = {
            projectsDirectory: document.getElementById('projects-directory').value,
            defaultTemplate: document.getElementById('default-template').value,
            devPortStart: parseInt(document.getElementById('dev-port-start').value),
            devPortEnd: parseInt(document.getElementById('dev-port-end').value),
            autoOpenBrowser: document.getElementById('auto-open-browser').checked,
            enableDevTools: document.getElementById('enable-dev-tools').checked,
            maxRecentProjects: parseInt(document.getElementById('max-recent-projects').value)
        };
        
        // Validate port range
        if (settings.devPortStart >= settings.devPortEnd) {
            alert('Port start must be less than port end');
            return;
        }
        
        if (settings.devPortStart < 1000 || settings.devPortEnd > 65535) {
            alert('Ports must be between 1000 and 65535');
            return;
        }
        
        if (!settings.projectsDirectory) {
            alert('Projects directory is required');
            return;
        }
        
        const result = await window.electronAPI.saveSettings(settings);
        
        if (result.success) {
            closeSettingsModal();
            // Show success message briefly
            const successMsg = document.createElement('div');
            successMsg.innerHTML = '✅ Settings saved successfully';
            successMsg.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #4caf50;
                color: white;
                padding: 1rem;
                border-radius: 6px;
                z-index: 9999;
                font-weight: 500;
            `;
            document.body.appendChild(successMsg);
            setTimeout(() => successMsg.remove(), 3000);
            console.log('✅ Settings saved successfully');
        } else {
            alert('Failed to save settings: ' + result.error);
        }
    } catch (error) {
        console.error('Failed to save settings:', error);
        alert('Failed to save settings: ' + error.message);
    }
}

async function resetToDefaults() {
    if (!confirm('Are you sure you want to reset all settings to their default values?')) {
        return;
    }
    
    try {
        const result = await window.electronAPI.resetSettings();
        
        if (result.success) {
            loadCurrentSettings(); // Reload the form with default values
            // Show success message briefly
            const successMsg = document.createElement('div');
            successMsg.innerHTML = '✅ Settings reset to defaults';
            successMsg.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #667eea;
                color: white;
                padding: 1rem;
                border-radius: 6px;
                z-index: 9999;
                font-weight: 500;
            `;
            document.body.appendChild(successMsg);
            setTimeout(() => successMsg.remove(), 3000);
            console.log('✅ Settings reset to defaults');
        } else {
            alert('Failed to reset settings: ' + result.error);
        }
    } catch (error) {
        console.error('Failed to reset settings:', error);
        alert('Failed to reset settings: ' + error.message);
    }
}

// =====================================================
// TERMINAL INTEGRATION (CLAUDE CODE + XTERM.JS)
// =====================================================

// Terminal state management
let activeTerminals = new Map(); // Map of project IDs to terminal instances

/**
 * Show terminal content in project viewer (ASYNC FUNCTION)
 * @param {Element} contentArea - Content area element
 * @param {Object} project - Project object
 */
async function showTerminalContent(contentArea, project) {
    // Check if terminal already exists for this project
    const existingTerminal = activeTerminals.get(project.id);
    
    if (existingTerminal && existingTerminal.domElement) {
        console.log(`♻️ Reusing existing terminal DOM for project ${project.name}`);
        
        // Simply move the existing DOM element (preserves terminal state completely)
        contentArea.innerHTML = '';
        contentArea.appendChild(existingTerminal.domElement);
        
        // Refit terminal if addon is available
        if (existingTerminal.fitAddonInstance) {
            setTimeout(() => {
                existingTerminal.fitAddonInstance.fit();
            }, 100);
        }
        
        // Refocus terminal
        if (existingTerminal.terminal) {
            existingTerminal.terminal.focus();
        }
        
        console.log(`✅ Terminal DOM reused for project ${project.name}`);
    } else if (existingTerminal) {
        console.log(`♻️ Reattaching terminal to new DOM for project ${project.name}`);
        
        // Create new DOM structure but reuse terminal instance
        const terminalContainer = document.createElement('div');
        terminalContainer.className = 'terminal-container';
        terminalContainer.innerHTML = `
            <div class="terminal-header">
                <div class="terminal-title">
                    <span>💻</span>
                    <span>Claude Terminal - ${project.name}</span>
                </div>
                <div class="terminal-controls">
                    <button class="terminal-btn" onclick="clearTerminal('${project.id}')">Clear</button>
                    <button class="terminal-btn" onclick="restartTerminal('${project.id}')">Restart</button>
                </div>
            </div>
            <div class="terminal-content" id="terminal-${project.id}">
                <!-- Terminal will be reattached here -->
            </div>
        `;
        
        contentArea.innerHTML = '';
        contentArea.appendChild(terminalContainer);
        
        // Store the DOM element for future reuse
        existingTerminal.domElement = terminalContainer;
        
        // Reattach terminal to new DOM element
        const terminalElement = document.getElementById(`terminal-${project.id}`);
        if (terminalElement && existingTerminal.terminal) {
            existingTerminal.terminal.open(terminalElement);
            
            // Refit terminal if addon is available
            if (existingTerminal.fitAddonInstance) {
                setTimeout(() => {
                    existingTerminal.fitAddonInstance.fit();
                }, 100);
            }
            
            // Refocus terminal
            existingTerminal.terminal.focus();
            console.log(`✅ Terminal reattached for project ${project.name}`);
        }
    } else {
        console.log(`🆕 Creating new terminal for project ${project.name}`);
        
        // Show terminal container with loading state for new terminal
        contentArea.innerHTML = `
            <div class="terminal-container">
                <div class="terminal-header">
                    <div class="terminal-title">
                        <span>💻</span>
                        <span>Claude Terminal - ${project.name}</span>
                    </div>
                    <div class="terminal-controls">
                        <button class="terminal-btn" onclick="clearTerminal('${project.id}')">Clear</button>
                        <button class="terminal-btn" onclick="restartTerminal('${project.id}')">Restart</button>
                    </div>
                </div>
                <div class="terminal-content" id="terminal-${project.id}">
                    <div class="terminal-loading">
                        <div class="loading-spinner"></div>
                        <p>Starting Claude Terminal...</p>
                        <small>Initializing Claude Code in ${project.name}</small>
                    </div>
                </div>
            </div>
        `;
        
        // Initialize new terminal after a short delay to ensure DOM is ready
        setTimeout(() => initializeTerminal(project), 100);
    }
}

/**
 * Initialize xterm.js terminal with Claude Code (ASYNC FUNCTION)
 * @param {Object} project - Project object
 */
async function initializeTerminal(project) {
    try {
        // Use globally available xterm objects
        if (!window.Terminal) {
            throw new Error('xterm Terminal class not found in global scope');
        }
        
        const Terminal = window.Terminal;
        let fitAddonInstance = null;
        
        // Try to create FitAddon if available
        if (window.FitAddon) {
            try {
                // Check if FitAddon is a constructor or a factory
                
                if (typeof window.FitAddon === 'function') {
                    fitAddonInstance = new window.FitAddon();
                } else if (typeof window.FitAddon === 'object' && window.FitAddon.FitAddon) {
                    fitAddonInstance = new window.FitAddon.FitAddon();
                } else {
                    console.warn('FitAddon structure not recognized:', window.FitAddon);
                }
            } catch (error) {
                console.warn('Could not create FitAddon:', error);
            }
        } else {
            console.warn('FitAddon not available globally');
        }
        
        // Create terminal instance
        const terminal = new Terminal({
            fontFamily: "'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace",
            fontSize: 14,
            lineHeight: 1.2,
            theme: {
                background: '#1a1a1a',
                foreground: '#ffffff',
                cursor: '#667eea',
                black: '#1a1a1a',
                red: '#ff6b6b',
                green: '#51cf66',
                yellow: '#ffd93d',
                blue: '#667eea',
                magenta: '#a78bfa',
                cyan: '#22d3ee',
                white: '#ffffff',
                brightBlack: '#333333',
                brightRed: '#ff8787',
                brightGreen: '#69db7c',
                brightYellow: '#ffe066',
                brightBlue: '#7c3aed',
                brightMagenta: '#b794f6',
                brightCyan: '#67e8f9',
                brightWhite: '#ffffff'
            },
            cursorBlink: true,
            cursorStyle: 'block',
            scrollback: 1000,
            tabStopWidth: 4
        });
        
        // Load fit addon if available
        if (fitAddonInstance) {
            terminal.loadAddon(fitAddonInstance);
        }
        
        // Get terminal container and open terminal
        const terminalElement = document.getElementById(`terminal-${project.id}`);
        if (!terminalElement) {
            console.error('Terminal element not found');
            return;
        }
        
        // Clear loading state and open terminal
        terminalElement.innerHTML = '';
        terminal.open(terminalElement);
        
        // Focus the terminal to receive keyboard input
        terminal.focus();
        console.log('🎯 Terminal focused and ready for input');
        
        // Set up data handlers BEFORE starting PTY process
        let pid = null;
        
        // Test if the IPC listener is working at all
        console.log('🔧 Testing IPC listener setup...');
        console.log('onPtyData method available:', typeof window.electronAPI.onPtyData);
        
        const cleanupData = window.electronAPI.onPtyData((eventData) => {
            console.log('🎯 RECEIVED IPC pty:data event:', eventData);
            const { pid: dataPid, data } = eventData;
            
            if (dataPid === pid && terminal) {
                console.log(`📥 PTY->Terminal: PID ${dataPid}, Data: "${data.replace(/\r/g, '\\r').replace(/\n/g, '\\n')}"`);
                terminal.write(data);
            } else {
                console.log(`⚠️ Ignoring data: dataPid=${dataPid}, expectedPid=${pid}, hasTerminal=${!!terminal}`);
            }
        });
        
        const cleanupExit = window.electronAPI.onPtyExit(({ pid: exitPid }) => {
            if (exitPid === pid) {
                terminal.write('\r\n\r\n[Process exited]\r\n');
                cleanupData();
                cleanupExit();
                activeTerminals.delete(project.id);
            }
        });
        
        // Handle terminal input (send keystrokes to PTY)
        terminal.onData((data) => {
            if (pid) {
                console.log(`📤 Terminal->PTY: PID ${pid}, Data: "${data.replace(/\r/g, '\\r').replace(/\n/g, '\\n')}" (charCodes: [${Array.from(data).map(c => c.charCodeAt(0)).join(', ')}])`);
                try {
                    window.electronAPI.ptyWrite(pid, data);
                    console.log('✅ IPC ptyWrite call successful');
                    
                    // Also test if the IPC method exists
                    if (!window.electronAPI.ptyWrite) {
                        console.error('❌ window.electronAPI.ptyWrite is not defined!');
                    }
                } catch (error) {
                    console.error('❌ IPC ptyWrite error:', error);
                    console.error('❌ Available electronAPI methods:', Object.keys(window.electronAPI));
                }
            } else {
                console.warn('⚠️ Terminal input received but no PTY PID available');
            }
        });
        
        // Fit terminal to container if addon is available
        if (fitAddonInstance) {
            fitAddonInstance.fit();
        }
        
        // NOW start PTY process with shell (which will show prompt and allow claude command)
        console.log('Starting PTY process in:', project.path);
        pid = await window.electronAPI.ptyStart({
            cwd: project.path,
            cmd: 'shell' // This will start a shell instead of trying to launch claude directly
        });
        
        // Auto-configure Figma MCP server after terminal starts
        setTimeout(() => {
            if (pid && terminal) {
                console.log('🎨 Auto-configuring Figma MCP server...');
                // Send the MCP add command to the terminal
                const mcpCommand = 'claude mcp add --transport sse figma-dev-mode-mcp-server http://127.0.0.1:3845/sse\r';
                window.electronAPI.ptyWrite(pid, mcpCommand);
                
                // Add a newline and clear for better UX
                setTimeout(() => {
                    window.electronAPI.ptyWrite(pid, 'clear\r');
                    terminal.write('\r\n✅ Figma MCP server configured automatically\r\n');
                    terminal.write('💡 Type "claude --continue" to start Claude Code with MCP integration\r\n\r\n');
                }, 2000);
            }
        }, 1500); // Wait for shell to be ready
        
        // Store terminal instance with DOM element for persistence
        const terminalContainer = terminalElement.closest('.terminal-container');
        activeTerminals.set(project.id, {
            terminal,
            fitAddonInstance,
            pid,
            project,
            domElement: terminalContainer // Store the container for reuse
        });
        
        // Handle window resize
        const resizeObserver = new ResizeObserver(() => {
            if (fitAddonInstance) {
                fitAddonInstance.fit();
                window.electronAPI.ptyResize(pid, terminal.cols, terminal.rows);
            }
        });
        resizeObserver.observe(terminalElement);
        
        // Handle tab visibility for proper resize
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && fitAddonInstance) {
                setTimeout(() => {
                    fitAddonInstance.fit();
                    window.electronAPI.ptyResize(pid, terminal.cols, terminal.rows);
                }, 100);
            }
        });
        
        console.log(`✅ Terminal initialized for project ${project.name} with PID ${pid}`);
        
    } catch (error) {
        console.error('Failed to initialize terminal:', error);
        const terminalElement = document.getElementById(`terminal-${project.id}`);
        if (terminalElement) {
            terminalElement.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: #ff6b6b;">
                    <h3>Terminal Failed to Start</h3>
                    <p>Error: ${error.message}</p>
                    <button class="btn-primary" onclick="showTerminalContent(document.querySelector('.project-content'), ${JSON.stringify(project).replace(/"/g, '&quot;')})">
                        Retry
                    </button>
                </div>
            `;
        }
    }
}

/**
 * Clear terminal output (UTILITY FUNCTION)
 * @param {string} projectId - Project ID
 */
function clearTerminal(projectId) {
    const terminalInfo = activeTerminals.get(projectId);
    if (terminalInfo) {
        terminalInfo.terminal.clear();
    }
}

/**
 * Restart terminal process (ASYNC FUNCTION)
 * @param {string} projectId - Project ID  
 */
async function restartTerminal(projectId) {
    const terminalInfo = activeTerminals.get(projectId);
    if (terminalInfo) {
        // Kill existing process
        await window.electronAPI.ptyKill(terminalInfo.pid);
        
        // Clear terminal
        terminalInfo.terminal.clear();
        terminalInfo.terminal.write('Restarting Claude Terminal...\r\n');
        
        // Start new process
        try {
            const newPid = await window.electronAPI.ptyStart({
                cwd: terminalInfo.project.path,
                cmd: 'claude'
            });
            
            // Update stored PID
            terminalInfo.pid = newPid;
            
            // Set up data handlers for new process
            const cleanupData = window.electronAPI.onPtyData(({ pid, data }) => {
                if (pid === newPid) {
                    terminalInfo.terminal.write(data);
                }
            });
            
            const cleanupExit = window.electronAPI.onPtyExit(({ pid }) => {
                if (pid === newPid) {
                    terminalInfo.terminal.write('\r\n\r\n[Process exited]\r\n');
                    cleanupData();
                    cleanupExit();
                }
            });
            
            // Handle input
            terminalInfo.terminal.onData((data) => {
                window.electronAPI.ptyWrite(newPid, data);
            });
            
        } catch (error) {
            terminalInfo.terminal.write(`\r\nFailed to restart: ${error.message}\r\n`);
        }
    }
}

/**
 * Cleanup terminal when project viewer closes (CLEANUP FUNCTION)
 */
function cleanupTerminals() {
    for (const [projectId, terminalInfo] of activeTerminals.entries()) {
        if (terminalInfo.pid) {
            window.electronAPI.ptyKill(terminalInfo.pid);
        }
        if (terminalInfo.terminal) {
            terminalInfo.terminal.dispose();
        }
    }
    activeTerminals.clear();
}

// Cleanup terminals when project viewer is closed
const originalCloseProjectViewerForCleanup = window.closeProjectViewer;
window.closeProjectViewer = function() {
    cleanupTerminals();
    if (originalCloseProjectViewerForCleanup) {
        originalCloseProjectViewerForCleanup();
    }
};

/**
 * Terminal Sidebar Management - Phase 2 Implementation
 */

// Terminal sidebar state
let terminalSidebarState = {
    isOpen: false,
    width: 400,
    minWidth: 300,
    maxWidth: 800,
    globalTerminal: null,
    globalPid: null,
    isClaudeReady: false,
    isInitializing: false
};

/**
 * Toggle terminal sidebar visibility
 */
function toggleTerminalSidebar() {
    const sidebar = document.getElementById('terminal-sidebar');
    const headerTerminalBtn = document.getElementById('header-terminal-btn');
    const projectTerminalBtn = document.getElementById('project-terminal-btn');
    
    if (!sidebar) return;
    
    terminalSidebarState.isOpen = !terminalSidebarState.isOpen;
    
    if (terminalSidebarState.isOpen) {
        sidebar.classList.remove('hidden');
        
        // Update both terminal button titles
        if (headerTerminalBtn) {
            headerTerminalBtn.title = 'Close Terminal';
        }
        if (projectTerminalBtn) {
            projectTerminalBtn.title = 'Close Terminal';
        }
        
        // Initialize terminal if not already done
        if (!terminalSidebarState.globalTerminal) {
            initializeGlobalTerminal();
        }
    } else {
        sidebar.classList.add('hidden');
        
        // Update both terminal button titles
        if (headerTerminalBtn) {
            headerTerminalBtn.title = 'Toggle Terminal';
        }
        if (projectTerminalBtn) {
            projectTerminalBtn.title = 'Toggle Terminal';
        }
    }
}

/**
 * Initialize global terminal in sidebar
 */
async function initializeGlobalTerminal() {
    console.log('🖥️ Initializing global terminal in sidebar...');
    
    const terminalContent = document.getElementById('terminal-sidebar-content');
    if (!terminalContent) return;
    
    try {
        // Show loading state
        terminalContent.innerHTML = `
            <div class="terminal-loading">
                <div class="loading-spinner"></div>
                <p>Starting terminal...</p>
            </div>
        `;
        
        // Update state and indicators
        terminalSidebarState.isInitializing = true;
        terminalSidebarState.isClaudeReady = false;
        updateTerminalReadyState();
        
        // Create xterm instance
        const terminal = new window.Terminal({
            theme: {
                background: '#1a1a1a',
                foreground: '#ffffff',
                cursor: '#ffffff',
                selection: '#4b5563',
                black: '#1a1a1a',
                red: '#ef4444',
                green: '#10b981',
                yellow: '#f59e0b',
                blue: '#3b82f6',
                magenta: '#8b5cf6',
                cyan: '#06b6d4',
                white: '#f3f4f6',
                brightBlack: '#374151',
                brightRed: '#f87171',
                brightGreen: '#34d399',
                brightYellow: '#fbbf24',
                brightBlue: '#60a5fa',
                brightMagenta: '#a78bfa',
                brightCyan: '#22d3ee',
                brightWhite: '#ffffff'
            },
            fontFamily: "'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace",
            fontSize: 13,
            lineHeight: 1.4,
            cursorBlink: true,
            cursorStyle: 'block',
            allowTransparency: true
        });
        
        // Create fit addon with proper detection
        let fitAddon;
        if (typeof window.FitAddon === 'function') {
            fitAddon = new window.FitAddon();
        } else if (typeof window.FitAddon === 'object' && window.FitAddon.FitAddon) {
            fitAddon = new window.FitAddon.FitAddon();
        } else {
            console.warn('FitAddon structure not recognized:', window.FitAddon);
            throw new Error('FitAddon not available');
        }
        terminal.loadAddon(fitAddon);
        
        // Clear loading and create terminal container
        terminalContent.innerHTML = '';
        const terminalContainer = document.createElement('div');
        terminalContainer.style.width = '100%';
        terminalContainer.style.height = '100%';
        terminalContainer.style.padding = '0.5rem';
        terminalContent.appendChild(terminalContainer);
        
        // Open terminal
        terminal.open(terminalContainer);
        fitAddon.fit();
        terminal.focus();
        
        // Get current working directory - default to home or fallback
        const cwd = getCurrentWorkingDirectory() || '/';
        
        // Start PTY process with context information
        let ptyResult = await window.electronAPI.ptyStart({
            cwd: cwd,
            cmd: 'bash',  // Start with bash shell
            context: {
                currentView: appContext.currentView,
                activeProject: appContext.activeProject,
                activeTab: appContext.activeTab,
                terminalType: 'global_sidebar',
                initializationType: 'user_initiated'
            }
        });
        
        // If bash fails, try sh with same context
        if (!ptyResult.success) {
            ptyResult = await window.electronAPI.ptyStart({
                cwd: cwd,
                cmd: 'sh',
                context: {
                    currentView: appContext.currentView,
                    activeProject: appContext.activeProject,
                    activeTab: appContext.activeTab,
                    terminalType: 'global_sidebar',
                    initializationType: 'fallback_shell'
                }
            });
        }
        
        // If still failing, try without specifying command
        if (!ptyResult.success) {
            ptyResult = await window.electronAPI.ptyStart({
                cwd: cwd
            });
        }
        
        console.log('PTY start result:', ptyResult);
        
        // Handle different PTY result formats
        const pid = typeof ptyResult === 'number' ? ptyResult : ptyResult.pid;
        const success = typeof ptyResult === 'number' ? true : ptyResult.success;
        
        if (success && pid) {
            console.log(`✅ Global terminal PTY started with PID: ${pid}`);
            
            // Store global terminal info
            terminalSidebarState.globalTerminal = terminal;
            terminalSidebarState.globalPid = pid;
            terminalSidebarState.isInitializing = true;
            terminalSidebarState.isClaudeReady = false;
            
            // Auto-configure Figma MCP server if we're in a project directory
            setTimeout(() => {
                if (pid && terminal && getCurrentWorkingDirectory() !== '/') {
                    console.log('🎨 Auto-configuring Figma MCP server in global terminal...');
                    // Send the MCP add command to the terminal
                    const mcpCommand = 'claude mcp add --transport sse figma-dev-mode-mcp-server http://127.0.0.1:3845/sse\r';
                    window.electronAPI.ptyWrite(pid, mcpCommand);
                    
                    // Clear and show helpful message
                    setTimeout(() => {
                        window.electronAPI.ptyWrite(pid, 'clear\r');
                        terminal.write('\r\n✅ Figma MCP server configured automatically\r\n');
                        terminal.write('💡 Type "claude --continue" to start Claude Code with MCP integration\r\n\r\n');
                    }, 2000);
                }
            }, 1500); // Wait for shell to be ready
            
            // Set up data flow: PTY -> Terminal with Claude readiness detection
            const dataCleanup = window.electronAPI.onPtyData((data) => {
                if (data.pid === terminalSidebarState.globalPid) {
                    terminal.write(data.data);
                    
                    // Detect when Claude Code is ready - look for specific ready indicators
                    if (!terminalSidebarState.isClaudeReady && 
                        (data.data.includes('Welcome to Claude Code') || 
                         data.data.includes('/help for help') ||
                         data.data.includes('Run claude --continue') ||
                         data.data.includes('cwd:'))) { // Current working directory indicates ready
                        
                        terminalSidebarState.isClaudeReady = true;
                        terminalSidebarState.isInitializing = false;
                        console.log('🎉 Claude Code is ready for input!');
                        updateTerminalReadyState();
                        
                        // Don't add extra messages - Claude Code already shows its welcome
                    }
                }
            });
            
            // Set up data flow: Terminal -> PTY
            terminal.onData((data) => {
                if (terminalSidebarState.globalPid) {
                    window.electronAPI.ptyWrite(terminalSidebarState.globalPid, data);
                }
            });
            
            // Handle terminal resize
            terminal.onResize(({ cols, rows }) => {
                if (terminalSidebarState.globalPid) {
                    window.electronAPI.ptyResize(terminalSidebarState.globalPid, cols, rows);
                }
            });
            
            // Handle window resize
            window.addEventListener('resize', () => {
                if (terminalSidebarState.isOpen) {
                    setTimeout(() => fitAddon.fit(), 100);
                }
            });
            
            // Fit terminal when sidebar is resized
            const resizeObserver = new ResizeObserver(() => {
                if (terminalSidebarState.isOpen) {
                    setTimeout(() => fitAddon.fit(), 50);
                }
            });
            resizeObserver.observe(terminalContent);
            
            // Auto-start Claude Code if it's not already running
            setTimeout(() => {
                // Only run MCP setup and claude --continue if Claude hasn't started automatically
                if (!terminalSidebarState.isClaudeReady && !terminalSidebarState.isInitializing) {
                    console.log('🚀 Auto-starting Claude Code with MCP setup...');
                    terminalSidebarState.isInitializing = true;
                    updateTerminalReadyState();
                    // First add the Figma MCP server
                    window.electronAPI.ptyWrite(pid, 'claude mcp add --transport sse figma-dev-mode-mcp-server http://127.0.0.1:3845/sse\r');
                    // Wait a moment, then start Claude
                    setTimeout(() => {
                        window.electronAPI.ptyWrite(pid, 'claude --continue\r');
                    }, 1000);
                }
            }, 3000); // Give more time to detect if Claude auto-started
            
        } else {
            const error = typeof ptyResult === 'object' ? ptyResult.error : 'Unknown error';
            throw new Error(`Failed to start terminal: ${error}`);
        }
        
    } catch (error) {
        console.error('❌ Failed to initialize global terminal:', error);
        terminalContent.innerHTML = `
            <div class="terminal-loading">
                <h3 style="color: #ef4444;">Terminal Error</h3>
                <p style="color: #ccc;">Failed to start terminal: ${error.message}</p>
                <button onclick="initializeGlobalTerminal()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Retry
                </button>
            </div>
        `;
    }
}

/**
 * Update terminal ready state indicators
 */
function updateTerminalReadyState() {
    const terminalStatus = document.getElementById('terminal-status');
    if (terminalStatus) {
        const indicator = terminalStatus.querySelector('.status-indicator');
        
        if (terminalSidebarState.isClaudeReady) {
            indicator.className = 'status-indicator claude-ready-indicator';
            indicator.style.backgroundColor = '#4caf50';
            terminalStatus.title = 'Claude Ready';
            // Add a celebration effect
            setTimeout(() => {
                indicator.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    indicator.style.transform = 'scale(1)';
                }, 200);
            }, 100);
        } else if (terminalSidebarState.isInitializing) {
            indicator.className = 'status-indicator';
            indicator.style.backgroundColor = '#ff9800';
            indicator.style.transform = 'scale(1)';
            terminalStatus.title = 'Loading Terminal...';
        } else if (terminalSidebarState.globalPid) {
            indicator.className = 'status-indicator';
            indicator.style.backgroundColor = '#2196f3';
            indicator.style.transform = 'scale(1)';
            terminalStatus.title = 'Terminal Active';
        } else {
            indicator.className = 'status-indicator inactive';
            indicator.style.transform = 'scale(1)';
            terminalStatus.title = 'Terminal Inactive';
        }
    }
    
    // Update terminal sidebar header if needed
    const terminalTitle = document.querySelector('.terminal-sidebar-title');
    if (terminalTitle) {
        if (terminalSidebarState.isClaudeReady) {
            terminalTitle.title = 'Claude Ready';
        } else if (terminalSidebarState.isInitializing) {
            terminalTitle.title = 'Starting Claude...';
        } else {
            terminalTitle.title = 'Terminal';
        }
    }
}

/**
 * Clear terminal content
 */
function clearTerminal() {
    if (terminalSidebarState.globalTerminal) {
        terminalSidebarState.globalTerminal.clear();
    }
}

/**
 * Restart terminal session
 */
async function restartTerminal() {
    console.log('🔄 Restarting global terminal...');
    
    // Kill existing terminal
    if (terminalSidebarState.globalPid) {
        try {
            await window.electronAPI.ptyKill(terminalSidebarState.globalPid);
        } catch (error) {
            console.warn('Failed to kill existing terminal:', error);
        }
    }
    
    // Dispose terminal
    if (terminalSidebarState.globalTerminal) {
        terminalSidebarState.globalTerminal.dispose();
    }
    
    // Reset state
    terminalSidebarState.globalTerminal = null;
    terminalSidebarState.globalPid = null;
    terminalSidebarState.isClaudeReady = false;
    terminalSidebarState.isInitializing = false;
    updateTerminalReadyState();
    
    // Reinitialize
    await initializeGlobalTerminal();
}

/**
 * Get current working directory based on context
 */
function getCurrentWorkingDirectory() {
    // Use active project from context system
    if (appContext.activeProject && appContext.activeProject.path) {
        console.log('🏠 Using project directory:', appContext.activeProject.path);
        return appContext.activeProject.path;
    }
    
    // Fallback: check if we're on project view page
    const projectView = document.getElementById('project-view');
    if (projectView && projectView.style.display !== 'none') {
        const projectTitle = document.getElementById('project-title');
        if (projectTitle) {
            const projectName = projectTitle.textContent;
            const project = appState.projects.find(p => p.name === projectName);
            if (project && project.path) {
                console.log('🏠 Using fallback project directory:', project.path);
                return project.path;
            }
        }
    }
    
    console.log('🏠 No project context, using default directory');
    // Default to user home or current directory
    return null;
}

/**
 * Initialize sidebar resize functionality
 */
function initializeSidebarResize() {
    const resizeHandle = document.getElementById('sidebar-resize-handle');
    const sidebar = document.getElementById('terminal-sidebar');
    
    if (!resizeHandle || !sidebar) return;
    
    let isResizing = false;
    let startX = 0;
    let startWidth = 0;
    
    resizeHandle.addEventListener('mousedown', (e) => {
        isResizing = true;
        startX = e.clientX;
        startWidth = terminalSidebarState.width;
        
        document.addEventListener('mousemove', handleResize);
        document.addEventListener('mouseup', stopResize);
        document.body.style.cursor = 'col-resize';
        e.preventDefault();
    });
    
    function handleResize(e) {
        if (!isResizing) return;
        
        const deltaX = startX - e.clientX;
        const newWidth = Math.max(
            terminalSidebarState.minWidth,
            Math.min(terminalSidebarState.maxWidth, startWidth + deltaX)
        );
        
        terminalSidebarState.width = newWidth;
        sidebar.style.width = newWidth + 'px';
    }
    
    function stopResize() {
        isResizing = false;
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', stopResize);
        document.body.style.cursor = '';
        
        // Fit terminal after resize
        if (terminalSidebarState.globalTerminal && terminalSidebarState.isOpen) {
            setTimeout(() => {
                const fitAddon = terminalSidebarState.globalTerminal._addonManager._addons.find(
                    addon => addon.instance.constructor.name === 'FitAddon'
                );
                if (fitAddon) {
                    fitAddon.instance.fit();
                }
            }, 50);
        }
    }
}

/**
 * Global keyboard shortcuts - Phase 4 Implementation
 */
function setupGlobalKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl+` or Cmd+` to toggle terminal
        if ((e.ctrlKey || e.metaKey) && e.key === '`') {
            e.preventDefault();
            toggleTerminalSidebar();
        }
        
        // Ctrl+N or Cmd+N to create new project
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            if (appContext.currentView === 'dashboard') {
                openCreateProjectModal();
            }
        }
        
        // Ctrl+, or Cmd+, to open settings
        if ((e.ctrlKey || e.metaKey) && e.key === ',') {
            e.preventDefault();
            openSettingsModal();
        }
        
        // Escape to close modals or go back
        if (e.key === 'Escape') {
            // Go back to dashboard from project view
            if (appContext.currentView === 'project-viewer') {
                showDashboard();
            }
            // Close settings
            else if (appContext.currentView === 'settings') {
                enhancedCloseSettingsModal();
            }
            // Close create project modal
            else if (document.getElementById('create-project-modal').classList.contains('show')) {
                closeCreateProjectModal();
            }
        }
        
        // Ctrl+1, Ctrl+2 for tab switching in project viewer
        if ((e.ctrlKey || e.metaKey) && appContext.currentView === 'project-viewer') {
            if (e.key === '1') {
                e.preventDefault();
                showProjectTab('component-library');
            } else if (e.key === '2') {
                e.preventDefault();
                showProjectTab('workflows');
            }
        }
    });
}

/**
 * Context Management System - Phase 3 Implementation
 */

// Prevent recursive updates
let isUpdatingContext = false;

/**
 * Update application context and notify terminal
 */
function updateAppContext(updates) {
    // Prevent infinite loops
    if (isUpdatingContext) {
        return;
    }
    
    const previousContext = { ...appContext };
    
    // Check if there are actual changes to prevent unnecessary updates
    let hasChanges = false;
    for (const [key, value] of Object.entries(updates)) {
        if (JSON.stringify(appContext[key]) !== JSON.stringify(value)) {
            hasChanges = true;
            break;
        }
    }
    
    if (!hasChanges) {
        console.log('🔄 No context changes detected, skipping update');
        return; // No actual changes, skip update
    }
    
    console.log('✅ Context changes detected, proceeding with update');
    
    isUpdatingContext = true;
    
    try {
        Object.assign(appContext, updates);
        
        // Log only significant context changes
        const changedKeys = Object.keys(updates);
        const significantKeys = changedKeys.filter(key => 
            !key.includes('breadcrumbs') && !key.includes('recentActions')
        );
        
        // Disable context logging for now to reduce noise
        // if (significantKeys.length > 0) {
        //     console.log('📝 Context updated:', significantKeys.join(', '));
        // }
        
        // Update terminal working directory if project changed
        if (updates.activeProject && updates.activeProject !== previousContext.activeProject) {
            updateTerminalContext();
        }
        
        // Update breadcrumbs only if view/project changed
        if (updates.currentView || updates.activeProject || updates.activeTab) {
            updateBreadcrumbsAndStatus();
        }
        
        // Emit context change event for other components
        if (significantKeys.length > 0) {
            window.dispatchEvent(new CustomEvent('contextChange', { 
                detail: { previous: previousContext, current: appContext, updates } 
            }));
        }
    } finally {
        isUpdatingContext = false;
    }
}

/**
 * Update terminal working directory based on current context
 */
function updateTerminalContext() {
    const project = appContext.activeProject;
    if (project && project.path) {
        appContext.terminalCwd = project.path;
        console.log(`📁 Terminal context updated to: ${project.path}`);
        // No longer sending cd commands to terminal - using .env file approach instead
    } else {
        appContext.terminalCwd = null;
    }
}

/**
 * Update breadcrumbs and status bar without triggering context updates
 */
function updateBreadcrumbsAndStatus() {
    // Calculate breadcrumbs without modifying appContext
    const breadcrumbs = ['Home'];
    
    if (appContext.currentView === 'project-viewer' && appContext.activeProject) {
        breadcrumbs.push(appContext.activeProject.name);
        if (appContext.activeTab) {
            breadcrumbs.push(appContext.activeTab.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()));
        }
    } else if (appContext.currentView === 'settings') {
        breadcrumbs.push('Settings');
    }
    
    // Update breadcrumbs DOM directly
    const breadcrumbsElement = document.getElementById('breadcrumbs');
    if (breadcrumbsElement) {
        breadcrumbsElement.innerHTML = breadcrumbs
            .map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                if (isLast) {
                    return `<span class="breadcrumb-item">${crumb}</span>`;
                } else {
                    return `<span class="breadcrumb-item">${crumb}</span><span class="breadcrumb-separator">›</span>`;
                }
            })
            .join('');
    }
    
    // Update terminal status
    const terminalStatus = document.getElementById('terminal-status');
    if (terminalStatus) {
        const indicator = terminalStatus.querySelector('.status-indicator');
        
        if (terminalSidebarState.globalPid) {
            indicator.className = 'status-indicator';
            terminalStatus.title = 'Terminal Active';
        } else {
            indicator.className = 'status-indicator inactive';
            terminalStatus.title = 'Terminal Inactive';
        }
    }
    
    // Update server status
    const serverStatus = document.getElementById('server-status');
    if (serverStatus) {
        const indicator = serverStatus.querySelector('.status-indicator');
        
        if (appContext.serverStatus.running) {
            indicator.className = 'status-indicator';
            serverStatus.title = `Server Active :${appContext.serverStatus.port}`;
        } else {
            indicator.className = 'status-indicator inactive';
            serverStatus.title = 'Server Inactive';
        }
    }
    
    // Update context info
    const contextInfo = document.getElementById('context-info');
    if (contextInfo) {
        if (appContext.activeProject) {
            contextInfo.title = `Project: ${appContext.activeProject.name}`;
        } else {
            contextInfo.title = 'Context Ready';
        }
    }
    
    // Store breadcrumbs in appContext without triggering updates
    appContext.breadcrumbs = breadcrumbs;
}

/**
 * Track user action for context awareness
 */
function trackAction(action, data = {}) {
    const actionEntry = {
        timestamp: Date.now(),
        action,
        data,
        context: {
            view: appContext.currentView,
            project: appContext.activeProject?.name,
            tab: appContext.activeTab
        }
    };
    
    appContext.recentActions.unshift(actionEntry);
    
    // Keep only last 50 actions
    if (appContext.recentActions.length > 50) {
        appContext.recentActions = appContext.recentActions.slice(0, 50);
    }
    
    // Only log very important actions to reduce noise
    const significantActions = ['create_project', 'open_project'];
    if (significantActions.includes(action)) {
        console.log('🎯 Action tracked:', action);
    }
}

/**
 * Get current context for AI/Agent consumption
 */
function getContextForAI() {
    return {
        currentView: appContext.currentView,
        activeProject: appContext.activeProject ? {
            name: appContext.activeProject.name,
            template: appContext.activeProject.templateId,
            status: appContext.activeProject.status
        } : null,
        activeTab: appContext.activeTab,
        terminalCwd: appContext.terminalCwd,
        breadcrumbs: appContext.breadcrumbs,
        recentActions: appContext.recentActions.slice(0, 10), // Last 10 actions
        serverStatus: appContext.serverStatus
    };
}

// Track last terminal environment to avoid unnecessary updates
let lastTerminalEnvironment = null;

/**
 * Update project environment file with context variables
 */
async function updateProjectEnvironment() {
    const project = appContext.activeProject;
    if (!project || !project.path) return;
    
    // Create environment signature to check if update is needed
    const currentEnvSignature = {
        projectId: project.id,
        currentView: appContext.currentView,
        activeTab: appContext.activeTab,
        currentFile: appContext.currentFile
    };
    
    // Only update if environment actually changed
    if (lastTerminalEnvironment && 
        JSON.stringify(lastTerminalEnvironment) === JSON.stringify(currentEnvSignature)) {
        console.log('📋 Environment unchanged, skipping update');
        return; // No changes, skip update
    }
    
    console.log('📝 Environment changed, updating .claude-env file:', {
        from: lastTerminalEnvironment,
        to: currentEnvSignature
    });
    
    try {
        // Prepare environment variables for the .claude-env file
        const envVars = {
            PROJECT_NAME: project.name,
            PROJECT_ID: project.id,
            PROJECT_TEMPLATE: project.templateId || '',
            PROJECT_PATH: project.path,
            CURRENT_VIEW: appContext.currentView,
            ACTIVE_TAB: appContext.activeTab || '',
        };
        
        if (appContext.currentFile) {
            envVars.CURRENT_FILE = appContext.currentFile;
        }
        
        // Update the environment file via IPC
        const result = await window.electronAPI.updateProjectEnv(project.path, envVars);
        
        if (result.success) {
            // Update last environment state
            lastTerminalEnvironment = currentEnvSignature;
            console.log('🌍 Project environment file updated with context variables');
        } else {
            console.error('Failed to update project environment:', result.error);
        }
    } catch (error) {
        console.error('Error updating project environment:', error);
    }
}

/**
 * Enhanced project viewer that updates context, shows project page, and auto-starts dev server
 */
function enhancedOpenProjectViewer(projectId) {
    const project = appState.projects.find(p => p.id === projectId);
    if (!project) return;
    
    // Update context using functional approach
    console.log('🔄 Updating context for project:', project.name);
    updateAppContext({
        currentView: 'project-viewer',
        activeProject: project,
        activeTab: 'component-library'
    });
    
    trackAction('open_project', { projectId, projectName: project.name });
    
    // Create initial environment file for Claude Code context
    updateProjectEnvironment();
    
    // Show project page immediately (don't wait for server)
    showProjectPage(project);
    
    // Start dev server in background (non-blocking)
    startProjectServerBackground(projectId);
}


/**
 * Enhanced settings modal that updates context
 */
const originalOpenSettingsModal = window.openSettingsModal;
function openSettingsModal() {
    updateAppContext({
        currentView: 'settings',
        activeProject: null,
        activeTab: null
    });
    
    trackAction('open_settings');
    
    if (originalOpenSettingsModal) {
        return originalOpenSettingsModal();
    }
}

/**
 * Enhanced close functions that update context
 */
/**
 * Enhanced navigation functions
 */
function showDashboard() {
    updateAppContext({
        currentView: 'dashboard',
        activeProject: null,
        activeTab: null
    });
    
    trackAction('close_project');
    
    // Show dashboard view and hide project view
    document.getElementById('dashboard-view').style.display = 'flex';
    document.getElementById('project-view').style.display = 'none';
    
    // Show dashboard header
    const header = document.querySelector('.header');
    if (header) {
        header.style.display = 'flex';
    }
}

function showProjectPage(project) {
    console.log('📖 Showing project page for:', project.name);
    console.log('📝 Current context project:', appContext.activeProject?.name);
    
    // Update project title
    const projectTitleElement = document.getElementById('project-title');
    if (projectTitleElement) {
        projectTitleElement.textContent = project.name;
    }
    
    // Hide dashboard view and dashboard header, show project view
    document.getElementById('dashboard-view').style.display = 'none';
    document.getElementById('project-view').style.display = 'flex';
    
    // Hide dashboard header since project has its own header
    const header = document.querySelector('.header');
    if (header) {
        header.style.display = 'none';
    }
    
    // Ensure context is updated before loading content
    if (appContext.activeProject !== project) {
        console.warn('Project context mismatch, updating...');
        updateAppContext({ activeProject: project });
    }
    
    // Wait a bit for context to settle, then load content
    setTimeout(() => {
        console.log('📝 Final context project:', appContext.activeProject?.name);
        showProjectTab('component-library');
    }, 10);
}

function showProjectTab(tabId) {
    // Update tab buttons
    document.querySelectorAll('.project-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabId);
    });
    
    // Update context
    updateAppContext({ activeTab: tabId });
    trackAction('switch_tab', { tabId });
    
    // Load tab content
    const contentArea = document.getElementById('project-content');
    const project = appContext.activeProject;
    
    if (!project) {
        console.error('No active project found for tab switching');
        return;
    }
    
    if (tabId === 'component-library') {
        showComponentLibraryContent(contentArea, project);
    } else if (tabId === 'workflows') {
        showWorkflowsContent(contentArea, project);
    }
    
    // Update project environment file when tab changes (only if project context exists)
    if (appContext.activeProject) {
        updateProjectEnvironment();
    }
}

function enhancedCloseSettingsModal() {
    updateAppContext({
        currentView: 'dashboard'
    });
    
    trackAction('close_settings');
    
    // Call original close logic
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

/**
 * Override global functions to add context awareness
 */
function setupContextAwareness() {
    // Override global functions
    window.openProjectViewer = enhancedOpenProjectViewer;
    window.enhancedOpenProjectViewer = enhancedOpenProjectViewer; // Expose for onclick
    window.switchProjectTab = showProjectTab;
    window.showProjectTab = showProjectTab;
    window.showDashboard = showDashboard;
    window.showProjectPage = showProjectPage;
    window.openSettingsModal = openSettingsModal;
    window.closeSettingsModal = enhancedCloseSettingsModal;
    
    // Listen for context changes to update project environment
    window.addEventListener('contextChange', (event) => {
        const { updates } = event.detail;
        if (updates.activeProject) {
            updateProjectEnvironment();
        }
    });
    
    console.log('🧠 Context awareness system initialized');
}


// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    initializeSidebarResize();
    setupGlobalKeyboardShortcuts();
    setupContextAwareness();
    serverManager.addServerCleanupHandlers();
});