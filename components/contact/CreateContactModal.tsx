'use client';

import Link from 'next/link';
import { X, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import CreateContactPage from '@/components/contact/CreateContactPage';
import type { Contact } from '@/types/contact';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: (c: Contact) => void;
};

export default function CreateContactModal({ open, onOpenChange, onCreated }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0">
        <DialogHeader className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">Create Contact</DialogTitle>

            <div className="flex items-center gap-1">
              {/* Open full page (icon only) */}
              <Button variant="ghost" size="icon" aria-label="Open full page" asChild>
                <Link href="/contact/create">
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>

              {/* Close (X) */}
              <DialogClose asChild>
                <Button variant="ghost" size="icon" aria-label="Close">
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </div>
          </div>
        </DialogHeader>

        {/* Body: reuse your existing form component, hide inner title */}
        <div className="px-4 pb-4">
          <CreateContactPage
            showTitle={false}
            onSave={(c: Contact) => {
              onCreated?.(c);
              onOpenChange(false);
            }}
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
