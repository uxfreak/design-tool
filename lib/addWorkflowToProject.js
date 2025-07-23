function addWorkflowToProject(project, workflow) {
  return {
    ...project,
    workflows: [...(project.workflows || []), workflow],
    lastModified: new Date().toISOString(),
  };
}

module.exports = addWorkflowToProject;
