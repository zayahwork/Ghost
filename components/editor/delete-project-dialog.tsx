"use client";

import { EditorDialog } from "@/components/editor/editor-dialog";
import { Button } from "@/components/ui/button";
import type { Project } from "@/types/project";

interface DeleteProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  isSubmitting: boolean;
  onConfirm: () => void;
}

/** Confirmation only - no fields, and the confirm action is styled destructive. */
export function DeleteProjectDialog({
  open,
  onOpenChange,
  project,
  isSubmitting,
  onConfirm,
}: DeleteProjectDialogProps) {
  return (
    <EditorDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete project"
      description={
        project
          ? `"${project.name}" and its canvas will be permanently deleted. This cannot be undone.`
          : "This project and its canvas will be permanently deleted. This cannot be undone."
      }
      footer={
        <>
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="lg"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Deleting..." : "Delete Project"}
          </Button>
        </>
      }
    />
  );
}
