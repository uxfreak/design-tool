const path = require('path');
const os = require('os');
const fs = require('fs').promises;

function createThumbnailConfig(options = {}) {
  return {
    width: options.width || 300,
    height: options.height || 200,
    quality: options.quality || 0.8,
    format: options.format || 'png',
    timeout: options.timeout || 10000,
    waitForLoad: options.waitForLoad || 3000,
    ...options
  };
}

function createThumbnailPath(project, config, store) {
  const projectPath = project.path || path.join(store.get('projectsDirectory', os.homedir()), project.name);
  const thumbnailDir = path.join(projectPath, '.thumbnails');
  const timestamp = Date.now();
  const filename = `preview_${project.id}_${timestamp}.${config.format}`;
  return path.join(thumbnailDir, filename);
}

async function shouldRegenerateThumbnail(thumbnailPath, project, maxAge = 3600000) {
  try {
    const [thumbStats, projectStats] = await Promise.all([
      fs.stat(thumbnailPath),
      fs.stat(path.join(project.path, 'package.json'))
    ]);
    const thumbAge = Date.now() - thumbStats.mtime.getTime();
    const isStale = thumbAge > maxAge;
    const isOutdated = projectStats.mtime > thumbStats.mtime;
    return isStale || isOutdated;
  } catch {
    return true;
  }
}

function createThumbnailWindowConfig(config) {
  return {
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: false
    },
    paintWhenInitiallyHidden: true,
    enableLargerThanScreen: true
  };
}

function processImageThumbnail(image, config) {
  return image.resize({
    width: config.width,
    height: config.height,
    quality: 'good'
  });
}

function createFallbackThumbnailPath(templateId) {
  return `fallback:${templateId}`;
}

module.exports = {
  createThumbnailConfig,
  createThumbnailPath,
  shouldRegenerateThumbnail,
  createThumbnailWindowConfig,
  processImageThumbnail,
  createFallbackThumbnailPath
};
