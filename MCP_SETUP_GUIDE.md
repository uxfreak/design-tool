# MCP Server Setup Guide for Design Tool

> Complete guide to configuring Model Context Protocol (MCP) servers for use with Claude Code in the Design Tool

## Overview

The Design Tool integrates Claude Code via a global terminal sidebar, providing AI-powered development assistance. To unlock the full potential of Claude Code, you can configure MCP (Model Context Protocol) servers that extend Claude's capabilities with external tools and services.

## Automatic Figma MCP Installation ✨

### What's New
🎉 **The Design Tool now automatically installs the Figma MCP server in ALL new projects!**

### Prerequisites
1. Figma Dev Mode MCP server running on `http://127.0.0.1:3845/sse`
2. Claude Code CLI installed and accessible
3. Design Tool application ready

### Automatic Installation Process

#### What Happens When You Create a Project
1. **Project Creation**: Standard React project scaffolding with create-react-app
2. **Dependency Installation**: npm install runs automatically
3. **Figma MCP Configuration**: ✨ **NEW** - Automatically creates `.mcp.json` with Figma MCP server
4. **Ready to Use**: Open terminal sidebar and Figma MCP is immediately available

#### Generated .mcp.json File
Every new project automatically gets:
```json
{
  "mcpServers": {
    "figma-dev-mode-mcp-server": {
      "type": "sse",
      "url": "http://127.0.0.1:3845/sse"
    }
  }
}
```

### Manual Setup (For Existing Projects Only)

#### For Projects Created Before Auto-Install
```bash
# Add to existing project
cd your-existing-project
claude mcp add -s project --transport sse figma-dev-mode-mcp-server http://127.0.0.1:3845/sse
```

#### Custom Configuration (Advanced Users)
Edit `.mcp.json` in your project root to add additional servers:
```json
{
  "mcpServers": {
    "figma-dev-mode-mcp-server": {
      "type": "sse",
      "url": "http://127.0.0.1:3845/sse"
    },
    "file-system": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/project"],
      "env": {}
    }
  }
}
```

### Verification Steps

1. **Open Design Tool Terminal Sidebar**:
   - Click the terminal button (📟) in the top right header
   - The terminal sidebar slides in from the right

2. **Test MCP Connection**:
   ```bash
   claude --continue
   /mcp  # Lists all available MCP servers
   ```

3. **Test Figma Integration**:
   ```bash
   claude "help me access figma design tokens"
   ```

## Configuration Scopes

### User Scope (`-s user`)
- **Location**: `~/.config/claude-code/`
- **Usage**: Personal tools available across all projects
- **Benefits**: No duplication, consistent availability
- **Example**: Development tools, personal APIs

### Project Scope (`-s project`)
- **Location**: `.mcp.json` in project root
- **Usage**: Team collaboration, project-specific tools
- **Benefits**: Shareable via version control, team consistency
- **Example**: Project APIs, shared databases, design tools

### Local Scope (default)
- **Location**: Current working directory
- **Usage**: Temporary or experiment configurations
- **Benefits**: Isolated testing, no global impact

## Advanced MCP Server Configurations

### 1. File System Server
Allows Claude Code to read/write files:
```bash
claude mcp add -s project filesystem npx -y @modelcontextprotocol/server-filesystem /path/to/allowed/directory
```

### 2. GitHub Integration
Connect to GitHub APIs:
```bash
claude mcp add -s user -e GITHUB_PERSONAL_ACCESS_TOKEN=your_token github npx -y @modelcontextprotocol/server-github
```

### 3. PostgreSQL Database
Database query capabilities:
```bash
claude mcp add -s project -e DATABASE_URL=postgresql://user:pass@host:port/db postgres npx -y @modelcontextprotocol/server-postgres
```

### 4. Sequential Thinking Server
Enhanced reasoning for complex tasks:
```bash
claude mcp add -s user sequential-thinking npx -y mcp-sequentialthinking-tools
```

## Environment Variables and Security

### Setting Environment Variables
```bash
# Add server with environment variables
claude mcp add -s project -e API_KEY=your_key -e BASE_URL=https://api.example.com custom-api /path/to/server
```

### Security Best Practices

1. **Trust Verification**: Only use MCP servers from trusted sources
2. **Network Security**: Be cautious with servers that connect to the internet
3. **Environment Variables**: Store sensitive data in environment variables, not in configuration files
4. **Project Approval**: Claude Code prompts for approval before using project-scoped servers

### Resetting Approvals
```bash
# Reset project approval choices
claude mcp reset-project-choices
```

## Using MCP Servers in Design Tool

### Via Terminal Sidebar

1. **Open Terminal**: Click the terminal button (📟) in the header
2. **Start Claude**: Type `claude --continue` or `claude "your question"`
3. **Use MCP Commands**: Access MCP prompts with `/mcp__servername__promptname`
4. **Implicit Usage**: Claude automatically uses relevant MCP servers for your queries

### Context-Aware Integration

The Design Tool automatically injects context into the terminal environment:
- Current project name and directory
- Active view (dashboard, project viewer, settings)
- Project configuration and metadata
- Server status and development environment

### Example Workflows

#### Design Token Extraction
```bash
claude "extract design tokens from the figma file and convert them to CSS variables"
```

#### Component Generation
```bash
claude "create a React component based on the figma design and add it to my project"
```

#### File Operations
```bash
claude "read the current project structure and suggest improvements"
```

## Troubleshooting

### Common Issues

**"No MCP servers configured" Error**:

1. **Check if .mcp.json exists in your project**:
   ```bash
   ls -la .mcp.json
   cat .mcp.json
   ```

2. **Verify you're in the correct directory**:
   ```bash
   pwd  # Should be in your project root where .mcp.json exists
   ```

3. **Check if Figma MCP server is running**:
   ```bash
   curl http://127.0.0.1:3845/sse
   # Should return a response, not connection refused
   ```

4. **Reset project approvals** (Claude Code might be waiting for approval):
   ```bash
   claude mcp reset-project-choices
   ```

5. **Restart Claude Code session**:
   ```bash
   # Exit current Claude session and restart
   exit
   claude --continue
   /mcp  # Should now show figma-dev-mode-mcp-server
   ```

**Server Not Found**:
```bash
# Check available servers
/mcp

# Verify configuration
claude mcp list
```

**Permission Denied**:
```bash
# Reset project choices
claude mcp reset-project-choices
```

**Connection Failed**:
- Verify the MCP server is running on the specified URL: `http://127.0.0.1:3845/sse`
- Check firewall and network settings
- Ensure Figma Dev Mode MCP server is properly installed and running

### Debug Mode
```bash
# Start Claude with debug output
claude --debug "test mcp connection"
```

### Configuration File Validation
```bash
# Validate .mcp.json syntax
cat .mcp.json | jq .

# Check if file format is correct
cat .mcp.json | jq '.mcpServers."figma-dev-mode-mcp-server"'
```

### Manual Test
If automatic installation isn't working, test manual installation:
```bash
# In your project directory
claude mcp add -s project --transport sse figma-dev-mode-mcp-server http://127.0.0.1:3845/sse

# Then check
claude --continue
/mcp
```

## Integration with Design Tool Features

### Project Creation
- MCP servers can enhance project scaffolding
- Access design systems and component libraries
- Generate boilerplate code from designs

### Component Discovery
- Extract component variants from design files
- Sync design tokens with code
- Validate component consistency

### Workflow Management
- Connect workflows to external services
- Automated testing and deployment
- Design-to-code synchronization

## Next Steps

1. **Configure Essential MCP Servers**: Start with Figma Dev Mode, file system, and GitHub
2. **Team Adoption**: Use project-scoped configurations for team consistency
3. **Custom Servers**: Develop custom MCP servers for specific workflows
4. **Automation**: Integrate MCP capabilities into Design Tool workflows

## Resources

- [Official MCP Documentation](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [MCP Server Registry](https://modelcontextprotocol.io/)
- [Claude Code CLI Reference](https://docs.anthropic.com/en/docs/claude-code)
- [Design Tool Documentation](./USER_GUIDE.md)

---

**Design Tool MCP Integration** - Extend Claude Code's capabilities with external tools and services for enhanced development workflows.