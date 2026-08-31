"use client";

import { Plus } from "lucide-react";

import { useProjectDialogsContext } from "@/components/editor/project-dialogs-context";
import { Button } from "@/components/ui/button";

/**
 * `/editor` with no project open: a prompt to create one or pick one from the
 * sidebar. Deliberately uncarded - it is an empty state, not a panel.
 */
export function EditorHome() {
  const { openCreate } = useProjectDialogsContext();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold text-copy-primary">
        Create a project or open an existing one
      </h1>
      <p className="max-w-md text-sm text-copy-muted">
        Start a new architecture workspace, or choose a project from the
        sidebar.
      </p>
      <Button type="button" size="lg" onClick={openCreate}>
        <Plus className="h-4 w-4" />
        New Project
      </Button>
    </div>
  );
}
