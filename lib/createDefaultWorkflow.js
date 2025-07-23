function createDefaultWorkflow(projectConfig) {
  return {
    id: `${projectConfig.id}_landing`,
    name: 'Landing Page',
    description: 'Default welcome page workflow',
    steps: [
      {
        id: 'step_1',
        component: 'App',
        screen: 'Welcome Page',
        order: 0,
        description: 'Main application landing page'
      }
    ],
    componentCount: 1,
    isDefault: true,
    createdAt: new Date().toISOString()
  };
}

module.exports = createDefaultWorkflow;
