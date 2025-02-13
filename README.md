# Sticky Notes App 📝

A modern Electron-based desktop application for managing your notes with a sleek interface, featuring real-time sync and pinnable floating windows.

## Features ✨

- **Rich Text Editor**: Full-featured text editor powered by TipTap
- **Dark/Light Theme**: Switch between dark and light modes
- **Note Pinning**: Pin notes as floating windows with adjustable opacity
- **Auto-Save**: Changes are saved automatically
- **SQLite Storage**: Local database for reliable data persistence
- **Real-time Sync**: Changes sync across all windows instantly
- **Modern UI**: Clean interface with smooth animations

## Key Components 📦

### Main Window

- Notes grid display
- Note creation/editing
- Theme switching
- Note management

### Pinned Window

- Floating note display
- Opacity control
- Real-time editing
- Auto-sync with main window

### Data Management

- **Auto-saving** changes
- **Real-time** updates
- Database backup
- Safe connection handling

## Technologies Used 🔧

- Electron
- React
- SQLite3
- TipTap Editor
- Tailwind CSS
- Lucide Icons
- Node.js

## Usage 💡

### Creating Notes

1. Click the '+' button in the top right
2. Enter a title for your note
3. Write your note content using the rich text editor
4. Click 'Save' to store your note

### Pinning Notes

1. Click the pin icon on any note
2. The note will appear in a floating window
3. Adjust opacity using '+' and '-' buttons
4. Edit content directly in the floating window

## Technical Details 🛠️

### Database Schema

```sql
CREATE TABLE notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Architecture

#### Frontend

- React for UI components
- TipTap for rich text editing
- Tailwind CSS for styling
- Lucide icons for UI elements

#### Backend

- Electron for desktop runtime
- SQLite3 for data storage
- IPC for window communication

## Installation 🚀

```bash
# Clone the repository
git clone https://github.com/Mbalajiviswanadh/Sticky-Notes

# Navigate to project directory
cd sticky-notes-app

# Install dependencies
npm install

# Run in development mode
npm run dev
```

### Build Commands

```bash
# Build for production (all platforms)
npm run build

# Build for Windows
npm run build:win

# Build for macOS
npm run build:mac

# Build for Linux
npm run build:linux
```
