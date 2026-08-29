"use client";

import type { ComponentType } from "react";
import { FolderOpen, Plus, Users, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewProject?: () => void;
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

/**
 * Floating projects panel. It overlays the editor rather than participating in
 * layout, so opening it never reflows the canvas underneath.
 */
export function ProjectSidebar({
  isOpen,
  onClose,
  onNewProject,
}: ProjectSidebarProps) {
  return (
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
            <EmptyState
              icon={FolderOpen}
              title="No projects yet"
              description="Projects you create will appear here."
            />
          </TabsContent>

          <TabsContent value="shared">
            <EmptyState
              icon={Users}
              title="Nothing shared with you"
              description="Projects shared by collaborators will appear here."
            />
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
  );
}
