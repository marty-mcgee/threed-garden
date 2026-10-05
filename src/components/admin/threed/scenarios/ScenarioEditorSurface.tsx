'use client';

import type { ReactNode } from 'react';
import { BookOpen } from 'lucide-react';
import { AdminWorkspaceHeader } from '@/components/admin/layout/AdminWorkspaceHeader';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ModelFieldHelp } from '../models/ModelFieldHelp';

export function ScenarioEditorSurface({ standalone, open, title, busy, onClose, children }: {
  standalone: boolean; open: boolean; title: string; busy: boolean; onClose: () => void; children: ReactNode;
}) {
  if (standalone) return <>
    <AdminWorkspaceHeader icon={BookOpen} title={title} description="Edit a Scenario outline and its Project setup bindings.">
      <ModelFieldHelp label="Scenario">A Scenario describes a reusable purpose and setup structure. Models and Sensor Groups are bindings to this Project. Saving does not run Actions, create assets or start a Simulation.</ModelFieldHelp>
    </AdminWorkspaceHeader>
    <fieldset disabled={busy} className="admin-editor-panel min-h-0 space-y-3 overflow-y-auto rounded-lg border p-3 text-xs [&_label]:text-xs [&_input]:h-8 [&_input]:text-xs [&_select]:h-8 [&_select]:py-1 [&_select]:text-xs [&_textarea]:text-xs [&_button]:text-xs [&_[data-slot=switch]]:h-4 [&_[data-slot=switch]]:w-7 [&_[data-slot=switch-thumb]]:size-3">{children}</fieldset>
  </>;
  return <Dialog open={open} onOpenChange={value => { if (!value && !busy) onClose(); }}>
    <DialogContent showCloseButton={!busy} onEscapeKeyDown={event => { if (busy) event.preventDefault(); }} onInteractOutside={event => { if (busy) event.preventDefault(); }} className="max-h-[90dvh] overflow-y-auto">
      <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader><fieldset disabled={busy} className="min-w-0">{children}</fieldset>
    </DialogContent>
  </Dialog>;
}
