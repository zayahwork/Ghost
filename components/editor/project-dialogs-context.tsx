"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";

import type { ProjectDialogsState } from "@/hooks/use-project-dialogs";

const ProjectDialogsContext = createContext<ProjectDialogsState | null>(null);

interface ProjectDialogsProviderProps {
  value: ProjectDialogsState;
  children: ReactNode;
}

/**
 * Exposes the shell's dialog state to route content, so a page rendered inside
 * `EditorShell` can open a dialog without the shell prop-drilling through the
 * layout's `children`.
 */
export function ProjectDialogsProvider({
  value,
  children,
}: ProjectDialogsProviderProps) {
  return (
    <ProjectDialogsContext.Provider value={value}>
      {children}
    </ProjectDialogsContext.Provider>
  );
}

export function useProjectDialogsContext(): ProjectDialogsState {
  const context = useContext(ProjectDialogsContext);

  if (!context) {
    throw new Error(
      "useProjectDialogsContext must be used inside an EditorShell."
    );
  }

  return context;
}
