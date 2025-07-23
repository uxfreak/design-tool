function allocateUniquePort(usedPorts) {
  let port = 6006;
  while (usedPorts.has(port)) {
    port++;
  }
  return port;
}

module.exports = allocateUniquePort;
