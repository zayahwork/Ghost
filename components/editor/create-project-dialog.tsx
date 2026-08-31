"use client";

import type { FormEvent } from "react";

import { EditorDialog } from "@/components/editor/editor-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { slugify } from "@/lib/slug";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  onNameChange: (name: string) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
}

const FORM_ID = "create-project-form";

export function CreateProjectDialog({
  open,
  onOpenChange,
  name,
  onNameChange,
  isSubmitting,
  onSubmit,
}: CreateProjectDialogProps) {
  const slug = slugify(name);
  const canSubmit =
    name.trim().length > 0 && slug.length > 0 && !isSubmitting;

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
      title="New project"
      description="Name your workspace. The slug is generated from the name."
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
            {isSubmitting ? "Creating..." : "Create Project"}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="grid gap-2">
        <label
          htmlFor="create-project-name"
          className="text-sm font-medium text-copy-primary"
        >
          Project name
        </label>
        <Input
          id="create-project-name"
          className="text-copy-primary"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="Checkout Platform"
          autoComplete="off"
          disabled={isSubmitting}
        />

        
        <p className="text-xs text-copy-primary">
          
          <span className="font-mono text-copy-muted">
            {slug || "your-project"}
          </span>
        </p>
      </form>
    </EditorDialog>
  );
}
