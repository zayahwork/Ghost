We need the base chrome components that frame every editor screen - the top navbar and the left sidebar shell. These will be reused and extended in every chapter that follows.

### Editor Navbar

Create 'components/editor/editor-navbar.tsx'.

Requirements:

- Fixed-height top navbar
- Left, center, and right sections
- use 'PanelLeftOpen' / 'PanelLeftClose' icons based on the sidebar state
- right section stays empty for now
- dark background with subtle bottom border

### Project Sidebar

Create 'components/editor/project-sidebar.tsx'.

Requirments:

- sidebar should float above the editor
- opening it hsould not push page content
- slides in from the left
- accepts 'isOpen' prop
- header with 'Projects' title + close button
- shadecn 'Tabs':
  - My Projects
  - Shared
- both tabs show empty placeholder state
- full-width 'New Project' button at the bottom with 'Plus' icon

### Dialog Pattern

Use the existing color tokens from 'globals.css' for dialog styling.

Support:

- title
- description
- footer actions

Do not build actual dialogs yet.

### Check when done

- new components compile without TypeScript erros
- no lint erros
- dialog pattern is ready for future use