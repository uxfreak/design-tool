const { expect } = require('chai');
const allocateUniquePort = require('../lib/allocateUniquePort');

describe('allocateUniquePort', () => {
  it('returns next unused port', () => {
    const used = new Set([6006, 6007]);
    const port = allocateUniquePort(used);
    expect(port).to.equal(6008);
  });
});
