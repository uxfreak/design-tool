const createDefaultWorkflow = require('./createDefaultWorkflow');
const addWorkflowToProject = require('./addWorkflowToProject');

function createProjectWithDefaultWorkflow(projectConfig) {
  try {
    const workflow = createDefaultWorkflow(projectConfig);
    const projectData = addWorkflowToProject(projectConfig, workflow);
    return { success: true, project: projectData, workflow };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = createProjectWithDefaultWorkflow;
