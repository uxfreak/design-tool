const { expect } = require('chai');
const validateProjectPath = require('../lib/validateProjectPath');

describe('validateProjectPath', () => {
  it('fails for invalid characters', () => {
    const res = validateProjectPath('bad:path');
    expect(res.success).to.be.false;
  });

  it('passes for valid path', () => {
    const res = validateProjectPath('/tmp/project');
    expect(res.success).to.be.true;
    expect(res.value).to.equal('/tmp/project');
  });
});
