export function createServerManager({ appState, appContext }) {
  const SERVER_STATUS = {
    STOPPED: 'stopped',
    STARTING: 'starting',
    READY: 'ready',
    FAILED: 'failed'
  };

  function createProjectServerState(projectId) {
    return {
      projectId,
      status: SERVER_STATUS.STOPPED,
      url: null,
      port: null,
      pid: null,
      startTime: null,
      lastError: null
    };
  }

  function updateProjectServerState(projectId, updates) {
    const currentState = appState.projectServers.get(projectId) || createProjectServerState(projectId);
    const newState = { ...currentState, ...updates };
    appState.projectServers.set(projectId, newState);
    updateServerStatusIndicator(newState);
    return newState;
  }

  function getProjectServerState(projectId) {
    return appState.projectServers.get(projectId) || createProjectServerState(projectId);
  }

  function isServerReady(projectId) {
    const state = getProjectServerState(projectId);
    return state.status === SERVER_STATUS.READY && state.url;
  }

  async function startProjectServerBackground(projectId) {
    console.log('🚀 Starting dev server in background for project:', projectId);
    updateProjectServerState(projectId, {
      status: SERVER_STATUS.STARTING,
      startTime: Date.now()
    });
    try {
      const statusResult = await window.electronAPI.getProjectServerStatus(projectId);
      if (statusResult.success && statusResult.status === 'running') {
        console.log('✅ Server already running for project:', projectId);
        updateProjectServerState(projectId, {
          status: SERVER_STATUS.READY,
          url: statusResult.url,
          port: statusResult.port,
          pid: statusResult.pid
        });
        return;
      }
      const startResult = await window.electronAPI.startProjectServer(projectId);
      if (startResult.success) {
        console.log('✅ Server started successfully for project:', projectId);
        updateProjectServerState(projectId, {
          status: SERVER_STATUS.READY,
          url: startResult.url,
          port: startResult.port,
          pid: startResult.pid
        });
        enableLiveFeatures(projectId);
      } else {
        console.error('❌ Server failed to start for project:', projectId, startResult.error);
        updateProjectServerState(projectId, {
          status: SERVER_STATUS.FAILED,
          lastError: startResult.error
        });
      }
    } catch (error) {
      console.error('❌ Error starting server for project:', projectId, error);
      updateProjectServerState(projectId, {
        status: SERVER_STATUS.FAILED,
        lastError: error.message
      });
    }
  }

  function updateServerStatusIndicator(serverState) {
    const serverIndicator = document.querySelector('#server-status .status-indicator');
    if (!serverIndicator) return;
    serverIndicator.className = 'status-indicator';
    switch (serverState.status) {
      case SERVER_STATUS.STARTING:
        serverIndicator.classList.add('inactive');
        serverIndicator.parentElement.title = 'Dev server starting...';
        break;
      case SERVER_STATUS.READY:
        serverIndicator.classList.add('active');
        serverIndicator.parentElement.title = `Dev server ready (${serverState.url})`;
        break;
      case SERVER_STATUS.FAILED:
        serverIndicator.classList.add('error');
        serverIndicator.parentElement.title = `Dev server failed: ${serverState.lastError}`;
        break;
      default:
        serverIndicator.classList.add('inactive');
        serverIndicator.parentElement.title = 'Dev server stopped';
    }
  }

  function enableLiveFeatures(projectId) {
    console.log('🎉 Enabling live features for project:', projectId);
    addLivePreviewButtons(projectId);
    enableInstantWorkflowPreviews(projectId);
    showServerReadyNotification(projectId);
  }

  function addLivePreviewButtons(projectId) {
    console.log('📝 TODO: Add live preview buttons for components');
  }

  function enableInstantWorkflowPreviews(projectId) {
    const workflowCards = document.querySelectorAll('.workflow-card');
    workflowCards.forEach(card => {
      if (!card.classList.contains('empty-workflow')) {
        card.classList.add('server-ready');
      }
    });
  }

  function showServerReadyNotification(projectId) {
    console.log('✨ Server ready for instant previews');
  }

  function addServerCleanupHandlers() {
    const originalShowDashboard = window.showDashboard;
    if (originalShowDashboard) {
      window.showDashboard = function() {
        scheduleServerCleanup();
        return originalShowDashboard.call(this);
      };
    }
    window.addEventListener('beforeunload', () => {
      stopAllProjectServers();
    });
  }

  function scheduleServerCleanup() {
    setTimeout(() => {
      if (appContext.currentView === 'dashboard') {
        console.log('🧹 Cleaning up inactive project servers');
        stopAllProjectServers();
      }
    }, 5 * 60 * 1000);
  }

  async function stopAllProjectServers() {
    const serverPromises = [];
    for (const [projectId, serverState] of appState.projectServers) {
      if (serverState.status === SERVER_STATUS.READY || serverState.status === SERVER_STATUS.STARTING) {
        console.log('🛑 Stopping server for project:', projectId);
        serverPromises.push(stopProjectServer(projectId));
      }
    }
    await Promise.all(serverPromises);
    appState.projectServers.clear();
  }

  async function stopProjectServer(projectId) {
    try {
      const result = await window.electronAPI.stopProjectServer(projectId);
      if (result.success) {
        updateProjectServerState(projectId, {
          status: SERVER_STATUS.STOPPED,
          url: null,
          port: null,
          pid: null
        });
        console.log('✅ Server stopped for project:', projectId);
      } else {
        console.error('❌ Failed to stop server for project:', projectId, result.error);
      }
    } catch (error) {
      console.error('❌ Error stopping server for project:', projectId, error);
    }
  }

  function handleServerFailure(projectId, error) {
    console.error('🚨 Server failure for project:', projectId, error);
    updateProjectServerState(projectId, {
      status: SERVER_STATUS.FAILED,
      lastError: error
    });
    showServerErrorNotification(projectId, error);
  }

  function showServerErrorNotification(projectId, error) {
    const workflowCards = document.querySelectorAll('.workflow-card');
    workflowCards.forEach(card => {
      card.classList.remove('server-ready');
      card.classList.add('server-error');
    });
  }

  function retryServerStart(projectId) {
    console.log('🔄 Retrying server start for project:', projectId);
    startProjectServerBackground(projectId);
  }

  return {
    SERVER_STATUS,
    createProjectServerState,
    updateProjectServerState,
    getProjectServerState,
    isServerReady,
    startProjectServerBackground,
    updateServerStatusIndicator,
    enableLiveFeatures,
    addLivePreviewButtons,
    enableInstantWorkflowPreviews,
    showServerReadyNotification,
    addServerCleanupHandlers,
    scheduleServerCleanup,
    stopAllProjectServers,
    stopProjectServer,
    handleServerFailure,
    showServerErrorNotification,
    retryServerStart
  };
}
