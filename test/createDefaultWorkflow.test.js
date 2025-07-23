const { expect } = require('chai');
const createDefaultWorkflow = require('../lib/createDefaultWorkflow');

describe('createDefaultWorkflow', () => {
  it('creates a workflow with default fields', () => {
    const wf = createDefaultWorkflow({ id: 'proj1', name: 'Demo' });
    expect(wf.id).to.equal('proj1_landing');
    expect(wf.steps).to.have.lengthOf(1);
    expect(wf.isDefault).to.be.true;
  });
});
