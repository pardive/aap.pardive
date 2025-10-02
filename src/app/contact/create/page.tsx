// src/app/contact/create/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import CreateContactPage from '@/components/contact/CreateContactPage';
import type { Contact } from '@/types/contact';

export default function ContactCreateRoute() {
  const router = useRouter();

  return (
    <AppShell>
      <div className="p-6">
        <CreateContactPage
          showTitle={true}   // 👈 visible title here
          onSave={(c: Contact) => {
            console.log('Contact saved:', c);
            router.push('/contact/home');
          }}
          onCancel={() => router.push('/contact/home')}
        />
      </div>
    </AppShell>
  );
}
