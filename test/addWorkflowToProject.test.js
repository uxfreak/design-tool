const { expect } = require('chai');
const addWorkflowToProject = require('../lib/addWorkflowToProject');

describe('addWorkflowToProject', () => {
  it('returns new project with workflow added', () => {
    const project = { id: 'p1', workflows: [] };
    const workflow = { id: 'wf1' };
    const result = addWorkflowToProject(project, workflow);
    expect(result.workflows).to.have.lengthOf(1);
    expect(result.workflows[0]).to.equal(workflow);
    expect(result).to.not.equal(project);
  });
});
