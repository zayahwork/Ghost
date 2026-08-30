"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Show, UserButton } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";

interface EditorNavbarProps {
  /** Whether the project sidebar is currently open. Drives the toggle icon. */
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  /** Optional label rendered in the center section. */
  title?: string;
}

export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
  title,
}: EditorNavbarProps) {
  const SidebarToggleIcon = isSidebarOpen ? PanelLeftClose : PanelLeftOpen;

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-surface-border bg-surface px-3">
      <div className="flex flex-1 items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-expanded={isSidebarOpen}
          aria-label={
            isSidebarOpen ? "Close projects sidebar" : "Open projects sidebar"
          }
          onClick={onToggleSidebar}
        >
          <SidebarToggleIcon className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex flex-1 items-center justify-center">
        {title ? (
          <span className="truncate text-sm font-medium text-copy-primary">
            {title}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 items-center justify-end gap-2">
        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>
    </header>
  );
}
