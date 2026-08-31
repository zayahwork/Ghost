"use client";

import { useCallback, useMemo, useState } from "react";

import type { Project } from "@/types/project";

export type ProjectDialog = "create" | "rename" | "delete";

export interface ProjectDialogsState {
  /** Which dialog is mounted open, or `null` when all are closed. */
  openDialog: ProjectDialog | null;
  /** The project the rename and delete dialogs act on. */
  targetProject: Project | null;
  /** Shared name field for the create and rename forms. */
  name: string;
  setName: (name: string) => void;
  isSubmitting: boolean;
  openCreate: () => void;
  openRename: (project: Project) => void;
  openDelete: (project: Project) => void;
  close: () => void;
  /**
   * Runs a dialog's confirm action behind the shared loading flag and closes on
   * success. `action` is the seam the projects API will hook into; with mock
   * data there is nothing to await, so the dialog closes immediately.
   */
  submit: (action?: () => Promise<void>) => Promise<void>;
}

/**
 * Single owner of the project dialog state: which dialog is open, what it is
 * acting on, the name field both forms share, and whether a confirm is in
 * flight. Keeping all three in one hook is what lets the editor home, the
 * sidebar, and the dialogs themselves stay presentational.
 */
export function useProjectDialogs(): ProjectDialogsState {
  const [openDialog, setOpenDialog] = useState<ProjectDialog | null>(null);
  const [targetProject, setTargetProject] = useState<Project | null>(null);
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCreate = useCallback(() => {
    setTargetProject(null);
    setName("");
    setOpenDialog("create");
  }, []);

  const openRename = useCallback((project: Project) => {
    setTargetProject(project);
    setName(project.name);
    setOpenDialog("rename");
  }, []);

  const openDelete = useCallback((project: Project) => {
    setTargetProject(project);
    setName("");
    setOpenDialog("delete");
  }, []);

  const close = useCallback(() => {
    setOpenDialog(null);
  }, []);

  const submit = useCallback(
    async (action?: () => Promise<void>) => {
      setIsSubmitting(true);
      try {
        await action?.();
        setOpenDialog(null);
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  return useMemo(
    () => ({
      openDialog,
      targetProject,
      name,
      setName,
      isSubmitting,
      openCreate,
      openRename,
      openDelete,
      close,
      submit,
    }),
    [
      openDialog,
      targetProject,
      name,
      isSubmitting,
      openCreate,
      openRename,
      openDelete,
      close,
      submit,
    ]
  );
}
