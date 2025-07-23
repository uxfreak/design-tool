# Design Tool - System Flows Documentation

## Overview

This document provides detailed flow diagrams and interaction patterns for all major system operations in the Design Tool application.

## Table of Contents

1. [Application Startup Flow](#application-startup-flow)
2. [Project Creation Flow](#project-creation-flow)
3. [Project Opening Flow](#project-opening-flow)
4. [Development Server Management](#development-server-management)
5. [Component Discovery Flow](#component-discovery-flow)
6. [Terminal Integration Flow](#terminal-integration-flow)
7. [Thumbnail Generation Flow](#thumbnail-generation-flow)
8. [Settings Management Flow](#settings-management-flow)
9. [Error Handling Flows](#error-handling-flows)
10. [Resource Cleanup Flows](#resource-cleanup-flows)

---

## Application Startup Flow

```
APPLICATION INITIALIZATION SEQUENCE:

┌─────────────────┐
│   Electron      │
│   Main Process  │
│   Started       │
└─────────────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Settings │───▶│   Initialize    │───▶│   Create Main   │
│   (electron-    │    │   Store &       │    │   Window        │
│    store)       │    │   Defaults      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Validate      │    │   Setup IPC     │    │   Load Preload  │
│   Directory     │    │   Handlers      │    │   Script        │
│   Paths         │    │   Registry      │    │   (Security)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                    ┌─────────────────┐
                    │   Show Window   │
                    │   & Load        │
                    │   Frontend      │
                    └─────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   Frontend      │
                    │   Initialize    │
                    │   - Load CSS    │
                    │   - Init Icons  │
                    │   - Load Projects│
                    └─────────────────┘
```

**Key Components:**
- **electron-store**: Settings persistence and defaults
- **IPC Registry**: All communication handlers setup
- **Security**: Context isolation and preload script
- **Frontend Bootstrap**: UI initialization and project loading

---

## Project Creation Flow

```
PROJECT CREATION WORKFLOW:

┌─────────────────┐
│   User Clicks   │
│   "Create       │
│   Project"      │
└─────────────────┘
         │
         ▼
┌─────────────────┐    ╔═══════════════════╗    ┌─────────────────┐
│   Show Create   │───▶║   INPUT           ║───▶│   Validate      │
│   Project Modal │    ║   VALIDATION      ║    │   Project       │
│                 │    ║                   ║    │   Name &        │
│                 │    ║   • Name (3-50)   ║    │   Template      │
│                 │    ║   • Template      ║    │                 │
│                 │    ║   • Uniqueness    ║    │                 │
└─────────────────┘    ╚═══════════════════╝    └─────────────────┘
                                                          │
                                                          ▼
    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
    │   Show Progress │◀───│   Generate      │◀───│   Create        │
    │   Modal with    │    │   Unique ID     │    │   Project       │
    │   Steps         │    │   & Config      │    │   Config        │
    └─────────────────┘    └─────────────────┘    └─────────────────┘
             │                                             
             ▼                                             
    ╔═══════════════════╗                                 
    ║   STEP 1:         ║                                 
    ║   PLANNING        ║                                 
    ║                   ║                                 
    ║   • Validate path ║                                 
    ║   • Check space   ║                                 
    ║   • Setup plan    ║                                 
    ╚═══════════════════╝                                 
             │                                             
             ▼                                             
    ╔═══════════════════╗    ┌─────────────────┐    ┌─────────────────┐
    ║   STEP 2:         ║───▶│   Create        │───▶│   Generate      │
    ║   SCAFFOLDING     ║    │   Directory     │    │   Template      │
    ║                   ║    │   Structure     │    │   Files         │
    ║   • Create dirs   ║    │                 │    │   - package.json│
    ║   • Generate files║    │                 │    │   - React files │
    ║   • Write content ║    │                 │    │   - Config files│
    ╚═══════════════════╝    └─────────────────┘    └─────────────────┘
             │                                             
             ▼                                             
    ╔═══════════════════╗    ┌─────────────────┐    ┌─────────────────┐
    ║   STEP 3:         ║───▶│   Spawn npm     │───▶│   Monitor       │
    ║   INSTALLING      ║    │   install       │    │   Progress &    │
    ║                   ║    │   Process       │    │   Output        │
    ║   • npm install   ║    │                 │    │                 │
    ║   • Dependencies  ║    │                 │    │                 │
    ╚═══════════════════╝    └─────────────────┘    └─────────────────┘
             │                                             
             ▼                                             
    ╔═══════════════════╗    ┌─────────────────┐    ┌─────────────────┐
    ║   STEP 4:         ║───▶│   Add Custom    │───▶│   Setup         │
    ║   CONFIGURING     ║    │   Components    │    │   Workflows     │
    ║                   ║    │   & Variants    │    │   & Registry    │
    ║   • Add components║    │                 │    │                 │
    ║   • Setup config  ║    │                 │    │                 │
    ╚═══════════════════╝    └─────────────────┘    └─────────────────┘
             │                                             
             ▼                                             
    ╔═══════════════════╗    ┌─────────────────┐    ┌─────────────────┐
    ║   STEP 5:         ║───▶│   Add to        │───▶│   Close Modal  │
    ║   READY           ║    │   Project       │    │   & Refresh     │
    ║                   ║    │   Registry      │    │   Dashboard     │
    ║   • Project ready ║    │                 │    │                 │
    ║   • Success msg   ║    │                 │    │                 │
    ╚═══════════════════╝    └─────────────────┘    └─────────────────┘
```

**Error Handling Branch:**
```
At any step, if error occurs:
    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
    │   Error         │───▶│   Show Error    │───▶│   Allow Retry   │
    │   Detected      │    │   Message       │    │   or Cancel     │
    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## Project Opening Flow

```
PROJECT OPENING SEQUENCE:

┌─────────────────┐
│   User Clicks   │
│   Project Card  │
│   "Open"        │
└─────────────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Get Project   │───▶│   Update App    │───▶│   Show Project  │
│   Data from     │    │   Context &     │    │   View          │
│   Registry      │    │   Breadcrumbs   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Validate      │    │   Set Terminal  │    │   Initialize    │
│   Project       │    │   CWD to        │    │   Project Tabs  │
│   Path Exists   │    │   Project Path  │    │   (Components)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │
         ▼
    ╔═══════════════════════════════════════════════════════════════╗
    ║                 PARALLEL BACKGROUND TASKS                     ║
    ╠═══════════════════════════════════════════════════════════════╣
    ║                                                               ║
    ║  ┌─────────────────┐    ┌─────────────────┐    ┌────────────┐ ║
    ║  │   Start Dev     │    │   Discover      │    │   Load     │ ║
    ║  │   Server        │    │   Components    │    │   Existing │ ║
    ║  │   (Background)  │    │   (File Scan)   │    │   Workflows│ ║
    ║  └─────────────────┘    └─────────────────┘    └────────────┘ ║
    ║           │                       │                   │       ║
    ║           ▼                       ▼                   ▼       ║
    ║  ┌─────────────────┐    ┌─────────────────┐    ┌────────────┐ ║
    ║  │   Port          │    │   Parse React   │    │   Create   │ ║
    ║  │   Allocation    │    │   Components    │    │   Default  │ ║  
    ║  │   & Spawn       │    │   Extract Props │    │   Workflow │ ║
    ║  └─────────────────┘    └─────────────────┘    └────────────┘ ║
    ║           │                       │                   │       ║
    ║           ▼                       ▼                   ▼       ║
    ║  ┌─────────────────┐    ┌─────────────────┐    ┌────────────┐ ║
    ║  │   Monitor       │    │   Build         │    │   Update   │ ║
    ║  │   Server        │    │   Component     │    │   Registry │ ║
    ║  │   Startup       │    │   Library Data  │    │   Metadata │ ║
    ║  └─────────────────┘    └─────────────────┘    └────────────┘ ║
    ╚═══════════════════════════════════════════════════════════════╝
                                      │
                                      ▼
                          ┌─────────────────┐
                          │   All Tasks     │
                          │   Complete      │
                          │   Update UI     │
                          └─────────────────┘
                                      │
                                      ▼
                ╔═══════════════════════════════════════╗
                ║           READY STATE                 ║
                ╠═══════════════════════════════════════╣
                ║  • Server Status: READY               ║
                ║  • Components: Loaded & Displayed     ║
                ║  • Workflows: Available for Preview   ║
                ║  • Terminal: Context Injected         ║
                ║  • Live Features: Enabled             ║
                ╚═══════════════════════════════════════╝
```

**Server Startup Detail Flow:**
```
SERVER STARTUP (Background Process):

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Check if      │───▶│   Allocate      │───▶│   Set Env       │
│   Already       │    │   Available     │    │   Variables     │
│   Running       │    │   Port          │    │   PORT, BROWSER │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                                             │
         ▼ (if not running)                            ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Update Status │◀───│   Monitor       │◀───│   Spawn npm     │
│   to STARTING   │    │   stdout/stderr │    │   start Process │
│                 │    │   for "ready"   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼ (on success)          ▼ (on error)
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Update UI     │    │   Status: READY │    │   Status: FAILED│
│   Indicators    │    │   Enable Live   │    │   Show Error    │
│                 │    │   Features      │    │   Allow Retry   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## Development Server Management

```
SERVER LIFECYCLE MANAGEMENT:

                          ┌─────────────────┐
                          │   Server        │
                          │   Manager       │
                          │   (State Map)   │
                          └─────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
        ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
        │   START         │ │   MONITOR       │ │   STOP          │
        │   REQUEST       │ │   HEALTH        │ │   REQUEST       │
        └─────────────────┘ └─────────────────┘ └─────────────────┘
                 │                   │                   │
                 ▼                   ▼                   ▼
        
START FLOW:                MONITOR FLOW:         STOP FLOW:
┌─────────────────┐       ┌─────────────────┐   ┌─────────────────┐
│   Check Port    │       │   Periodic      │   │   Send SIGTERM  │
│   Availability  │       │   Health Check  │   │   to Process    │
└─────────────────┘       └─────────────────┘   └─────────────────┘
         │                           │                   │
         ▼                           ▼                   ▼
┌─────────────────┐       ┌─────────────────┐   ┌─────────────────┐
│   Spawn npm     │       │   Update Status │   │   Wait for      │
│   start with    │       │   Indicators    │   │   Clean Exit    │
│   PORT env      │       └─────────────────┘   └─────────────────┘
└─────────────────┘                                       │
         │                                                ▼
         ▼                                       ┌─────────────────┐
┌─────────────────┐                             │   Clean up      │
│   Wait for      │                             │   Resources &   │
│   "ready" in    │                             │   Update State  │
│   stdout        │                             └─────────────────┘
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   Register      │
│   Server in     │
│   Process Map   │
└─────────────────┘
```

**Port Allocation Strategy:**
```
PORT ALLOCATION ALGORITHM:

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Get Port      │───▶│   Check Used    │───▶│   Try Next      │
│   Range from    │    │   Ports Set     │    │   Available     │
│   Settings      │    │                 │    │   Port          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │   Test Port     │
                                              │   Binding       │
                                              │   (TCP Check)   │
                                              └─────────────────┘
                                                       │
                                ┌─────────────────────┼─────────────────────┐
                                ▼ (available)                              ▼ (in use)
                      ┌─────────────────┐                        ┌─────────────────┐
                      │   Reserve Port  │                        │   Increment &   │
                      │   Add to Used   │                        │   Try Next      │
                      │   Set           │                        │   Port          │
                      └─────────────────┘                        └─────────────────┘
                                │                                          │
                                ▼                                          │
                      ┌─────────────────┐                                  │
                      │   Return Port   │                                  │
                      │   for Server    │◀─────────────────────────────────┘
                      │   Startup       │
                      └─────────────────┘
```

---

## Component Discovery Flow

```
COMPONENT DISCOVERY ENGINE:

┌─────────────────┐
│   Project Path  │
│   Input         │
└─────────────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Recursive     │───▶│   Filter React  │───▶│   Read File     │
│   File System  │    │   Files (.jsx,  │    │   Contents      │
│   Scan          │    │   .tsx)         │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │   Parse File    │
                                              │   with Babel    │
                                              │   AST Parser    │
                                              └─────────────────┘
                                                       │
                                                       ▼
                    ╔═══════════════════════════════════════════════════════════╗
                    ║                    AST ANALYSIS                           ║
                    ╠═══════════════════════════════════════════════════════════╣
                    ║                                                           ║
                    ║  ┌─────────────────┐    ┌─────────────────┐    ┌────────┐ ║
                    ║  │   Find React    │    │   Extract       │    │  Find  │ ║
                    ║  │   Components    │    │   Props &       │    │  Story │ ║
                    ║  │   (Function/    │    │   PropTypes     │    │  Files │ ║
                    ║  │   Class)        │    │                 │    │        │ ║
                    ║  └─────────────────┘    └─────────────────┘    └────────┘ ║
                    ║           │                       │                 │     ║
                    ║           ▼                       ▼                 ▼     ║
                    ║  ┌─────────────────┐    ┌─────────────────┐    ┌────────┐ ║
                    ║  │   Detect        │    │   Type          │    │  Link  │ ║
                    ║  │   Export Type   │    │   Analysis      │    │  Stories│ ║
                    ║  │   (default/     │    │   (TypeScript/  │    │  to    │ ║
                    ║  │   named)        │    │   PropTypes)    │    │  Comp. │ ║
                    ║  └─────────────────┘    └─────────────────┘    └────────┘ ║
                    ║           │                       │                 │     ║
                    ║           ▼                       ▼                 ▼     ║
                    ║  ┌─────────────────┐    ┌─────────────────┐    ┌────────┐ ║
                    ║  │   Find          │    │   Extract       │    │  Parse │ ║
                    ║  │   Dependencies  │    │   Default       │    │  Story │ ║
                    ║  │   (imports)     │    │   Props         │    │  Args  │ ║
                    ║  └─────────────────┘    └─────────────────┘    └────────┘ ║
                    ╚═══════════════════════════════════════════════════════════╝
                                                       │
                                                       ▼
                              ┌─────────────────────────────────────┐
                              │          VARIANT DETECTION          │
                              │                                     │
                              │  • Look for prop combination        │
                              │    patterns in stories              │
                              │  • Analyze boolean/enum props       │
                              │  • Extract variant names from       │
                              │    story exports                    │
                              │  • Build variant prop mapping       │
                              └─────────────────────────────────────┘
                                                       │
                                                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Build Final   │───▶│   Store in      │───▶│   Return        │
│   Component     │    │   Component     │    │   Component     │
│   Metadata      │    │   Registry      │    │   Array         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Component Metadata Structure:**
```javascript
{
  name: "Button",
  filePath: "/absolute/path/to/Button.jsx",
  relativePath: "src/components/Button.jsx",
  exportType: "default",
  props: [
    {
      name: "variant",
      type: "'primary' | 'secondary' | 'danger'",
      required: false,
      defaultValue: "primary"
    },
    {
      name: "size",
      type: "'small' | 'medium' | 'large'",
      required: false,
      defaultValue: "medium"
    }
  ],
  variants: [
    {
      name: "Primary",
      props: { variant: "primary", size: "medium" }
    },
    {
      name: "Secondary Small",
      props: { variant: "secondary", size: "small" }
    }
  ],
  dependencies: ["react", "classnames"],
  hasStories: true,
  storiesPath: "/absolute/path/to/Button.stories.jsx"
}
```

---

## Terminal Integration Flow

```
TERMINAL INTEGRATION ARCHITECTURE:

┌─────────────────┐
│   User Opens    │
│   Terminal      │
│   Sidebar       │
└─────────────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Initialize    │───▶│   Gather        │───▶│   Create PTY    │
│   xterm.js      │    │   Current       │    │   Process with  │
│   Terminal      │    │   Context       │    │   Context       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Setup Fit     │    │   Context Info: │    │   Inject Env    │
│   Addon for     │    │   • Project ID  │    │   Variables:    │
│   Responsive    │    │   • Project Path│    │   DESIGN_TOOL_* │
│   Sizing        │    │   • Current File│    │                 │
│                 │    │   • Server URL  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                                             │
         ▼                                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EVENT FLOW SETUP                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐   │
│  │   Terminal      │───▶│   preload.js    │───▶│   Main      │   │
│  │   Input         │    │   IPC Bridge    │    │   Process   │   │
│  │   (keystrokes)  │    │   pty:write     │    │   PTY       │   │
│  └─────────────────┘    └─────────────────┘    └─────────────┘   │
│           ▲                                             │        │
│           │                                             ▼        │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐   │
│  │   Terminal      │◀───│   preload.js    │◀───│   Shell     │   │
│  │   Display       │    │   IPC Bridge    │    │   Output    │   │
│  │   (output)      │    │   pty:data      │    │   Stream    │   │
│  └─────────────────┘    └─────────────────┘    └─────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Context Injection Detail:**
```
CONTEXT INJECTION PROCESS:

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Gather App    │───▶│   Build Context │───▶│   Convert to    │
│   State Data    │    │   Object        │    │   Environment   │
│                 │    │                 │    │   Variables     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Current Data: │    │   Context:      │    │   ENV Variables:│
│   • projectId   │    │   {             │    │   DESIGN_TOOL_  │
│   • projectName │    │     projectId,  │    │   PROJECT_ID=   │
│   • projectPath │    │     projectName,│    │   proj_123      │
│   • currentFile │    │     projectPath,│    │                 │
│   • serverUrl   │    │     ...         │    │   DESIGN_TOOL_  │
│   • activeTab   │    │   }             │    │   PROJECT_PATH= │
│                 │    │                 │    │   /path/to/proj │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │   PTY Process   │
                                              │   Inherits ENV  │
                                              │   & Starts      │
                                              │   Claude Code   │
                                              └─────────────────┘
```

**Terminal Command Flow:**
```
COMMAND EXECUTION FLOW:

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Types    │───▶│   xterm.js      │───▶│   Buffer Input  │
│   Command       │    │   Captures      │    │   Until Enter   │
│                 │    │   Keystrokes    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Process       │◀───│   Send to PTY   │◀───│   Complete      │
│   Command in    │    │   via IPC       │    │   Command Line  │
│   Shell         │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Command       │───▶│   Stream Output │───▶│   Display in    │
│   Execution     │    │   Back via IPC  │    │   Terminal      │
│   (with context)│    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## Thumbnail Generation Flow

```
THUMBNAIL GENERATION PROCESS:

┌─────────────────┐
│   Thumbnail     │
│   Request       │
│   (projectId)   │
└─────────────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Check Server  │───▶│   Server        │───▶│   Create Hidden │
│   Status        │    │   Running?      │    │   Browser       │
│                 │    │                 │    │   Window        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼ (not running)          ▼ (running)            ▼
┌─────────────────┐              │                ┌─────────────────┐
│   Return        │              │                │   Configure     │
│   Template      │              │                │   Window:       │
│   Fallback      │              │                │   • 1200x800    │
│   Thumbnail     │              │                │   • Hidden      │
└─────────────────┘              │                │   • No Security │
                                 │                └─────────────────┘
                                 │                         │
                                 │                         ▼
                    ┌─────────────────┐         ┌─────────────────┐
                    │   Load Project  │◀────────│   Navigate to   │
                    │   URL in        │         │   Server URL    │
                    │   Hidden Window │         │                 │
                    └─────────────────┘         └─────────────────┘
                             │
                             ▼
                    ┌─────────────────┐         ┌─────────────────┐
                    │   Wait for      │────────▶│   Capture Page  │
                    │   Page Load     │         │   Screenshot    │
                    │   (3 seconds)   │         │                 │
                    └─────────────────┘         └─────────────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │   Process       │
                                                │   Image:        │
                                                │   • Resize      │
                                                │   • Optimize    │
                                                │   • Format      │
                                                └─────────────────┘
                                                         │
                                                         ▼
                    ┌─────────────────┐         ┌─────────────────┐
                    │   Close Hidden  │◀────────│   Save to       │
                    │   Window        │         │   Thumbnail     │
                    │                 │         │   Directory     │
                    └─────────────────┘         └─────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   Return        │
                    │   Thumbnail     │
                    │   Path          │
                    └─────────────────┘
```

**Thumbnail Caching Strategy:**
```
THUMBNAIL CACHE MANAGEMENT:

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Check Existing│───▶│   File Age      │───▶│   Project       │
│   Thumbnail     │    │   vs Max Age    │    │   Modified      │
│   in Cache      │    │   (1 hour)      │    │   Time Check    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼ (exists)              ▼ (stale)               ▼ (newer)
┌─────────────────┐              │                       │
│   Return        │              └───────────────────────┘
│   Cached        │                      │
│   Thumbnail     │                      ▼
└─────────────────┘              ┌─────────────────┐
                                 │   Regenerate    │
                                 │   Thumbnail     │
                                 │   (Fresh)       │
                                 └─────────────────┘
```

---

## Settings Management Flow

```
SETTINGS MANAGEMENT SYSTEM:

┌─────────────────┐
│   Settings      │
│   Modal Open    │
└─────────────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Current  │───▶│   Populate      │───▶│   Enable Tab    │
│   Settings from │    │   Form Fields   │    │   Navigation    │
│   electron-store│    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
                    ╔═══════════════════════════════════════════════╗
                    ║                 SETTINGS TABS                 ║
                    ╠═══════════════════════════════════════════════╣
                    ║                                               ║
                    ║  ┌─────────────┐ ┌─────────────┐ ┌─────────┐  ║
                    ║  │   GENERAL   │ │ DEVELOPMENT │ │ADVANCED │  ║
                    ║  │             │ │             │ │         │  ║
                    ║  │ • Projects  │ │ • Port Range│ │ • Dev   │  ║
                    ║  │   Directory │ │ • Auto Open │ │   Tools │  ║
                    ║  │ • Default   │ │   Browser   │ │ • Max   │  ║
                    ║  │   Template  │ │             │ │   Proj. │  ║
                    ║  └─────────────┘ └─────────────┘ └─────────┘  ║
                    ╚═══════════════════════════════════════════════╝
                                           │
                            ┌──────────────┼──────────────┐
                            ▼              ▼              ▼
                 ┌─────────────────┐ ┌────────────┐ ┌─────────────────┐
                 │   Directory     │ │   Real-    │ │   Form          │
                 │   Picker        │ │   time     │ │   Validation    │
                 │   Integration   │ │   Preview  │ │   & Error       │
                 └─────────────────┘ └────────────┘ └─────────────────┘
                                                           │
                                                           ▼
SAVE FLOW:                                        ┌─────────────────┐
┌─────────────────┐    ┌─────────────────┐      │   User Clicks   │
│   Validate All  │───▶│   Show          │◀─────│   "Save"        │
│   Form Fields   │    │   Validation    │      │                 │
│                 │    │   Errors        │      └─────────────────┘
└─────────────────┘    └─────────────────┘               │
         │ (valid)                                       │
         ▼                                               │
┌─────────────────┐    ┌─────────────────┐              │
│   Prepare       │───▶│   Call Settings │              │
│   Settings      │    │   Save API      │              │
│   Object        │    │                 │              │
└─────────────────┘    └─────────────────┘              │
                                │                       │
                                ▼                       │
                       ┌─────────────────┐              │
                       │   Update        │              │
                       │   electron-     │              │
                       │   store         │              │
                       └─────────────────┘              │
                                │                       │
                                ▼                       │
                       ┌─────────────────┐              │
                       │   Success       │              │
                       │   Feedback      │              │
                       │   & Close       │──────────────┘
                       └─────────────────┘
```

**Settings Validation Rules:**
```javascript
VALIDATION SCHEMA:
{
  projectsDirectory: {
    required: true,
    type: 'string',
    validate: (path) => {
      // Must exist and be writable
      return fs.existsSync(path) && fs.accessSync(path, fs.constants.W_OK);
    }
  },
  devPortStart: {
    type: 'number',
    min: 1000,
    max: 65535,
    validate: (start, end) => start < end
  },
  devPortEnd: {
    type: 'number', 
    min: 1000,
    max: 65535,
    validate: (end, start) => end > start
  },
  maxRecentProjects: {
    type: 'number',
    min: 5,
    max: 100
  }
}
```

---

## Error Handling Flows

```
ERROR HANDLING ARCHITECTURE:

                          ┌─────────────────┐
                          │   Error         │
                          │   Occurs        │
                          └─────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
        ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
        │   VALIDATION    │ │   RUNTIME       │ │   NETWORK/IPC   │
        │   ERRORS        │ │   ERRORS        │ │   ERRORS        │
        └─────────────────┘ └─────────────────┘ └─────────────────┘
                 │                   │                   │
                 ▼                   ▼                   ▼
        ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
        │   Show Form     │ │   Log Error     │ │   Retry Logic   │
        │   Field Error   │ │   Show User     │ │   Fallback      │
        │   Inline        │ │   Message       │ │   Behavior      │
        └─────────────────┘ └─────────────────┘ └─────────────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │   Graceful      │
                                                │   Degradation   │
                                                │   Mode          │
                                                └─────────────────┘
```

**Error Recovery Patterns:**

```
PROJECT CREATION ERROR RECOVERY:

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Creation      │───▶│   Show Error    │───▶│   Offer         │
│   Fails at      │    │   with Step     │    │   Solutions:    │
│   Step N        │    │   Context       │    │   • Retry       │
└─────────────────┘    └─────────────────┘    │   • Skip Step   │
                                              │   • Cancel      │
                                              └─────────────────┘

SERVER STARTUP ERROR RECOVERY:

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Server Start  │───▶│   Port Already  │───▶│   Try Next      │
│   Fails         │    │   in Use?       │    │   Available     │
└─────────────────┘    └─────────────────┘    │   Port          │
         │                       │             └─────────────────┘
         ▼ (other error)          ▼ (dependency)
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Show Error    │    │   npm install   │───▶│   Offer Auto    │
│   with Retry    │    │   Missing?      │    │   Dependency    │
│   Button        │    │                 │    │   Installation  │
└─────────────────┘    └─────────────────┘    └─────────────────┘

COMPONENT DISCOVERY ERROR RECOVERY:

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   File Parse    │───▶│   Skip Invalid  │───▶│   Continue with │
│   Error         │    │   Files &       │    │   Valid         │
└─────────────────┘    │   Log Warning   │    │   Components    │
                       └─────────────────┘    └─────────────────┘
```

---

## Resource Cleanup Flows

```
APPLICATION CLEANUP ARCHITECTURE:

                          ┌─────────────────┐
                          │   Cleanup       │
                          │   Trigger       │
                          └─────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
        ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
        │   APP QUIT      │ │   VIEW CHANGE   │ │   IDLE CLEANUP  │
        │   (beforeunload)│ │   (dashboard)   │ │   (timeout)     │
        └─────────────────┘ └─────────────────┘ └─────────────────┘
                 │                   │                   │
                 ▼                   ▼                   ▼
        ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
        │   Immediate     │ │   Delayed       │ │   Background    │
        │   Cleanup       │ │   Cleanup       │ │   Cleanup       │
        │   All Resources │ │   (5 min delay) │ │   (selective)   │
        └─────────────────┘ └─────────────────┘ └─────────────────┘
                 │                   │                   │
                 └───────────────────┼───────────────────┘
                                     ▼
                          ┌─────────────────┐
                          │   CLEANUP       │
                          │   EXECUTION     │
                          └─────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
    ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
    │   KILL DEV      │   │   KILL PTY      │   │   CLEANUP       │
    │   SERVERS       │   │   PROCESSES     │   │   TEMP FILES    │
    └─────────────────┘   └─────────────────┘   └─────────────────┘
             │                       │                     │
             ▼                       ▼                     ▼
    ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
    │   Send SIGTERM  │   │   Send SIGTERM  │   │   Remove        │
    │   Wait for      │   │   Wait for      │   │   Thumbnail     │
    │   Clean Exit    │   │   Clean Exit    │   │   Cache         │
    └─────────────────┘   └─────────────────┘   └─────────────────┘
             │                       │                     │
             ▼                       ▼                     ▼
    ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
    │   Deallocate    │   │   Clear Session │   │   Update        │
    │   Ports         │   │   Data          │   │   Registry      │
    └─────────────────┘   └─────────────────┘   └─────────────────┘
```

**Smart Cleanup Strategy:**
```
INTELLIGENT RESOURCE MANAGEMENT:

Project Activity Tracking:
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Track Last    │───▶│   Set Cleanup   │───▶│   Monitor       │
│   Access Time   │    │   Timer         │    │   for Activity  │
│                 │    │   (5 minutes)   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼ (activity)
                       ┌─────────────────┐     ┌─────────────────┐
                       │   Timer         │     │   Reset Timer   │
                       │   Expires       │     │   Keep Resources│
                       │   Stop Server   │     │   Active        │
                       └─────────────────┘     └─────────────────┘

Memory Management:
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Monitor       │───▶│   High Memory   │───▶│   Selective     │
│   Memory Usage  │    │   Usage?        │    │   Server        │
│                 │    │                 │    │   Shutdown      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

This comprehensive system flows documentation provides detailed insights into how each major operation in the Design Tool application works, from initialization through complex multi-step processes to cleanup and resource management. Each flow is designed to be robust, user-friendly, and maintainable while following modern software architecture principles.