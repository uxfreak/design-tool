# Design Tool - User Guide

> Complete guide to using the Design Tool desktop application for React project management with embedded Claude Code assistance

## Overview

The Design Tool is a comprehensive desktop application that transforms React development workflow by providing integrated project management, live development servers, component discovery, and Claude Code terminal assistance in a single professional interface.

## Getting Started

### Prerequisites

Before using the Design Tool, ensure you have the Figma Dev Mode MCP server running:

**Figma Dev Mode MCP Server Setup**:

1. **Ensure Server is Running**: Make sure the Figma Dev Mode MCP server is running on `http://127.0.0.1:3845/sse`

2. **Automatic Installation**: ✨ **NEW** - The Design Tool now automatically installs AND configures the Figma MCP server in all new projects! No manual setup required.

3. **Verify Connection**: After creating a project, test the MCP server is working:
   ```bash
   # Open terminal sidebar and check
   claude --continue
   /mcp  # Should show figma-dev-mode-mcp-server
   ```

**For Existing Projects** (created before auto-install):
```bash
# Add MCP server to existing projects manually
claude mcp add -s project --transport sse figma-dev-mode-mcp-server http://127.0.0.1:3845/sse
```

### First Launch

1. **Launch the Application**
   - Double-click the Design Tool icon or run `npm start`
   - The application opens with a professional dark theme interface
   - You'll see the main dashboard with project management controls

2. **Initial Setup**
   - Click the ⚙️ Settings button in the top navigation
   - Configure your projects directory (where new projects will be created)
   - Select your default project template
   - Set development server port ranges if needed

3. **Verify MCP Integration**
   - Click the terminal button (📟) in the top right header to open the terminal sidebar
   - The terminal sidebar will slide in from the right side of the application
   - Run the MCP setup command shown above to ensure Figma integration
   - Test Claude Code functionality with `claude help`

### Creating Your First Project

1. **Start Project Creation**
   - Click the ➕ "Create New Project" button on the main dashboard
   - The project creation modal opens with a clean form interface

2. **Configure Project Details**
   - **Project Name**: Enter a descriptive name (e.g., "my-react-app")
   - **Template Selection**: Choose from available templates:
     - `react-basic`: Standard create-react-app with custom components
     - `react-typescript`: TypeScript template with enhanced components
     - `react-storybook`: Enhanced component library with Storybook integration

3. **Monitor Creation Progress**
   - Real-time progress updates show each step:
     - Planning → Scaffolding → Installing → Configuring (includes Figma MCP) → Ready
   - Visual progress bar indicates completion status
   - Creation typically takes 30-60 seconds depending on template
   - ✨ **New**: Figma MCP server is automatically configured during the "Configuring" step

4. **Project Ready**
   - Once complete, the project automatically opens in the Project Viewer
   - You'll see the tabbed interface with Component Library, Workflows, and Terminal

## Project Management

### Dashboard Views

**Grid View** (Default):
- Visual project cards with thumbnails
- Project metadata: name, template, creation date
- Server status indicators
- Quick action buttons

**List View**:
- Compact table format with detailed information
- Sortable columns
- Efficient for managing many projects

### Project Actions

**Open Project**:
- Click any project card to open the Project Viewer
- Automatically starts background development server
- Shows live component library and workflow previews

**Delete Project**:
- Click the 🗑️ delete button on project cards
- ⚠️ **WARNING**: This permanently deletes ALL project files from your computer
- **Complete deletion includes**:
  - Entire project directory and all subdirectories
  - `node_modules` folder (can be 100MB+ in size)
  - Source code, components, assets, and configuration files
  - `.mcp.json`, `package.json`, and all project settings
- Detailed confirmation dialog shows exactly what will be deleted
- Stops any running development servers and terminal sessions
- This action cannot be undone

**Project Status Indicators**:
- Green dot: Development server running and ready
- Yellow dot: Server starting up
- Red dot: Server failed or stopped
- Gray dot: Project inactive

## Project Viewer Interface

### Tab Navigation

The Project Viewer provides two main tabs for comprehensive project management:

#### 1. Component Library Tab

**Purpose**: Discover and preview React components in your project

**Features**:
- **Component Discovery**: Automatically scans project files for React components
- **Manual Refresh**: Click the 🔄 refresh button to update when you add new components
- **Variant System**: Shows component variants defined via `Component.variants = [...]`
- **Live Previews**: Real-time component rendering using the development server
- **Dark Mode Interface**: Professional component showcase with metadata
- **Interactive Examples**: Click variants to see different component states

**Component Variants Example**:
```javascript
// In your React component file
Button.variants = [
  { name: 'Primary', props: { variant: 'primary' } },
  { name: 'Secondary', props: { variant: 'secondary' } },
  { name: 'Large', props: { size: 'large' } }
];
```

#### 2. Workflows Tab

**Purpose**: Manage and preview project workflows and pages

**Features**:
- **Workflow Library**: View all available workflows for the project
- **Live Previews**: Click workflows to see live iframe previews
- **Server Integration**: Automatically uses the running development server
- **Landing Page**: Default workflow showing create-react-app landing page
- **Status Monitoring**: Visual indicators for server readiness

**Workflow Actions**:
- **Preview**: Opens modal with live iframe of the workflow
- **Browser**: Opens workflow in external browser
- **Edit**: Placeholder for future workflow editing features

### Terminal Sidebar Integration

**Purpose**: Global Claude Code terminal for development assistance across all projects

**How to Access**:
- Click the terminal button (📟) in the top right header to toggle the terminal sidebar
- The sidebar slides in from the right side and can be resized
- Available globally across all views (dashboard, project viewer, settings)

**Features**:
- **Full Shell Access**: Complete bash/PowerShell terminal with Claude Code integration
- **Global Context**: Terminal is aware of current view, project, and application state
- **Session Persistence**: Terminal state persists across navigation and app restarts
- **Project Context Injection**: Automatically includes current project information in terminal environment
- **Professional UI**: Controls for clear, restart, and session management

**Terminal Usage**:
- ✨ **Auto-MCP Setup**: Figma MCP server automatically configured when terminal opens
- Standard shell commands: `npm install`, `git status`, `ls`, etc.
- Claude Code: `claude --continue` to start Claude with MCP integration
- MCP Commands: `/mcp` to see available MCP servers (run after `claude --continue`)
- Project context: Current project name and directory automatically available
- Figma integration: Immediate access to Figma Dev Mode tools via MCP

**Terminal Controls**:
- **Clear**: Clear terminal output (trash icon)
- **Restart**: Restart terminal session (refresh icon)
- **Close**: Hide terminal sidebar (X icon)
- **Resize**: Drag left edge to resize sidebar width

### Development Server Management

**Automatic Server Startup**:
- Development servers start automatically when projects open
- Background startup doesn't block UI interactions
- Smart port allocation prevents conflicts (3000, 3001, 3002+)

**Server Controls**:
- **Start/Stop**: Manual server control via action buttons
- **Browser**: Open project in external browser
- **Status**: Real-time server health monitoring
- **Logs**: Access to server stdout/stderr for debugging

**Server States**:
- **Starting**: Server is launching (shows loading indicators)
- **Ready**: Server running and responsive (shows live previews)
- **Failed**: Server startup failed (shows error with retry option)
- **Stopped**: Server not running (shows start button)

## Settings Management

### Settings Categories

Access settings via the ⚙️ button in the top navigation.

#### General Settings

**Projects Directory**:
- Choose where new projects are created
- Uses native OS directory picker
- Automatically creates directory if it doesn't exist
- Validates write permissions

**Default Template**:
- Select which template to pre-select in project creation
- Saves time when creating multiple projects of the same type

**Recent Projects Limit**:
- Control how many recent projects to display
- Helps manage dashboard clutter for active developers

#### Development Settings

**Port Range Configuration**:
- Set the range of ports for development servers
- Default: 3000-3100
- Prevents conflicts with other local services

**Auto-open Browser**:
- Choose whether to automatically open browser when servers start
- Useful for immediate preview feedback

#### Advanced Settings

**Developer Tools**:
- Enable/disable developer tools in production builds
- Useful for debugging and development

**Debug Logging**:
- Control verbosity of application logs
- Helps with troubleshooting issues

### Settings Persistence

All settings are automatically saved using electron-store and persist between application sessions. Settings are validated on save to prevent configuration errors.

## Terminal Integration

### Claude Code Assistance

The embedded terminal provides full Claude Code integration with enhanced project context:

**Automatic Context Injection**:
- Current project name and directory
- Active application view (dashboard, project viewer, etc.)
- File being viewed or edited
- Project template and configuration

**Enhanced Commands**:
```bash
# Standard shell commands work normally
npm install express
git status
ls -la

# Claude Code with project context
claude help me add a new component to this React project
claude review my code for best practices
claude explain this error message
```

**Session Management**:
- Terminal sessions persist across tab switches
- Each project maintains its own terminal session
- Sessions survive application navigation
- Proper cleanup when projects are closed

### Terminal Features

**Professional Interface**:
- Dark theme matching application design
- Proper terminal emulation with xterm.js
- Clear and restart controls
- Resizable interface

**Security & Performance**:
- Secure PTY process management
- Proper cleanup and resource management
- Process isolation for security
- Memory efficient session handling

## Component Discovery System

### How It Works

The Design Tool automatically discovers React components in your project using intelligent file scanning:

1. **File Scanning**: Scans all JavaScript/TypeScript files in the project
2. **AST Parsing**: Uses Abstract Syntax Tree parsing to identify React components
3. **Variant Detection**: Finds components with custom variant definitions
4. **Live Updates**: Updates component library when files change

### Supported Component Patterns

**Functional Components**:
```javascript
function Button({ variant, children }) {
  return <button className={variant}>{children}</button>;
}

Button.variants = [
  { name: 'Primary', props: { variant: 'primary' } },
  { name: 'Secondary', props: { variant: 'secondary' } }
];

export default Button;
```

**Class Components**:
```javascript
class Card extends React.Component {
  render() {
    return <div className="card">{this.props.children}</div>;
  }
}

Card.variants = [
  { name: 'Default', props: {} },
  { name: 'Elevated', props: { elevation: true } }
];
```

**Component Metadata**:
- Component name and file location
- Variant definitions with props
- Dependencies and imports
- Documentation comments

### Live Component Previews

Components are rendered live using the running development server:
- Real-time updates when code changes
- Actual styling and behavior
- Interactive component states
- Error handling for broken components

## Troubleshooting

### Common Issues

**Terminal Not Working**:
- Ensure node-pty is rebuilt for your Electron version
- Check terminal permissions in system settings
- Restart application to reset PTY processes

**Server Won't Start**:
- Check if ports are available (3000, 3001, 3002+)
- Verify npm/yarn is installed and accessible
- Check project dependencies are installed correctly
- Review server logs in terminal for specific errors

**Component Discovery Not Working**:
- Ensure components follow supported patterns
- Check that variant definitions are properly formatted
- Verify file permissions in project directory
- Restart project to refresh component scanning

**Projects Won't Create**:
- Verify write permissions in projects directory
- Check internet connection for dependency downloads
- Ensure npm/yarn is installed and in PATH
- Try creating project manually to isolate issues

### Debug Mode

**Enable Debug Logging**:
1. Open Settings → Advanced
2. Enable "Debug Logging"
3. Restart application
4. Check logs in terminal and developer tools

**Developer Tools**:
- Press F12 or use Help → Developer Tools
- Check Console tab for error messages
- Network tab shows server communication
- Elements tab for UI debugging

### Performance Tips

**Managing Many Projects**:
- Increase recent projects limit in settings
- Use list view for better performance with many projects
- Close unused project viewers to free resources

**Server Resource Management**:
- Stop servers for projects you're not actively using
- Monitor port usage to prevent conflicts
- Restart application periodically to clear resource usage

## Best Practices

### Project Organization

**Naming Conventions**:
- Use descriptive project names
- Follow consistent naming patterns
- Avoid special characters that might cause file system issues

**Template Selection**:
- Choose `react-basic` for simple projects
- Use `react-typescript` for type-safe development
- Select `react-storybook` for component library projects

### Development Workflow

**Efficient Usage**:
1. Create project with appropriate template
2. Let development server start automatically
3. Use Component Library tab to explore existing components
4. Use Terminal tab for development tasks
5. Use Workflows tab to preview application pages

**Component Development**:
- Define variants for all reusable components
- Use descriptive variant names
- Include comprehensive props in variant definitions
- Test components in multiple variants

### Security Considerations

**Safe Practices**:
- Only run projects from trusted sources
- Be cautious with terminal commands
- Keep application updated for security fixes
- Use appropriate file permissions for project directories

## Advanced Features

### Custom Templates

Future versions will support custom template creation:
- Define your own project scaffolding
- Include custom components and configurations
- Share templates across teams
- Template marketplace integration

### Plugin System

Extensibility features planned:
- Third-party plugin integration
- Custom component discovery patterns
- Additional workflow types
- Integration with external tools

### Cloud Integration

Future cloud features:
- Project synchronization across devices
- Shared component libraries
- Team collaboration features
- Remote development server hosting

## Support & Resources

### Getting Help

**Documentation**:
- Read the complete CLAUDE.md for technical details
- Review API documentation for development
- Check troubleshooting guide for common issues

**Community**:
- Submit issues and feature requests on GitHub
- Follow development updates
- Contribute to documentation and features

### Updates & Maintenance

**Keeping Current**:
- Application checks for updates automatically
- Follow release notes for new features
- Update project dependencies regularly
- Backup important projects before major updates

---

**Design Tool v0.1.0** - Complete living design system manager with embedded Claude Code assistance. Transform your React development workflow with integrated project management, component discovery, and AI-powered development assistance.