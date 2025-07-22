/**
 * Design Tool - Phase 2 Application Logic
 * Following functional programming principles and Generative Analysis specification
 */

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
    openProjects: new Map() // Track opened projects with Component Library viewer
};

// Pure function constants
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
        
        // Render projects
        const displayData = createProjectDisplayData(appState.projects, appState.currentView);
        projectsDisplay.innerHTML = displayData.map(renderProjectCard).join('');
    }
}

function renderProjectCard(project) {
    const statusStyle = `color: ${project.statusDisplay.color}`;
    const isCreating = project.status === 'CREATING';
    const isOpening = project.status === 'OPENING';
    const isRunning = project.status === 'RUNNING';
    
    return `
        <div class="project-card" data-project-id="${project.id}">
            <div onclick="openProject('${project.id}')" style="cursor: ${isCreating ? 'default' : 'pointer'}; flex: 1;">
                <div class="project-name">${project.name}</div>
                <div class="project-meta">
                    ${project.templateDisplay} • Created ${project.displayCreatedAt}
                </div>
                <div class="project-status" style="${statusStyle}">
                    ${project.statusDisplay.text}
                </div>
            </div>
            <div class="project-actions" style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                <button 
                    onclick="openProject('${project.id}')" 
                    ${isCreating || isOpening ? 'disabled' : ''} 
                    style="background: ${isCreating || isOpening ? '#ccc' : (isRunning ? '#4caf50' : '#667eea')}; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: ${isCreating || isOpening ? 'not-allowed' : 'pointer'}; font-size: 0.8rem;">
                    ${isRunning ? 'View Project' : 'Open'}
                </button>
                <button 
                    onclick="deleteProject('${project.id}')" 
                    ${isCreating || isOpening ? 'disabled' : ''} 
                    style="background: ${isCreating || isOpening ? '#ccc' : '#f44336'}; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: ${isCreating || isOpening ? 'not-allowed' : 'pointer'}; font-size: 0.8rem;">
                    Delete
                </button>
            </div>
        </div>
    `;
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
        submitBtn.textContent = 'Create Project';
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
    submitBtn.textContent = 'Creating...';
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
    openProjectViewerModal(projectId);
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
        // Discover real components from project
        const result = await window.electronAPI.discoverComponents(project.id);
        
        if (result.success) {
            const componentLibraryContent = generateComponentLibraryHTML(result, project);
            contentArea.innerHTML = `<iframe src="data:text/html;charset=utf-8,${encodeURIComponent(componentLibraryContent)}" class="project-iframe"></iframe>`;
        } else {
            contentArea.innerHTML = generateComponentLibraryError(result.error, project);
        }
        
    } catch (error) {
        console.error('Failed to discover components:', error);
        contentArea.innerHTML = generateComponentLibraryError(error.message, project);
    }
}

/**
 * Generate Component Library HTML from discovered components (PURE FUNCTION)
 * @param {Object} discoveryResult - Result from component discovery
 * @param {Object} project - Project object
 * @returns {string} HTML content
 */
function generateComponentLibraryHTML(discoveryResult, project) {
    const { components, totalComponents, totalVariants } = discoveryResult;
    
    const componentsHTML = components.length > 0 
        ? components.map(generateComponentCard).join('')
        : generateNoComponentsCard();
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Component Library - ${project.name}</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; margin: 0; background: #1a1a1a; color: #ffffff; }
                .storybook-container { padding: 2rem; }
                .storybook-header { text-align: center; margin-bottom: 3rem; }
                .storybook-logo { font-size: 3rem; margin-bottom: 1rem; }
                .project-name { font-size: 2rem; color: #ffffff; margin-bottom: 0.5rem; font-weight: 300; letter-spacing: -0.02em; }
                .demo-text { color: #ccc; font-size: 1.1rem; margin-bottom: 0.5rem; }
                .stats-text { color: #888; font-size: 0.95rem; }
                .components-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 2rem; max-width: 1200px; margin: 0 auto; }
                .component-card { background: #2a2a2a; padding: 2rem; border-radius: 12px; border: 1px solid #333; box-shadow: 0 4px 16px rgba(0,0,0,0.3); transition: all 0.2s; }
                .component-card:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(102, 126, 234, 0.2); border-color: #667eea; }
                .component-title { font-size: 1.4rem; font-weight: 600; color: #ffffff; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem; }
                .component-file-path { color: #888; font-size: 0.85rem; margin-bottom: 1rem; font-family: 'SF Mono', Monaco, monospace; background: #1f1f1f; padding: 0.25rem 0.5rem; border-radius: 4px; border: 1px solid #333; }
                .component-description { color: #ccc; margin-bottom: 1.5rem; line-height: 1.5; }
                .component-variants { margin-top: 1.5rem; }
                .variants-title { font-weight: 600; color: #ffffff; margin-bottom: 0.75rem; }
                .variants-list { display: flex; flex-wrap: wrap; gap: 0.5rem; }
                .variant-badge { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.8rem; font-weight: 500; box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3); }
                .no-variants { color: #888; font-style: italic; }
                .no-components-card { text-align: center; padding: 3rem 2rem; background: #2a2a2a; border: 1px solid #333; }
                .no-components-icon { font-size: 4rem; margin-bottom: 1rem; opacity: 0.3; filter: grayscale(1); }
                .refresh-btn { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 500; margin-top: 1rem; transition: all 0.2s; box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3); }
                .refresh-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4); }
                
                /* Sparkle animation for components with variants */
                .component-title .variant-sparkle {
                    animation: sparkle 2s ease-in-out infinite;
                    filter: hue-rotate(45deg);
                }
                
                @keyframes sparkle {
                    0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.8; }
                    50% { transform: scale(1.2) rotate(180deg); opacity: 1; }
                }
                
                /* Gradient border for components with variants */
                .component-card.has-variants {
                    border: 1px solid transparent;
                    background: linear-gradient(#2a2a2a, #2a2a2a) padding-box,
                                linear-gradient(135deg, #667eea, #764ba2) border-box;
                }
                
                .component-card.has-variants:hover {
                    background: linear-gradient(#2a2a2a, #2a2a2a) padding-box,
                                linear-gradient(135deg, #667eea, #764ba2, #667eea) border-box;
                }
            </style>
        </head>
        <body>
            <div class="storybook-container">
                <div class="storybook-header">
                    <div class="storybook-logo">🧩</div>
                    <h1 class="project-name">${project.name}</h1>
                    <p class="demo-text">Live Component Library</p>
                    <p class="stats-text">${totalComponents} components • ${totalVariants} variants</p>
                </div>
                
                <div class="components-grid">
                    ${componentsHTML}
                </div>
            </div>
        </body>
        </html>
    `;
}

/**
 * Generate component card HTML (PURE FUNCTION)
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

function createProjectViewerModal() {
    const modal = document.createElement('div');
    modal.id = 'project-viewer';
    modal.className = 'project-viewer-modal';
    modal.innerHTML = `
        <div class="project-viewer-modal-content">
            <div class="project-viewer-header">
                <div class="project-viewer-title-section">
                    <h3 class="project-viewer-title">Project Viewer</h3>
                </div>
                <div class="project-viewer-tabs">
                    <button class="project-tab active" data-tab="component-library" onclick="switchProjectTab('component-library')">
                        🧩 Component Library
                    </button>
                    <button class="project-tab" data-tab="workflows" onclick="switchProjectTab('workflows')">
                        ⚡ Workflows
                    </button>
                </div>
                <button class="close-project-viewer-btn" onclick="closeProjectViewer()">&times;</button>
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
    
    modalTitle.textContent = `${workflow.name} - ${project.name}`;
    
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
 * Generate Landing Page preview content with live React dev server (ASYNC FUNCTION)
 * @param {Object} project - Project object
 * @param {Object} workflow - Workflow object  
 * @returns {string} HTML content for preview
 */
async function generateLandingPagePreview(project, workflow) {
    const step = workflow.steps[0];
    
    // Try to get or start the React dev server
    let serverUrl = null;
    let serverStatus = 'loading';
    
    try {
        // Check if server is already running
        const statusResult = await window.electronAPI.getProjectServerStatus(project.id);
        if (statusResult.success && statusResult.status === 'running') {
            serverUrl = statusResult.url;
            serverStatus = 'running';
        } else {
            // Start the server
            serverStatus = 'starting';
            const startResult = await window.electronAPI.startProjectServer(project.id);
            if (startResult.success) {
                serverUrl = startResult.url;
                serverStatus = 'running';
            } else {
                serverStatus = 'failed';
                console.error('Failed to start React dev server:', startResult.error);
            }
        }
    } catch (error) {
        console.error('Error managing React dev server:', error);
        serverStatus = 'failed';
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
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);