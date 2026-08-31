"use client";

import type { ComponentType } from "react";
import { FolderOpen, Pencil, Plus, Trash2, Users, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/project";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onNewProject?: () => void;
  onRenameProject?: (project: Project) => void;
  onDeleteProject?: (project: Project) => void;
}

interface EmptyStateProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
      <Icon className="h-8 w-8 text-copy-faint" />
      <p className="text-sm font-medium text-copy-secondary">{title}</p>
      <p className="text-xs text-copy-muted">{description}</p>
    </div>
  );
}

interface ProjectListItemProps {
  project: Project;
  onRename?: (project: Project) => void;
  onDelete?: (project: Project) => void;
}

/**
 * A single project row. Rename and delete belong to the owner only - a
 * collaborator sees the same row with no actions attached.
 */
function ProjectListItem({ project, onRename, onDelete }: ProjectListItemProps) {
  const canManage = project.role === "owner";

  return (
    <li className="group flex items-center gap-2 rounded-xl px-3 py-2 transition-colors hover:bg-subtle/60">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-copy-secondary">{project.name}</p>
        <p className="truncate font-mono text-xs text-copy-faint">
          {project.slug}
        </p>
      </div>

      {canManage ? (
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Rename ${project.name}`}
            onClick={() => onRename?.(project)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${project.name}`}
            onClick={() => onDelete?.(project)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ) : null}
    </li>
  );
}

/**
 * Floating projects panel. It overlays the editor rather than participating in
 * layout, so opening it never reflows the canvas underneath. On small screens a
 * scrim sits behind it and dismisses the panel on tap.
 */
export function ProjectSidebar({
  isOpen,
  onClose,
  projects,
  onNewProject,
  onRenameProject,
  onDeleteProject,
}: ProjectSidebarProps) {
  const ownedProjects = projects.filter((project) => project.role === "owner");
  const sharedProjects = projects.filter(
    (project) => project.role === "collaborator"
  );

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          aria-label="Close projects sidebar"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-base/70 backdrop-blur-sm md:hidden"
        />
      ) : null}

      <aside
        aria-label="Projects"
        inert={!isOpen}
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-surface-border bg-surface/95 backdrop-blur transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-surface-border px-4">
          <h2 className="text-sm font-semibold text-copy-primary">Projects</h2>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Close projects sidebar"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </header>

        <Tabs
          defaultValue="my-projects"
          className="flex min-h-0 flex-1 flex-col gap-0"
        >
          <div className="shrink-0 px-4 pt-4">
            <TabsList className="w-full">
              <TabsTrigger value="my-projects">My Projects</TabsTrigger>
              <TabsTrigger value="shared">Shared</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            <TabsContent value="my-projects">
              {ownedProjects.length > 0 ? (
                <ul className="flex flex-col gap-1 p-2">
                  {ownedProjects.map((project) => (
                    <ProjectListItem
                      key={project.id}
                      project={project}
                      onRename={onRenameProject}
                      onDelete={onDeleteProject}
                    />
                  ))}
                </ul>
              ) : (
                <EmptyState
                  icon={FolderOpen}
                  title="No projects yet"
                  description="Projects you create will appear here."
                />
              )}
            </TabsContent>

            <TabsContent value="shared">
              {sharedProjects.length > 0 ? (
                <ul className="flex flex-col gap-1 p-2">
                  {sharedProjects.map((project) => (
                    <ProjectListItem key={project.id} project={project} />
                  ))}
                </ul>
              ) : (
                <EmptyState
                  icon={Users}
                  title="Nothing shared with you"
                  description="Projects shared by collaborators will appear here."
                />
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="shrink-0 border-t border-surface-border p-4">
          <Button
            type="button"
            size="lg"
            className="w-full"
            onClick={onNewProject}
          >
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </aside>
    </>
  );
}
