const PROJECT_CREATION_STEPS = {
  PLANNING: 'Planning project structure',
  SCAFFOLDING: 'Creating files and directories',
  INSTALLING: 'Installing dependencies',
  CONFIGURING: 'Configuring development tools',
  READY: 'Project ready for development'
};

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
    steps,
    currentStep: 0,
    overallProgress: 0
  };
}

module.exports = {
  createProjectPlan,
  PROJECT_CREATION_STEPS
};
