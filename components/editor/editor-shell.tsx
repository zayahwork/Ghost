"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import { CreateProjectDialog } from "@/components/editor/create-project-dialog";
import { DeleteProjectDialog } from "@/components/editor/delete-project-dialog";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectDialogsProvider } from "@/components/editor/project-dialogs-context";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { RenameProjectDialog } from "@/components/editor/rename-project-dialog";
import { useProjectDialogs } from "@/hooks/use-project-dialogs";
import { MOCK_PROJECTS } from "@/lib/mock-projects";

interface EditorShellProps {
  /** Optional label for the navbar center section. */
  title?: string;
  children: ReactNode;
}

/**
 * Client boundary for the editor chrome. It owns the sidebar open state so the
 * navbar toggle and the sidebar's own close button stay in sync, and holds the
 * project dialog state so the sidebar and the route content open the same
 * dialogs. Keeps the route's `layout.tsx` a server component.
 */
export function EditorShell({ title, children }: EditorShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const dialogs = useProjectDialogs();

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      dialogs.close();
    }
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-base">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
        title={title}
      />

      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        projects={MOCK_PROJECTS}
        onNewProject={dialogs.openCreate}
        onRenameProject={dialogs.openRename}
        onDeleteProject={dialogs.openDelete}
      />

      <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <ProjectDialogsProvider value={dialogs}>
          {children}
        </ProjectDialogsProvider>
      </main>

      <CreateProjectDialog
        open={dialogs.openDialog === "create"}
        onOpenChange={handleOpenChange}
        name={dialogs.name}
        onNameChange={dialogs.setName}
        isSubmitting={dialogs.isSubmitting}
        onSubmit={() => void dialogs.submit()}
      />

      <RenameProjectDialog
        open={dialogs.openDialog === "rename"}
        onOpenChange={handleOpenChange}
        project={dialogs.targetProject}
        name={dialogs.name}
        onNameChange={dialogs.setName}
        isSubmitting={dialogs.isSubmitting}
        onSubmit={() => void dialogs.submit()}
      />

      <DeleteProjectDialog
        open={dialogs.openDialog === "delete"}
        onOpenChange={handleOpenChange}
        project={dialogs.targetProject}
        isSubmitting={dialogs.isSubmitting}
        onConfirm={() => void dialogs.submit()}
      />
    </div>
  );
}
