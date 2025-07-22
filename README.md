# Design Tool - Living Design System Manager

> A comprehensive desktop application for React project management with embedded Claude Code assistance

## Overview

The Design Tool is a production-ready Electron desktop application that transforms React development workflow by providing:

- **Project Management**: Create, organize, and manage React projects with professional templates
- **Live Development**: Real-time React dev server integration with iframe previews
- **Component Discovery**: Automatic scanning and display of React components with variants
- **Terminal Integration**: Embedded Claude Code assistance with persistent sessions
- **Settings Management**: User-configurable preferences with robust persistence

## Features

### ✅ Complete Project Lifecycle
- **Create Projects**: Bootstrap React applications using create-react-app with custom templates
- **Live Previews**: Real-time iframe displays of running React applications
- **Component Library**: Dark mode interface showing discovered components with variants
- **Terminal Access**: Embedded xterm.js terminal with Claude Code integration

### ✅ Professional Development Experience
- **VS Code-like Terminal**: Persistent sessions that survive tab switches
- **Process Management**: Smart port allocation and lifecycle management
- **Error Recovery**: Comprehensive validation and automatic cleanup
- **Settings Persistence**: User preferences stored with electron-store

### ✅ Technical Excellence
- **Functional Programming**: Pure functions throughout with immutable data patterns
- **Secure Architecture**: Proper IPC communication with contextBridge isolation
- **Performance Optimized**: Efficient component discovery and terminal session reuse
- **Robust Error Handling**: Comprehensive validation and recovery mechanisms

## Architecture

### System Components
```
┌─────────────────────────────────────────────────────────────────┐
│                     DESIGN TOOL ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐ │
│  │   MAIN PROCESS  │    │ RENDERER PROCESS │    │   EXTERNAL   │ │
│  │   (Node.js)     │    │   (Chromium)     │    │   PROCESSES  │ │
│  │                 │    │                 │    │              │ │
│  │ • Project Mgmt  │◄──►│ • Frontend UI   │    │ • React Dev  │ │
│  │ • Server Mgmt   │    │ • Project Tabs  │    │   Servers    │ │
│  │ • PTY Manager   │    │ • xterm.js      │    │ • PTY Procs  │ │
│  │ • Persistence   │    │ • Settings UI   │    │   (Claude)   │ │
│  └─────────────────┘    └─────────────────┘    └──────────────┘ │
│           │                        │                    │       │
│           └────────── IPC ─────────┴────── Process ─────┘       │
│                    Communication        Management              │
└─────────────────────────────────────────────────────────────────┘
```

### Terminal Integration
The embedded terminal provides a complete development environment:

- **xterm.js Frontend**: Professional terminal display with dark theme
- **node-pty Backend**: Real shell processes with proper lifecycle management  
- **Session Persistence**: Terminals survive tab switches via DOM element reuse
- **Claude Code Access**: Direct integration for development assistance

## Installation

### Prerequisites
- Node.js 16+ or Electron 19+
- npm or yarn package manager
- Claude Code CLI (optional, for terminal assistance)

### Setup
```bash
# Clone or download the project
cd design-tool

# Install dependencies
npm install

# Start the application
npm start

# Development mode with auto-restart
npm run dev:watch
```

## Usage

### Creating Projects
1. **Launch Application**: Start the Design Tool
2. **Create Project**: Click "Create New Project"
3. **Configure**: Choose template (react-basic, react-typescript, react-storybook)
4. **Generate**: Application creates project with create-react-app
5. **Open**: Automatically opens project viewer with tabs

### Project Management
- **Component Library**: View discovered React components with variants
- **Workflows**: Access project workflows with live previews
- **Terminal**: Use embedded Claude Code for development assistance
- **Settings**: Configure preferences, templates, and directories

### Terminal Features
- **Shell Access**: Full bash/PowerShell in project directory
- **Claude Code**: Type `claude` for AI-powered development assistance
- **Persistence**: Sessions continue across tab switches
- **Controls**: Clear and restart functionality

## Templates

### Available Templates
- **react-basic**: Standard create-react-app with custom components
- **react-typescript**: TypeScript template with enhanced components
- **react-storybook**: Enhanced component library with Storybook integration
- **react-storybook-tailwind**: Above plus Tailwind CSS (future)

### Custom Component System
Templates include custom components with variant systems:
```javascript
// Components define variants directly in files
Button.variants = [
  { name: 'primary', props: { variant: 'primary' } },
  { name: 'secondary', props: { variant: 'secondary' } },
  { name: 'large', props: { size: 'large' } }
];
```

## Configuration

### Settings Management
Access via Settings menu:
- **General**: Projects directory, default template
- **Development**: Port ranges, auto-open browser
- **Advanced**: DevTools, recent projects limit

### Persistence
- **Projects**: Stored in electron-store backend
- **Settings**: User preferences survive app restarts
- **Terminals**: Session state maintained across navigation

## File Structure

```
design-tool/
├── main.js          # Electron main process
├── app.js           # Frontend application logic  
├── preload.js       # Secure IPC bridge
├── index.html       # Application UI and styling
├── package.json     # Dependencies and scripts
├── CLAUDE.md        # Generative Analysis documentation
└── README.md        # This file
```

## Development

### Architecture Principles
- **Functional Programming**: Pure functions with immutable data
- **Security First**: No node integration, context isolation enabled
- **Process Isolation**: Main/renderer separation with secure IPC
- **Error Recovery**: Comprehensive validation and cleanup

### Key Technologies
- **Electron**: Desktop application framework
- **create-react-app**: Project scaffolding
- **xterm.js + node-pty**: Terminal integration
- **electron-store**: Settings persistence

## Troubleshooting

### Common Issues
- **Terminal not working**: Ensure node-pty is rebuilt for your Electron version
- **Port conflicts**: Check port ranges in Settings → Development
- **Project creation fails**: Verify npm/yarn installation and network access

### Debug Mode
```bash
# Start with developer tools
npm run dev

# View main process logs in terminal
# View renderer logs in DevTools Console
```

## Contributing

The Design Tool follows Generative Analysis methodology:
1. Read `CLAUDE.md` for complete technical documentation
2. Follow functional programming principles
3. Maintain pure functions and immutable data patterns
4. Update documentation for all changes

## License

MIT License - See LICENSE file for details

## Support

For issues and feature requests:
- Check existing GitHub issues
- Follow troubleshooting guide
- Review CLAUDE.md technical documentation

---

**Design Tool v0.1.0** - A complete living design system manager with embedded Claude Code assistance.
