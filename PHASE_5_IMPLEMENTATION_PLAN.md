# Phase 5 Implementation Plan - Living Design System Manager

## Overview
Transform the Design Tool from project creator to living design system manager by connecting real project files to the UI components and workflows.

## Current State Analysis  
- ✅ Creates working React apps with functional components
- ✅ Working package.json with dev/build scripts
- ❌ Component Library shows mock data instead of real project files
- ❌ Workflows show placeholder instead of actual app structure
- ❌ No automatic workflow creation from generated landing page

## ⚡ **SIMPLIFIED APPROACH: Skip Storybook Complexity**
Instead of parsing Storybook stories, we'll create our own simpler component variant system:
- Generate components with built-in variant definitions
- Create custom preview renderer (no Storybook server needed)
- Define variants directly in component files
- Much faster development and fewer dependencies

## 🔧 **CRITICAL: FUNCTIONAL PROGRAMMING PRINCIPLES**
**ALL implementations MUST follow established functional programming patterns:**
- ✅ **Pure Functions Only**: No side effects, same input = same output
- ✅ **Immutable Data**: Never mutate objects, always return new ones
- ✅ **Function Composition**: Build complex operations from simple functions
- ✅ **Result Types**: Use { success: true/false, data/error } patterns
- ✅ **No Classes**: Everything as functions and plain objects
- ✅ **Reusable Components**: Functions should be composable and testable

---

## 🎯 STEP-BY-STEP IMPLEMENTATION GUIDE

### **Task 1: Default Workflow Creation** (HIGH PRIORITY)
**Goal**: Automatically create "Landing Page" workflow when project is created

**Implementation Steps**:

1. **Update Project Creation Pipeline** (`main.js`)
   ```javascript
   // In executeProjectCreation() after project scaffolding
   await createDefaultWorkflow(projectConfig, projectPath);
   ```

2. **Create Default Workflow Generator** (Pure Functions)
   ```javascript
   // Pure function - no side effects
   function createDefaultWorkflow(projectConfig) {
     return {
       id: `${projectConfig.id}_landing`,
       name: "Landing Page", 
       description: "Default welcome page workflow",
       steps: [
         { id: 'step_1', component: "App", screen: "Welcome Page", order: 0 }
       ],
       componentCount: 1,
       isDefault: true,
       createdAt: new Date().toISOString()
     };
   }
   
   // Pure function for adding workflow to project data
   function addWorkflowToProject(project, workflow) {
     return {
       ...project,
       workflows: [...(project.workflows || []), workflow],
       lastModified: new Date().toISOString()
     };
   }
   
   // Composition function
   async function createProjectWithDefaultWorkflow(projectConfig, projectPath) {
     const workflow = createDefaultWorkflow(projectConfig);
     const projectData = addWorkflowToProject(projectConfig, workflow);
     
     return { success: true, project: projectData, workflow };
   }
   ```

3. **Store Workflows in Project Registry**
   ```javascript
   // Add to project creation in main.js
   const projectData = {
     id: projectConfig.id,
     name: projectConfig.name,
     workflows: [defaultWorkflow], // Add this
     // ... existing fields
   };
   ```

4. **Update Workflows Display** (`app.js`)
   ```javascript
   function showWorkflowsContent(contentArea, project) {
     const workflows = project.workflows || [];
     // Replace mock workflows with real project workflows
   }
   ```

### **Task 2: Component Discovery System** (HIGH PRIORITY)
**Goal**: Scan project files to find actual React components

**Implementation Steps**:

1. **Create Component Scanner IPC Handler** (`main.js`)
   ```javascript
   ipcMain.handle('project:scan-components', async (event, projectPath) => {
     try {
       const result = await scanProjectComponents(projectPath);
       return result;
     } catch (error) {
       return { success: false, error: error.message };
     }
   });
   ```

2. **Build File System Scanner** (Pure Functions with Result Types)
   ```javascript
   // Pure function - no side effects
   function validateProjectPath(projectPath) {
     if (!projectPath || typeof projectPath !== 'string') {
       return { success: false, error: 'Invalid project path' };
     }
     return { success: true, value: projectPath };
   }
   
   // Pure function for filtering component files
   function filterComponentFiles(files) {
     return files.filter(file => 
       (file.endsWith('.jsx') || file.endsWith('.tsx')) && 
       !file.includes('.stories.') &&
       !file.includes('.test.')
     );
   }
   
   // Pure function for parsing single component
   async function parseComponentFile(filePath) {
     try {
       const content = await fs.readFile(filePath, 'utf8');
       const componentInfo = extractComponentInfo(content, filePath);
       return { success: true, component: componentInfo };
     } catch (error) {
       return { success: false, error: error.message };
     }
   }
   
   // Pure function - content parsing logic
   function extractComponentInfo(content, filePath) {
     const componentName = extractComponentName(content, filePath);
     const props = extractComponentProps(content);
     const exports = extractComponentExports(content);
     
     return {
       name: componentName,
       filePath,
       props,
       exports,
       lastModified: new Date().toISOString()
     };
   }
   
   // Main composition function
   async function scanProjectComponents(projectPath) {
     const pathValidation = validateProjectPath(projectPath);
     if (!pathValidation.success) return pathValidation;
     
     try {
       const srcPath = path.join(projectPath, 'src');
       const allFiles = await findAllFiles(srcPath);
       const componentFiles = filterComponentFiles(allFiles);
       
       const components = [];
       for (const file of componentFiles) {
         const result = await parseComponentFile(file);
         if (result.success) {
           components.push(result.component);
         }
       }
       
       return { success: true, components };
     } catch (error) {
       return { success: false, error: error.message };
     }
   }
   ```

3. **Update preload.js**
   ```javascript
   scanComponents: (projectPath) => ipcRenderer.invoke('project:scan-components', projectPath),
   ```

4. **Replace Mock Component Display** (`app.js`)
   ```javascript
   async function showComponentLibraryContent(contentArea, project) {
     const scanResult = await window.electronAPI.scanComponents(project.path);
     const realComponents = scanResult.success ? scanResult.components : [];
     
     // Generate HTML for real components instead of mock
   }
   ```

### **Task 3: Custom Variant System** (HIGH PRIORITY)  
**Goal**: Create our own simple variant system without Storybook complexity

**Implementation Steps**:

1. **Generate Components With Built-in Variants** (`main.js`)
   ```javascript
   function generateButtonComponent() {
     return `import React from 'react';
   
   export const Button = ({ variant = 'primary', size = 'medium', children, ...props }) => {
     const variantClasses = {
       primary: 'bg-blue-500 hover:bg-blue-600 text-white',
       secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
       danger: 'bg-red-500 hover:bg-red-600 text-white'
     };
     
     const sizeClasses = {
       small: 'px-2 py-1 text-sm',
       medium: 'px-4 py-2', 
       large: 'px-6 py-3 text-lg'
     };
     
     return (
       <button 
         className={\`\${variantClasses[variant]} \${sizeClasses[size]} rounded font-medium transition-colors\`}
         {...props}
       >
         {children || 'Button'}
       </button>
     );
   };
   
   // Define variants directly in component file
   Button.variants = [
     { name: 'Primary', props: { variant: 'primary', children: 'Primary Button' } },
     { name: 'Secondary', props: { variant: 'secondary', children: 'Secondary Button' } },
     { name: 'Danger', props: { variant: 'danger', children: 'Delete' } },
     { name: 'Small', props: { size: 'small', children: 'Small' } },
     { name: 'Large', props: { size: 'large', children: 'Large Button' } }
   ];
   
   export default Button;`;
   }
   ```

2. **Parse Variant Definitions From Components**
   ```javascript
   async function parseComponentVariants(filePath) {
     const content = await fs.readFile(filePath, 'utf8');
     
     // Look for Component.variants = [...] pattern
     const variantsMatch = content.match(/(\w+)\.variants\s*=\s*(\[[\s\S]*?\]);/);
     if (variantsMatch) {
       const componentName = variantsMatch[1];
       const variantsString = variantsMatch[2];
       
       try {
         // Safely evaluate the variants array
         const variants = eval(variantsString);
         return { componentName, variants };
       } catch (e) {
         console.warn('Failed to parse variants for', componentName);
       }
     }
     
     return null;
   }
   
   async function scanProjectComponents(projectPath) {
     const components = []; // from component scanner
     
     // Parse variants from each component file
     for (const component of components) {
       const variantInfo = await parseComponentVariants(component.filePath);
       if (variantInfo) {
         component.variants = variantInfo.variants;
       }
     }
     
     return components;
   }
   ```

3. **Component Detail View** (`app.js`)
   ```javascript
   function createComponentDetailView(component) {
     return `
       <div class="component-detail">
         <h3>${component.name}</h3>
         <div class="variants-section">
           ${component.variants.map(variant => `
             <div class="variant-card">
               <h4>${variant.name}</h4>
               <div class="variant-preview">
                 ${generateComponentPreview(component.name, variant.args)}
               </div>
             </div>
           `).join('')}
         </div>
       </div>
     `;
   }
   ```

### **Task 4: Custom Preview System** (MEDIUM PRIORITY)
**Goal**: Show component variants with our own preview renderer (no Storybook needed)

**Implementation Steps**:

1. **Simple Component Preview Generator**
   ```javascript
   function generateComponentPreview(component, variant) {
     const propsString = JSON.stringify(variant.props);
     
     return `
       <div class="component-preview-container">
         <div class="preview-label">${variant.name}</div>
         <div class="preview-frame">
           <iframe srcdoc="
             <!DOCTYPE html>
             <html>
             <head>
               <meta charset='utf-8'>
               <style>
                 body { margin: 0; padding: 20px; font-family: system-ui; }
                 /* Include Tailwind or basic button styles */
                 .bg-blue-500 { background-color: #3b82f6; }
                 .text-white { color: white; }
                 .px-4 { padding-left: 1rem; padding-right: 1rem; }
                 .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
                 .rounded { border-radius: 0.25rem; }
                 /* Add more utility classes as needed */
               </style>
             </head>
             <body>
               <div id='preview-root'></div>
               <script>
                 // Simple component preview without React build
                 const props = ${propsString};
                 const button = document.createElement('button');
                 button.textContent = props.children || 'Button';
                 button.className = 'px-4 py-2 rounded ' + (props.variant === 'primary' ? 'bg-blue-500 text-white' : 'bg-gray-200');
                 document.getElementById('preview-root').appendChild(button);
               </script>
             </body>
             </html>
           " frameborder="0"></iframe>
         </div>
       </div>
     `;
   }
   ```

2. **Component Library Grid Update**
   ```javascript
   function renderRealComponentLibrary(components) {
     return `
       <div class="components-grid">
         ${components.map(component => `
           <div class="component-card" onclick="openComponentDetail('${component.name}')">
             <h3>${component.name}</h3>
             <div class="component-preview">
               ${generateComponentPreview(component.name, component.variants[0]?.args)}
             </div>
             <div class="variants-count">${component.variants.length} variants</div>
           </div>
         `).join('')}
       </div>
     `;
   }
   ```

### **Task 5: Workflow Integration** (MEDIUM PRIORITY)
**Goal**: Show actual app screens as workflows

**Implementation Steps**:

1. **Page/Screen Scanner**
   ```javascript
   async function scanProjectScreens(projectPath) {
     // Find pages/screens in the project
     // Could be App.jsx, pages/, screens/, etc.
     const screens = await findScreenFiles(projectPath);
     return screens.map(screen => ({
       name: screen.name,
       component: screen.component,
       route: screen.route || '/'
     }));
   }
   ```

2. **Workflow Builder**
   ```javascript
   function createWorkflowFromScreens(screens) {
     return {
       name: "App Navigation Flow",
       description: "Complete app navigation workflow",
       steps: screens.map((screen, index) => ({
         id: `step_${index}`,
         name: screen.name,
         component: screen.component,
         order: index
       }))
     };
   }
   ```

---

## 🔧 TECHNICAL IMPLEMENTATION NOTES

### **File Parsing Strategy**
- Use AST parsing (like @babel/parser) for robust component/story parsing
- Fallback to regex patterns for simple cases
- Cache parsed results to avoid re-parsing on every view

### **Preview Generation**
- Use iframe sandboxing for component previews
- Consider using Storybook's preview functionality directly
- Implement React rendering in isolated contexts

### **Performance Considerations**
- Lazy load component scanning (only when Component Library tab is opened)
- Cache component/variant data per project
- Debounce file watching for live updates

### **Error Handling**
- Graceful fallback to mock data if scanning fails
- Clear error messages for parsing failures
- Validate component files before attempting to parse

---

## 🎯 SUCCESS CRITERIA

**After Implementation**:
1. **Default Workflow**: New projects automatically show "Landing Page" workflow
2. **Real Components**: Component Library displays actual project components (Button, etc.)
3. **Variant Discovery**: Button shows Primary/Secondary variants from stories
4. **Interactive Previews**: Components render with actual styling and behavior
5. **Living Connection**: Tool reflects real project state, not mock data

**User Experience**:
- Create project → Immediately see real landing page workflow
- Open Component Library → See actual Button component with Primary/Secondary variants
- Click component → See detailed view with all variants and interactive previews
- Tool becomes living reflection of actual React project structure

---

## 🚀 IMPLEMENTATION PRIORITY ORDER

1. **Start with Task 1**: Default workflow creation (immediate visual impact)
2. **Move to Task 2**: Component discovery (core functionality)
3. **Add Task 3**: Variant parsing (completes component story)
4. **Enhance with Task 4**: Interactive previews (polish)
5. **Complete with Task 5**: Advanced workflow integration (future phases)

**Estimated Implementation Time**: 
- Task 1: 2-3 hours
- Task 2: 4-5 hours  
- Task 3: 3-4 hours
- Task 4: 5-6 hours
- Task 5: 4-5 hours

**Total: ~12-15 hours for complete Phase 5 implementation** (reduced without Storybook complexity)

## 🎯 **Future Storybook Integration (Phase 6)**

Once the custom variant system is working perfectly, we can optionally add Storybook support:

```javascript
// Phase 6: Add Storybook as additional preview option
function generateStorybookFiles(component) {
  return {
    storyFile: generateStoryFromVariants(component.variants),
    storybookConfig: generateStorybookConfig()
  };
}

// Users can choose: Custom Preview OR Storybook OR Both
```

**Benefits of This Approach**:
- ✅ Get working system faster (no Storybook learning curve)
- ✅ Understand our needs before adding Storybook complexity  
- ✅ Can add Storybook later as enhancement, not requirement
- ✅ Users who don't know Storybook can still use the tool
- ✅ Simpler debugging and fewer moving parts

This transforms the tool from project creator to **living design system manager** - the holy grail of design tools! 🎨✨

---

## 🧮 **FUNCTIONAL PROGRAMMING CHECKLIST**

Before implementing ANY function, verify it follows these principles:

### **✅ Pure Function Requirements:**
```javascript
// ✅ GOOD - Pure function
function createWorkflow(projectConfig) {
  return { id: generateId(), name: projectConfig.name }; // Same input = same output
}

// ❌ BAD - Impure function  
function createWorkflow(projectConfig) {
  const workflow = { id: generateId() };
  workflows.push(workflow); // Side effect - mutates global state
  return workflow;
}
```

### **✅ Immutable Data Patterns:**
```javascript
// ✅ GOOD - Immutable update
function addComponentToLibrary(library, component) {
  return {
    ...library,
    components: [...library.components, component]
  };
}

// ❌ BAD - Mutates existing data
function addComponentToLibrary(library, component) {
  library.components.push(component); // Mutates input
  return library;
}
```

### **✅ Function Composition:**
```javascript
// ✅ GOOD - Composable functions
const processProject = compose(
  validateProject,
  scanComponents, 
  generateWorkflows,
  saveProject
);

// ❌ BAD - Monolithic function
function processProject(project) {
  // 100 lines of mixed concerns...
}
```

### **✅ Result Type Pattern:**
```javascript
// ✅ GOOD - Consistent error handling
function parseComponent(filePath) {
  try {
    const component = /* parsing logic */;
    return { success: true, data: component };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ❌ BAD - Throwing exceptions
function parseComponent(filePath) {
  if (invalid) throw new Error('Invalid file'); // Breaks composition
}
```

### **🔧 Reusable Function Guidelines:**

1. **Single Responsibility**: Each function does ONE thing well
2. **Predictable**: Same inputs always produce same outputs  
3. **Composable**: Can be combined with other functions
4. **Testable**: Easy to test in isolation
5. **Named Clearly**: Function name describes exactly what it does

**Remember**: If you can't easily test a function in isolation, it's probably not pure enough! 🎯