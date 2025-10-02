'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ModuleHomeHeader from '@/components/module/ModuleHomeHeader';
import ModuleListView, { Column } from '@/components/module/ModuleListView';
import { Download, Trash2, Settings } from 'lucide-react';
import CreateContactModal from '@/components/contact/CreateContactModal';

type Contact = {
  id?: string;           // may be missing
  externalId?: string;   // optional alt id
  name: string;
  email: string;
  company?: string;
  createdAt?: string;    // ISO
};

// ---- helpers (no deps) ----
const slugify = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const deriveRouteId = (row: Contact, idx: number): string => {
  if (row.id && row.id.trim()) return row.id;
  if (row.externalId && row.externalId.trim()) return row.externalId;
  if (row.email && row.email.trim()) return `email-${encodeURIComponent(row.email)}`;
  if (row.name && row.name.trim()) return `${slugify(row.name)}-${idx}`;
  return `row-${idx}`;
};

const contactDetailPath = (rid: string) => `/contact/${rid}`;

type ContactRow = Contact & { _rid: string };

export default function ContactHomeClient({ data }: { data: Contact[] }) {
  const router = useRouter();
  const [openCreate, setOpenCreate] = useState(false);

  // add a safe route id for every row
  const rows: ContactRow[] = useMemo(
    () => data.map((r, i) => ({ ...r, _rid: deriveRouteId(r, i) })),
    [data]
  );

  const columns: Column<ContactRow>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      widthClass: 'w-64',
      render: (v, row) => (
        <Link
          href={contactDetailPath(row._rid)}
          className="text-blue-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {String(v ?? '—')}
        </Link>
      ),
    },
    { key: 'email', label: 'Email', sortable: true, widthClass: 'w-64' },
    { key: 'company', label: 'Company', sortable: true, widthClass: 'w-56' },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      widthClass: 'w-40',
      render: (v) => (v ? new Date(String(v)).toLocaleDateString() : '—'),
      sortAccessor: (row) => (row.createdAt ? new Date(row.createdAt) : null),
      align: 'right',
    },
  ];

  return (
    <>
      <ModuleHomeHeader
        onFilter={() => console.log('Filter Contacts')}
        onCreate={() => setOpenCreate(true)}   // ✅ open modal
        onImport={() => console.log('Import Contacts')}
        tools={[
          { label: 'Export CSV', onClick: () => console.log('Export CSV'), icon: Download },
          { label: 'Bulk Delete', onClick: () => console.log('Bulk Delete'), icon: Trash2 },
          { label: 'Settings', onClick: () => console.log('Open Settings'), icon: Settings },
        ]}
      />

      <div className="mt-[4px]">
        <ModuleListView<ContactRow>
          columns={columns}
          data={rows}
          idKey="_rid"
          initialPageSize={10}
          renderBulkActions={(sel) => (
            <>
              <button
                className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700"
                onClick={() => console.log('Export', sel.map((r) => r._rid))}
              >
                Export Selected
              </button>
              <button
                className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700"
                onClick={() => console.log('Delete', sel.map((r) => r._rid))}
              >
                Delete Selected
              </button>
            </>
          )}
          onRowClick={(row) => router.push(contactDetailPath(row._rid))}
        />
      </div>

      {/* Create Contact Modal */}
      <CreateContactModal
        open={openCreate}
        onOpenChange={setOpenCreate}
        onCreated={(c) => {
          console.log('Contact created:', c);
          // TODO: refresh table data (SWR refetch / server action)
        }}
      />
    </>
  );
}
