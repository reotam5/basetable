# Basetable

A comprehensive AI-powered workspace platform with integrated local and remote LLM capabilities, Model Context Protocol (MCP) support, and multi-platform deployment options.

## Demo

### Video Demo

Watch how local LLM models use MCP server to interact with your terminal:

https://github.com/user-attachments/assets/c7ca0636-b16c-4b56-9fcf-77e5d6aaa35c

### UI Design Showcase

<div align="center">
  
  **Settings Interface**
  
  <img width="1280" alt="Settings View 1" src="https://github.com/user-attachments/assets/502b5a03-d91f-4662-926f-c657d6dd1b1a" />
  
  <img width="1280" alt="Settings View 2" src="https://github.com/user-attachments/assets/bc443951-5501-43c1-9297-4a9bb9995018" />
  
  <img width="1280" alt="Settings View 3" src="https://github.com/user-attachments/assets/0205050b-d711-4ace-8efb-76050548310a" />
  
  **AI Agent Interface**
  
  <img width="1280" alt="Agent View" src="https://github.com/user-attachments/assets/ea27d8e7-083e-4a1a-8a52-5bf418ca3bbd" />
  
</div>



## Desktop Application

### Features

- **LLM Integration**: Support for both local and remote LLM models
- **Model Context Protocol (MCP)**: Extensible tool and resource system
- **Encrypted Database**: SQLCipher-based secure local storage
- **Model Downloads**: Background downloading and management of local models

### Tech Stack

- **Framework**: Electron 36
- **Frontend**: React 18 + TypeScript
- **Router**: TanStack Router
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI + Shadcn
- **Database**: SQLCipher + Drizzle ORM
- **Build Tool**: Vite 6

### Development

```bash
cd desktop
npm run dev
```


## Backend Services

### Tech Stack

- **Language**: Go 1.23.6
- **ORM**: GORM
- **Authentication**: Auth0
- **Payment**: Stripe


### Development

```bash
cd backend
go mod download          # Download dependencies
go run cmd/basetable/main.go  # Run the application
```
