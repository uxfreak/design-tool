function validateProjectPath(projectPath) {
  if (!projectPath || typeof projectPath !== 'string') {
    return { success: false, error: 'Project path is required' };
  }
  const invalidChars = /[<>:"|?*]/;
  if (invalidChars.test(projectPath)) {
    return { success: false, error: 'Project path contains invalid characters' };
  }
  return { success: true, value: projectPath };
}

module.exports = validateProjectPath;
