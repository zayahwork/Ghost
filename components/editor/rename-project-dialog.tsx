"use client";

import type { FormEvent } from "react";

import { EditorDialog } from "@/components/editor/editor-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Project } from "@/types/project";

interface RenameProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  name: string;
  onNameChange: (name: string) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
}

const FORM_ID = "rename-project-form";

export function RenameProjectDialog({
  open,
  onOpenChange,
  project,
  name,
  onNameChange,
  isSubmitting,
  onSubmit,
}: RenameProjectDialogProps) {
  const trimmed = name.trim();
  const canSubmit =
    trimmed.length > 0 && trimmed !== project?.name && !isSubmitting;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    onSubmit();
  }

  return (
    <EditorDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Rename project"
      description={
        project
          ? `Currently named "${project.name}".`
          : "Choose a new project name."
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
          <Button type="submit" size="lg" form={FORM_ID} disabled={!canSubmit}>
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="grid gap-2">
        <label
          htmlFor="rename-project-name"
          className="text-sm font-medium text-copy-secondary"
        >
          Project name
        </label>
        {/* Autofocused so the prefilled name can be replaced, and Enter
            submitted, without reaching for the mouse. */}
        <Input
          id="rename-project-name"
          className="text-copy-primary"
          autoFocus
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          autoComplete="off"
          disabled={isSubmitting}
        />
      </form>
    </EditorDialog>
  );
}
