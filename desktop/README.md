# Basetable Desktop

A modern Electron-based desktop application built with React, TypeScript, and Vite.

## 🚀 Development & Build Setup

### Prerequisites

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** - [Download here](https://git-scm.com/)

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd basetable
   ```

2. **Navigate to desktop directory**
   ```bash
   cd desktop
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

### Development Commands
```bash
npm run dev
```
This command will:
- Start the Vite development server on `http://localhost:3000`
- Build the Electron main process
- Launch the Electron application
- Enable hot reloading


### Build Commands
```bash
npm run build
```
This will:
1. Build the React application (`npm run build:react`)
2. Build the Electron main process (`npm run build:electron`)
3. Package the application (`npm run package`)

The packaged app will be created at `/dist/electron`

---

## 📁 Project Structure

```
desktop/
├── 📁 electron/                    # Electron stuff
│   └── main.ts                     # Main entry point for electron
│
├── 📁 src/                         # React application source
│   ├── routeTree.gen.ts            # Auto-generated route tree (Tanstack router)
│   │
│   ├── 📁 components/              # React components
│   │   └── 📁 ui/                  # Auto-generated components (Shadcn)
│   │
│   ├── 📁 hooks/                   # Custom React hooks
│   │
│   ├── 📁 lib/                     # Utility libraries
│   │
│   └── 📁 routes/                  # Tanstack file routes (tanstack will automatically update routeTree.gen.ts)
│
└── 📁 dist/                        # Build output (generated)
    ├── 📁 react/                   # React build output
    ├── 📁 main/                    # Electron main process build
    └── 📁 electron/                # Packaged application
```

### Key Directories Explained

#### `/src/routes/`
File-based routing using TanStack Router:
- Each folder represents a route segment
- `index.tsx` files are the default route for that segment
- Nested folders create nested routes
- Make sure that you are running `npm run dev` while making changes to this folder 
so that tanstack will automatically update routeTree.gen.ts


### Technology Stack

- **Frontend**: React 18 + TypeScript
- **Desktop**: Electron 36
- **Build Tool**: Vite 6
- **Router**: TanStack Router
- **Styling**: Tailwind CSS 4
- **UI Components**: Shadcn UI