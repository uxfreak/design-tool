# Development Guide

## Quick Start

For fast development with hot-reload:

```bash
npm run dev:watch
```

This will:
- Start Electron with development flags
- Watch for changes in `.js`, `.html`, and `.css` files  
- Automatically restart the app when files change
- Open DevTools automatically (with suppressed Autofill warnings)
- Show file change notifications in terminal

## Development Commands

- `npm start` - Start the app normally
- `npm run dev` - Start app in development mode with DevTools
- `npm run dev:watch` - Start with nodemon watching for file changes

## Development Features

- **Hot Reload**: Files are watched and app automatically reloads on changes
- **DevTools**: Chrome DevTools are automatically opened in dev mode
- **Clean Console**: Autofill warnings are suppressed for cleaner debugging
- **File Watching**: Changes to `index.html` and `app.js` trigger immediate reload
- **Change Notifications**: Terminal shows which file triggered the reload
- **Memory Management**: File watchers are properly cleaned up on app exit

## File Structure

```
design-tool/
├── main.js                    # Electron main process with IPC handlers
├── preload.js                 # Secure IPC bridge for renderer communication
├── index.html                 # Application UI with tabbed interface
├── app.js                     # Frontend logic (Phases 2, 3, 3.5)
├── dev-suppress-warnings.js   # Development warning suppression
├── package.json               # Dependencies and scripts
├── CLAUDE.md                  # Project requirements and implementation log
├── GENERATIVE_ANALYSIS_DOCS.md # Complete Generative Analysis specification
└── DEVELOPMENT.md             # This development guide
```

## Making Changes

1. Start the dev server: `npm run dev:watch`
2. Edit any file (`index.html`, `app.js`, `main.js`)
3. Save the file
4. App automatically reloads with your changes

## Debugging

- DevTools are automatically opened in development mode
- Check the Console tab for application logs (Autofill warnings suppressed)
- Use `console.log()` for debugging in `app.js`
- Main process logs appear in the terminal where you ran the command
- File change events are logged with `🔄` emoji for easy identification

## Tips

- Keep the terminal open to see main process logs and nodemon restart messages
- Use the DevTools Console for frontend debugging (cleaner output with suppressed warnings)
- Changes to `main.js` require a full restart (nodemon handles this automatically)
- Changes to `index.html` and `app.js` trigger fast in-window reloads
- Look for `🔄 File changed: filename, reloading...` messages to confirm hot-reload is working

## Troubleshooting

- **Autofill warnings**: These are harmless DevTools internal warnings that don't affect functionality
- **UnhandledPromiseRejection**: Added proper error handling in both main and renderer processes
- **Hot-reload issues**: Restart with `npm run dev:watch`
- **Nodemon issues**: Try `npm install nodemon` to ensure it's properly installed
- **IPC errors**: Fixed with `webSecurity: false` in development mode

## Recent Features & Fixes

**Phase 5 - Live React Dev Server Preview ✅ COMPLETED**
- ✅ **Live Preview System**: Real React dev servers running in background with iframe previews
- ✅ **Process Management**: Smart port allocation (3000+), server lifecycle management
- ✅ **Interactive Controls**: Start/stop servers, open in browser, real-time status updates
- ✅ **Loading States**: Spinner during server startup, error handling with retry options
- ✅ **Graceful Cleanup**: Proper process termination on app exit and server management
- ✅ **Authentic Previews**: Shows actual create-react-app landing page instead of mock content
- ✅ **IPC Integration**: Secure communication between frontend and backend server processes

**Phase 4 Enhanced - Backend Persistence & Error Handling ✅ COMPLETED**
- ✅ Complete backend project registry with electron-store persistence
- ✅ Automatic cleanup of failed project creation attempts
- ✅ Default template pre-selection from user settings
- ✅ Duplicate project prevention with clear error messaging
- ✅ Orphaned project cleanup on application startup
- ✅ Real file system validation and project persistence
- ✅ User-friendly error messages and recovery mechanisms

**Phase 4 - Backend Persistence & Settings ✅ COMPLETED**
- ✅ Complete settings system with tabbed UI (General/Development/Advanced)
- ✅ Native directory picker for projects directory configuration
- ✅ electron-store integration for persistent settings storage
- ✅ Real file system operations using user-configured paths
- ✅ Settings validation with user-friendly error handling
- ✅ Default template selection with persistence
- ✅ Configurable development server port ranges
- ✅ Settings reset to defaults functionality

**Phase 3.5 - Tabbed Interface ✅ COMPLETED**
- ✅ Added tabbed project interface with Component Library and Workflows
- ✅ Interactive component showcase with previews and variants
- ✅ Workflow management with visual workflow previews
- ✅ Professional UI design with responsive grid layouts

**Phase 3 - Project Creation ✅ COMPLETED**
- ✅ Real-time project creation with live progress updates
- ✅ Secure IPC communication between main and renderer processes
- ✅ Complete React + Storybook project scaffolding
- ✅ npm install automation with process monitoring

**Development Environment**
- ✅ Added proper error handling for unhandled promise rejections
- ✅ Suppressed DevTools Autofill warnings with dedicated script
- ✅ Improved development configuration with `webSecurity: false`
- ✅ Added graceful error handling in both main and renderer processes

## Current Features

**Live React Dev Server Integration** 🚀
- **Real Preview System**: Automatically runs `npm start` in background for authentic previews
- **Live Iframe Display**: Shows actual create-react-app landing page with spinning React logo
- **Smart Port Management**: Auto-allocates available ports (3000, 3001, 3002...)
- **Process Lifecycle**: Health monitoring, graceful cleanup, error recovery
- **Interactive Server Controls**: Start/stop servers, open in browser, retry failed starts
- **Loading States**: Professional spinners, progress messages, error handling
- **Background Process Management**: Manages multiple React dev servers simultaneously

**Project Management**
- **create-react-app Integration**: Uses `npx create-react-app` for reliable project scaffolding
- **Custom Component System**: Auto-generates Button/Card components with variant definitions
- **Backend Registry**: electron-store persistence with automatic file system validation
- **Real-time Creation**: Live progress tracking with visual indicators
- **Grid/List Views**: Professional project display with metadata
- **Status Tracking**: Creating → Ready → Running states with server management
- **Error Handling**: Automatic cleanup, duplicate prevention, graceful recovery

**Settings System**
- Tabbed settings interface (General/Development/Advanced tabs)
- User-configurable projects directory with native file picker
- Default template selection with persistence across sessions
- Configurable development server port ranges
- Settings validation with user-friendly error messages
- Settings reset to defaults with confirmation
- Real-time settings application to project creation workflow

**Workflow Management** 
- **Default Workflow Creation**: Auto-generates "Landing Page" workflow for each project
- **Live Workflow Preview**: Click workflow card → see actual running React app
- **Server Integration**: Workflows launch real dev servers showing authentic content
- **Visual Workflow Cards**: Step-by-step previews with component counts and metadata
- **Professional Preview Modal**: Browser-style interface with live iframe content

**Tabbed Project Interface**
- Component Library tab with interactive component previews (future: real file scanning)
- Workflows tab with live preview integration
- Professional tabbed navigation with active state indicators
- Dynamic content loading with live server management