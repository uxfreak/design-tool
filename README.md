# Design Tool - React Project Management with AI Assistance

> Desktop application for React development with integrated Claude Code terminal following Generative Analysis methodology

## Purpose and Benefits

### P1: System Purpose
One (1) Design Tool application serves exactly one (1) primary purpose: enabling React developers to bootstrap projects, discover components, manage development servers, and receive AI development assistance through an integrated terminal interface.

### P2: Target Users
The Design Tool benefits:
- React developers who need project management tools
- Teams building component libraries  
- Developers who want AI-assisted development workflow
- Anyone learning React development patterns

### P3: Measurable Benefits
The system provides quantifiable improvements:
- Reduce project setup time from hours to minutes (< 2 minutes for standard templates)
- Automate component discovery with >95% accuracy for standard React patterns
- Achieve >98% development server startup success rate
- Maintain 100% terminal session persistence across navigation events
- Ensure zero data loss during project management operations

## System Requirements

### R1: Project Management
- **R1.1**: The system SHALL create new React projects using specified templates
- **R1.2**: The system SHALL validate project names for uniqueness and filesystem compatibility
- **R1.3**: The system SHALL display real-time progress during project creation
- **R1.4**: The system SHALL persist project metadata in a project registry

### R2: Development Server Management  
- **R2.1**: The system SHALL start development servers automatically when projects are opened
- **R2.2**: The system SHALL allocate unique ports for each development server
- **R2.3**: The system SHALL monitor development server health and status
- **R2.4**: The system SHALL provide manual start/stop controls for development servers

### R3: Component Discovery
- **R3.1**: The system SHALL scan project files to identify React components
- **R3.2**: The system SHALL extract component variants from source code patterns
- **R3.3**: The system SHALL display components in a browsable library interface
- **R3.4**: The system SHALL provide live preview of component variants

### R4: Terminal Integration
- **R4.1**: The system SHALL provide an embedded terminal with full shell access
- **R4.2**: The system SHALL inject project context into terminal environment
- **R4.3**: The system SHALL maintain terminal sessions across navigation
- **R4.4**: The system SHALL support Claude Code integration with project awareness

## Installation

### Prerequisites
- **P4.1**: Node.js 16+ or Electron 19+
- **P4.2**: npm or yarn package manager  
- **P4.3**: Claude Code CLI (optional, for terminal assistance)

### Setup Process
**R5.1**: Clone or download the project repository
**R5.2**: Execute dependency installation: `npm install`
**R5.3**: Launch application: `npm start`
**R5.4**: For development with auto-restart: `npm run dev:watch`

## Usage Workflow

### Project Creation
**R6.1**: Click "Create New Project" button on dashboard
**R6.2**: Configure project name and template selection
**R6.3**: Monitor real-time progress (Planning → Scaffolding → Installing → Ready)
**R6.4**: Project automatically opens in Project Viewer with tabbed interface

### Component Discovery
**R7.1**: Open project to automatically scan for React components
**R7.2**: View discovered components in Component Library tab
**R7.3**: Click component variants for live preview
**R7.4**: Use refresh button to update when adding new components

### Terminal Integration
**R8.1**: Click terminal button (📟) in header to open sidebar
**R8.2**: Access full shell with project context automatically injected
**R8.3**: Use `claude --continue` for AI development assistance
**R8.4**: Sessions persist across tab switches and application navigation

## Project Templates

### P5: Available Templates
**P5.1**: `react-basic` - Standard create-react-app with custom components
**P5.2**: `react-typescript` - TypeScript template with enhanced components  
**P5.3**: `react-storybook` - Enhanced component library with Storybook integration
**P5.4**: `react-storybook-tailwind` - Above plus Tailwind CSS (future enhancement)

### P6: Component Variant System
Templates include components with variant definitions:
```javascript
// Components define variants directly in files
Button.variants = [
  { name: 'primary', props: { variant: 'primary' } },
  { name: 'secondary', props: { variant: 'secondary' } },
  { name: 'large', props: { size: 'large' } }
];
```

## Technical Architecture

### P7: Implementation Principles
**P7.1**: Pure function implementation for all business logic
**P7.2**: Immutable data structures with Result types for error handling
**P7.3**: Secure IPC communication with context isolation enabled
**P7.4**: Process isolation with proper cleanup and resource management

## Troubleshooting

### Common Issues
**R9.1**: Terminal not working - Ensure node-pty is rebuilt for your Electron version
**R9.2**: Server won't start - Check port availability (3000-3100 range)
**R9.3**: Component discovery fails - Verify components follow supported patterns
**R9.4**: Project creation fails - Check npm/yarn installation and network access

### Debug Mode
**R10.1**: Enable debug logging in Settings → Advanced
**R10.2**: Use developer tools (F12) for error inspection
**R10.3**: Check console logs for detailed error information

## File Structure

```
design-tool/
├── main.js          # Electron main process
├── app.js           # Frontend application logic  
├── preload.js       # Secure IPC bridge
├── index.html       # Application UI and styling
├── lib/             # Pure function library
├── package.json     # Dependencies and scripts
└── CLAUDE.md        # Generative Analysis specification
```

## Development

### Functional Programming Approach
- **Pure Functions**: All business logic implemented without side effects
- **Immutable Data**: State updates create new objects rather than mutations
- **Error Handling**: Result types rather than exceptions for predictable flows
- **Testability**: Isolated functions enable comprehensive unit testing

### Contributing
1. Read `CLAUDE.md` for complete technical specification
2. Follow functional programming principles
3. Update propositions and requirements for all changes
4. Maintain documentation currency with implementation

## License

MIT License - See LICENSE file for details

---

**Design Tool v0.1.0** - Complete React project management with embedded Claude Code assistance following Generative Analysis methodology.