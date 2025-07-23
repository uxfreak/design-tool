# Automatic Figma MCP Installation Implementation

> Implementation plan for automatically installing Figma MCP server in new Design Tool projects

## Current State

**❌ No Automatic Installation**: Currently, new projects require manual MCP server configuration:
```bash
claude mcp add --transport sse figma-dev-mode-mcp-server http://127.0.0.1:3845/sse
```

## Proposed Implementation

### Option 1: Settings-Controlled Auto-Installation (Recommended)

Add a user setting to enable/disable automatic Figma MCP installation for new projects.

#### Settings UI Addition
Add to Settings → Advanced tab:
```javascript
{
  enableFigmaMCP: true,  // Default: enabled
  figmaMCPUrl: 'http://127.0.0.1:3845/sse',  // Configurable URL
  mcpInstallScope: 'project'  // 'project' or 'user'
}
```

#### Implementation in Project Creation

**File**: `main.js` - Project creation handler (`ipcMain.handle('project:create')`)

Add after line 772 (after project is stored):
```javascript
// Auto-install Figma MCP if enabled in settings
const enableFigmaMCP = store.get('enableFigmaMCP', true);
if (enableFigmaMCP) {
  await installFigmaMCPForProject(projectPath, projectConfig);
}
```

#### New Function: `installFigmaMCPForProject`
```javascript
/**
 * Install Figma MCP server for a project (ASYNC FUNCTION)
 * @param {string} projectPath - Path to project directory
 * @param {Object} projectConfig - Project configuration
 */
async function installFigmaMCPForProject(projectPath, projectConfig) {
  try {
    console.log('🎨 Installing Figma MCP server for project:', projectConfig.name);
    
    const figmaMCPUrl = store.get('figmaMCPUrl', 'http://127.0.0.1:3845/sse');
    const mcpScope = store.get('mcpInstallScope', 'project');
    
    // Create .mcp.json file in project directory
    const mcpConfig = {
      mcpServers: {
        "figma-dev-mode-mcp-server": {
          transport: "sse",
          url: figmaMCPUrl
        }
      }
    };
    
    const mcpConfigPath = path.join(projectPath, '.mcp.json');
    await fs.writeFile(mcpConfigPath, JSON.stringify(mcpConfig, null, 2));
    
    console.log('✅ Figma MCP server configured for project:', projectConfig.name);
    
    // Send progress update
    if (mainWindow) {
      mainWindow.webContents.send('project:progress', {
        projectId: projectConfig.id,
        mcpInstalled: true,
        message: 'Figma MCP server configured'
      });
    }
    
    return { success: true };
  } catch (error) {
    console.warn('⚠️ Failed to install Figma MCP server:', error.message);
    return { success: false, error: error.message };
  }
}
```

### Option 2: Template-Based Installation

Add MCP configuration only to specific templates.

#### Template Configuration
```javascript
const TEMPLATE_CONFIGS = {
  'react-basic': {
    includeFigmaMCP: false
  },
  'react-typescript': {
    includeFigmaMCP: false  
  },
  'react-storybook': {
    includeFigmaMCP: true  // Enable for design-focused template
  },
  'react-figma': {  // New template
    includeFigmaMCP: true,
    includeDesignTokens: true
  }
};
```

#### Implementation in Template Selection
```javascript
// In executeProjectCreation function
const templateConfig = TEMPLATE_CONFIGS[projectConfig.templateId];
if (templateConfig?.includeFigmaMCP) {
  await installFigmaMCPForProject(projectPath, projectConfig);
}
```

### Option 3: Always Install (Simplest)

Automatically install Figma MCP for all new projects without configuration.

#### Direct Implementation
Add to project creation workflow:
```javascript
// After project creation success (line 774)
try {
  await installFigmaMCPForProject(projectPath, projectConfig);
} catch (error) {
  console.warn('Figma MCP installation failed:', error.message);
  // Continue project creation even if MCP fails
}
```

## Recommended Implementation: Option 1 (Settings-Controlled)

### Benefits
- ✅ **User Control**: Users can enable/disable as needed
- ✅ **Configurable URL**: Support different Figma MCP server locations
- ✅ **Scope Selection**: Choose between project and user scope
- ✅ **Team Friendly**: Project-scoped configuration can be shared via git

### Settings UI Mockup
```
Advanced Settings:
┌─────────────────────────────────────────┐
│ ☑ Auto-install Figma MCP for new projects │
│                                         │
│ Figma MCP Server URL:                   │
│ ┌─────────────────────────────────────┐ │
│ │ http://127.0.0.1:3845/sse           │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Installation Scope:                     │
│ ○ Project (shared with team)            │
│ ● User (personal only)                  │
└─────────────────────────────────────────┘
```

### .mcp.json Output
When enabled, creates in each new project:
```json
{
  "mcpServers": {
    "figma-dev-mode-mcp-server": {
      "transport": "sse", 
      "url": "http://127.0.0.1:3845/sse"
    }
  }
}
```

## Implementation Steps

### 1. Add Settings Options
Update settings schema and UI to include Figma MCP options.

### 2. Modify Project Creation
Add MCP installation to the project creation workflow.

### 3. Create Installation Function
Implement `installFigmaMCPForProject` with error handling.

### 4. Update Documentation
Document the new automatic installation feature.

### 5. Test Integration
Verify MCP servers work correctly in newly created projects.

## User Experience Flow

### With Auto-Install Enabled
1. User creates new project → Project creation begins
2. React scaffolding completes → MCP configuration starts  
3. `.mcp.json` file created → Progress shows "Figma MCP configured"
4. Project opens → Terminal sidebar has Figma MCP available
5. User types `claude` → Can immediately use Figma integration

### Terminal Usage After Auto-Install
```bash
# Terminal automatically has Figma MCP available
claude "extract design tokens from figma file"
/mcp  # Shows figma-dev-mode-mcp-server
```

## Migration for Existing Projects

For projects created before this feature:
```bash
# Users can manually add MCP to existing projects
cd existing-project
claude mcp add -s project --transport sse figma-dev-mode-mcp-server http://127.0.0.1:3845/sse
```

## Error Handling

- MCP installation failure doesn't block project creation
- Clear error messages for invalid MCP server URLs
- Graceful fallback if Figma server isn't running
- Setting validation for URL format

## Future Enhancements

- **Multiple MCP Servers**: Support for additional design tools
- **Template-Specific MCPs**: Different MCP servers per template
- **Team Defaults**: Organization-wide MCP configuration
- **Health Checks**: Verify MCP server availability before installation

---

**Recommendation**: Implement **Option 1 (Settings-Controlled)** for maximum flexibility while maintaining user control and team collaboration capabilities.