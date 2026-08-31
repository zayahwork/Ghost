Wire the editor home sidebars and dialogs to the real project API

### Data Fetching

The editor home page is a server componenet.

Fetch owner and shared projects server-side using the existing project data helper and pass both lists to the sidebar.

No client-side fetching for initial load.

### 'Use Project Actions'

Create a hook in 'hooks/' that manages dialog state and project mutations.

**Create**

- manage create dialog state
- manage project name input
- generate a short unique suffix
- slugify the name to create the room ID
- call 'POST /api/projects'
- navigate to the new workspace

The project ID and Liveblocks room ID should stay aligned

**Rename**

- store target project id + current name
- call 'PATCH /api/projects/[id]'
- redirect to '/editor' if deleting the active workspace
- otherwise refresh