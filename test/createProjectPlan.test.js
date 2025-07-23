const { expect } = require('chai');
const { createProjectPlan, PROJECT_CREATION_STEPS } = require('../lib/createProjectPlan');

describe('createProjectPlan', () => {
  it('generates plan with all steps', () => {
    const plan = createProjectPlan({ id: 'p1', name: 'Demo', templateId: 'react' });
    expect(plan.steps).to.have.lengthOf(5);
    expect(plan.steps[0].name).to.equal(PROJECT_CREATION_STEPS.PLANNING);
  });
});
