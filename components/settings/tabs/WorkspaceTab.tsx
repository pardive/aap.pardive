'use client';

import React, { useMemo, useState } from 'react';
import clsx from 'clsx';

/* ----------------------------- Types & Options ---------------------------- */

type Region = 'US' | 'EU' | 'MEA' | 'APAC';
type Locale = 'en-US' | 'en-GB' | 'fr-FR' | 'de-DE' | 'es-ES' | 'hi-IN';
type Language = 'English' | 'French' | 'German' | 'Spanish' | 'Hindi';
type TimeZone =
  | 'Asia/Kolkata'
  | 'UTC'
  | 'America/New_York'
  | 'Europe/London'
  | 'Europe/Paris'
  | 'Asia/Dubai'
  | 'Asia/Singapore';

type Contact = {
  id?: string;            // present if selected from user list
  name: string;
  email: string;
  phone?: string;
};

type ContactSource = 'user' | 'manual';

type ContactSlot = {
  source: ContactSource;
  userId?: string | null;
  value: Contact; // when source = 'manual', this is the entered contact; when 'user', derived from userId
};

type WorkspaceForm = {
  name: string;
  region: Region;
  locale: Locale;

  workspaceDomain: string;
  language: Language;
  timeZone: TimeZone;

  address: {
    city: string;
    state: string;
    country: string;
    zip: string;
  };

  geo: {
    lat: string;
    lng: string;
  };

  // New: contacts
  contacts: {
    primary: ContactSlot;
    alternate: ContactSlot;
    billing: ContactSlot;
  };
};

type UserLite = { id: string; name: string; email: string; phone?: string };

/* ------------------------------ Mocked Data ------------------------------- */

const REGIONS: Region[] = ['US', 'EU', 'MEA', 'APAC'];
const LOCALES: Locale[] = ['en-US', 'en-GB', 'fr-FR', 'de-DE', 'es-ES', 'hi-IN'];
const LANGUAGES: Language[] = ['English', 'French', 'German', 'Spanish', 'Hindi'];
const TIMEZONES: TimeZone[] = [
  'Asia/Kolkata',
  'UTC',
  'America/New_York',
  'Europe/London',
  'Europe/Paris',
  'Asia/Dubai',
  'Asia/Singapore',
];

// Replace with your real users (fetch from API/Supabase)
const MOCK_USERS: UserLite[] = [
  { id: 'u_1', name: 'Yuvraj Chaubey', email: 'yuvraj@saltify.com', phone: '+91 90000 00001' },
  { id: 'u_2', name: 'Shivangi C', email: 'shivangi@saltify.com', phone: '+91 90000 00002' },
  { id: 'u_3', name: 'Ops Billing', email: 'billing@saltify.com' },
];

/* -------------------------------- Helpers -------------------------------- */

const isDomain = (v: string) => /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(v.trim());
const isLat = (v: string) => /^-?\d+(\.\d+)?$/.test(v) && Math.abs(parseFloat(v)) <= 90;
const isLng = (v: string) => /^-?\d+(\.\d+)?$/.test(v) && Math.abs(parseFloat(v)) <= 180;

function userById(id?: string | null): UserLite | undefined {
  if (!id) return undefined;
  return MOCK_USERS.find(u => u.id === id);
}

/* ------------------------------ Contact UI -------------------------------- */

function ContactSelector({
  label,
  slot,
  onChange,
  errors,
}: {
  label: string;
  slot: ContactSlot;
  onChange: (next: ContactSlot) => void;
  errors?: { name?: string; email?: string; userId?: string };
}) {
  const selectedUser = userById(slot.userId);

  return (
    <section className="rounded-lg border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-medium">{label}</h4>
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() =>
              onChange(
                slot.source === 'user'
                  ? { source: 'manual', userId: null, value: { name: '', email: '', phone: '' } }
                  : { source: 'user', userId: selectedUser?.id ?? '', value: { name: '', email: '', phone: '' } }
              )
            }
            className="rounded-md border px-2 py-1 hover:bg-muted/50"
          >
            {slot.source === 'user' ? 'Enter Manually' : 'Select From Users'}
          </button>
        </div>
      </div>

      {slot.source === 'user' ? (
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm md:col-span-2">
            <div className="mb-1 text-muted-foreground">Select User</div>
            <select
              className={clsx(
                'w-full rounded-md border bg-background px-3 py-2 text-sm',
                errors?.userId && 'border-red-400 focus-visible:outline-red-400'
              )}
              value={slot.userId ?? ''}
              onChange={(e) => {
                const uid = e.target.value || undefined;
                onChange({ ...slot, userId: uid });
              }}
            >
              <option value="">— Choose a user —</option>
              {MOCK_USERS.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} • {u.email}
                </option>
              ))}
            </select>
            {errors?.userId && <p className="mt-1 text-xs text-red-500">{errors.userId}</p>}
          </label>

          <div className="text-sm md:col-span-2 rounded-md border bg-muted/30 p-3">
            <div className="text-xs text-muted-foreground mb-1">Preview</div>
            {selectedUser ? (
              <div className="grid md:grid-cols-3 gap-2">
                <div><span className="text-muted-foreground">Name:</span> {selectedUser.name}</div>
                <div><span className="text-muted-foreground">Email:</span> {selectedUser.email}</div>
                <div><span className="text-muted-foreground">Phone:</span> {selectedUser.phone || '—'}</div>
              </div>
            ) : (
              <div className="text-muted-foreground">No user selected.</div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-sm">
            <div className="mb-1 text-muted-foreground">Full Name</div>
            <input
              className={clsx(
                'w-full rounded-md border bg-background px-3 py-2 text-sm',
                errors?.name && 'border-red-400 focus-visible:outline-red-400'
              )}
              value={slot.value.name}
              onChange={(e) => onChange({ ...slot, value: { ...slot.value, name: e.target.value } })}
              placeholder="Jane Doe"
            />
            {errors?.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </label>

          <label className="text-sm">
            <div className="mb-1 text-muted-foreground">Email</div>
            <input
              type="email"
              className={clsx(
                'w-full rounded-md border bg-background px-3 py-2 text-sm',
                errors?.email && 'border-red-400 focus-visible:outline-red-400'
              )}
              value={slot.value.email}
              onChange={(e) => onChange({ ...slot, value: { ...slot.value, email: e.target.value } })}
              placeholder="jane@acme.com"
            />
            {errors?.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
          </label>

          <label className="text-sm">
            <div className="mb-1 text-muted-foreground">Phone (optional)</div>
            <input
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={slot.value.phone ?? ''}
              onChange={(e) => onChange({ ...slot, value: { ...slot.value, phone: e.target.value } })}
              placeholder="+1 555 555 5555"
            />
          </label>
        </div>
      )}
    </section>
  );
}

/* ------------------------------ Main Component ---------------------------- */

export default function WorkspaceTab() {
  // Seed with pretend data (replace with real fetch)
  const initial: WorkspaceForm = useMemo(
    () => ({
      name: 'Acme HQ',
      region: 'EU',
      locale: 'en-GB',

      workspaceDomain: 'acme.com',
      language: 'English',
      timeZone: 'Asia/Kolkata',

      address: {
        city: 'London',
        state: '',
        country: 'United Kingdom',
        zip: 'SW1A 1AA',
      },

      geo: { lat: '51.5074', lng: '-0.1278' },

      contacts: {
        primary:   { source: 'user',   userId: 'u_1', value: { name: '', email: '' } },
        alternate: { source: 'manual', userId: null,  value: { name: '', email: '', phone: '' } },
        billing:   { source: 'user',   userId: 'u_3', value: { name: '', email: '' } },
      },
    }),
    []
  );

  const [form, setForm] = useState<WorkspaceForm>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [contactErrors, setContactErrors] = useState<{
    primary?: { name?: string; email?: string; userId?: string };
    alternate?: { name?: string; email?: string; userId?: string };
    billing?: { name?: string; email?: string; userId?: string };
  }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initial), [form, initial]);

  function setField<K extends keyof WorkspaceForm>(key: K, v: WorkspaceForm[K]) {
    setForm((f) => ({ ...f, [key]: v }));
  }
  function setAddr(key: keyof WorkspaceForm['address'], v: string) {
    setForm((f) => ({ ...f, address: { ...f.address, [key]: v } }));
  }
  function setGeo(key: keyof WorkspaceForm['geo'], v: string) {
    setForm((f) => ({ ...f, geo: { ...f.geo, [key]: v } }));
  }
  function setContact(slot: 'primary' | 'alternate' | 'billing', next: ContactSlot) {
    setForm((f) => ({ ...f, contacts: { ...f.contacts, [slot]: next } }));
  }

  function validateContacts() {
    const ce: typeof contactErrors = {};

    (['primary', 'alternate', 'billing'] as const).forEach(slotKey => {
      const slot = form.contacts[slotKey];
      const slotErr: { name?: string; email?: string; userId?: string } = {};

      if (slot.source === 'user') {
        if (!slot.userId) {
          slotErr.userId = 'Please select a user.';
        } else {
          const u = userById(slot.userId);
          if (!u) slotErr.userId = 'Selected user not found.';
        }
      } else {
        if (!slot.value.name.trim()) slotErr.name = 'Name is required.';
        if (!slot.value.email.trim()) slotErr.email = 'Email is required.';
        // (Optional) add stricter email regex if needed
      }

      if (Object.keys(slotErr).length) {
        (ce as any)[slotKey] = slotErr;
      }
    });

    setContactErrors(ce);
    return Object.keys(ce).length === 0;
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Workspace name is required.';
    if (!form.region) e.region = 'Region is required.';
    if (!form.locale) e.locale = 'Default locale is required.';

    if (!form.workspaceDomain.trim()) e.workspaceDomain = 'Workspace domain is required.';
    else if (!isDomain(form.workspaceDomain)) e.workspaceDomain = 'Enter a valid domain (e.g., acme.com).';

    if (!form.language) e.language = 'Language is required.';
    if (!form.timeZone) e.timeZone = 'Time zone is required.';

    if (!form.address.city.trim()) e.city = 'City is required.';
    if (!form.address.country.trim()) e.country = 'Country is required.';

    if (form.geo.lat.trim() && !isLat(form.geo.lat)) e.lat = 'Latitude must be between -90 and 90.';
    if (form.geo.lng.trim() && !isLng(form.geo.lng)) e.lng = 'Longitude must be between -180 and 180.';

    setErrors(e);
    const contactsOk = validateContacts();
    return Object.keys(e).length === 0 && contactsOk;
  }

  async function handleSave() {
    if (!validate()) return;
    setIsSaving(true);

    // Prepare contacts payload:
    const resolveSlot = (slot: ContactSlot): Contact => {
      if (slot.source === 'user') {
        const u = userById(slot.userId);
        return { id: u?.id, name: u?.name || '', email: u?.email || '', phone: u?.phone };
      }
      return slot.value;
    };

    const payload = {
      ...form,
      geo: { lat: form.geo.lat ? +form.geo.lat : null, lng: form.geo.lng ? +form.geo.lng : null },
      contacts: {
        primary: resolveSlot(form.contacts.primary),
        alternate: resolveSlot(form.contacts.alternate),
        billing: resolveSlot(form.contacts.billing),
      },
    };

    // Replace with a real API call
    // await fetch('/api/settings/workspace', { method:'POST', body: JSON.stringify(payload) });
    await new Promise((r) => setTimeout(r, 600));

    setIsSaving(false);
    setSavedAt(Date.now());
  }

  function handleReset() {
    setForm(initial);
    setErrors({});
    setContactErrors({});
  }

  return (
    // Keep inner scrolling
    <div className="min-h-0 flex flex-col">
      <div className="min-h-0 overflow-y-auto pr-1">
        {/* WORKSPACE DETAILS */}
        <section className="rounded-lg border p-4 mb-6">
          <h4 className="text-sm font-medium mb-3">Workspace Details</h4>
          <div className="grid gap-3 md:grid-cols-2">
            {/* Name */}
            <label className="text-sm">
              <div className="mb-1 text-muted-foreground">Workspace Name</div>
              <input
                className={clsx(
                  'w-full rounded-md border bg-background px-3 py-2 text-sm',
                  errors.name && 'border-red-400 focus-visible:outline-red-400'
                )}
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                placeholder="Acme HQ"
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </label>

            {/* Region */}
            <label className="text-sm">
              <div className="mb-1 text-muted-foreground">Region</div>
              <select
                className={clsx(
                  'w-full rounded-md border bg-background px-3 py-2 text-sm',
                  errors.region && 'border-red-400 focus-visible:outline-red-400'
                )}
                value={form.region}
                onChange={(e) => setField('region', e.target.value as Region)}
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              {errors.region && <p className="mt-1 text-xs text-red-500">{errors.region}</p>}
            </label>

            {/* Locale */}
            <label className="text-sm">
              <div className="mb-1 text-muted-foreground">Default Locale</div>
              <select
                className={clsx(
                  'w-full rounded-md border bg-background px-3 py-2 text-sm',
                  errors.locale && 'border-red-400 focus-visible:outline-red-400'
                )}
                value={form.locale}
                onChange={(e) => setField('locale', e.target.value as Locale)}
              >
                {LOCALES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              {errors.locale && <p className="mt-1 text-xs text-red-500">{errors.locale}</p>}
            </label>

            {/* Workspace Domain */}
            <label className="text-sm">
              <div className="mb-1 text-muted-foreground">Workspace Domain</div>
              <input
                className={clsx(
                  'w-full rounded-md border bg-background px-3 py-2 text-sm',
                  errors.workspaceDomain && 'border-red-400 focus-visible:outline-red-400'
                )}
                value={form.workspaceDomain}
                onChange={(e) => setField('workspaceDomain', e.target.value)}
                placeholder="acme.com"
              />
              {errors.workspaceDomain && (
                <p className="mt-1 text-xs text-red-500">{errors.workspaceDomain}</p>
              )}
            </label>

            {/* Language */}
            <label className="text-sm">
              <div className="mb-1 text-muted-foreground">Language</div>
              <select
                className={clsx(
                  'w-full rounded-md border bg-background px-3 py-2 text-sm',
                  errors.language && 'border-red-400 focus-visible:outline-red-400'
                )}
                value={form.language}
                onChange={(e) => setField('language', e.target.value as Language)}
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
              {errors.language && <p className="mt-1 text-xs text-red-500">{errors.language}</p>}
            </label>

            {/* Time Zone */}
            <label className="text-sm">
              <div className="mb-1 text-muted-foreground">Time Zone</div>
              <select
                className={clsx(
                  'w-full rounded-md border bg-background px-3 py-2 text-sm',
                  errors.timeZone && 'border-red-400 focus-visible:outline-red-400'
                )}
                value={form.timeZone}
                onChange={(e) => setField('timeZone', e.target.value as TimeZone)}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
              {errors.timeZone && <p className="mt-1 text-xs text-red-500">{errors.timeZone}</p>}
            </label>
          </div>
        </section>

        {/* ADDRESS */}
        <section className="rounded-lg border p-4 mb-6">
          <h4 className="text-sm font-medium mb-3">Address</h4>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm">
              <div className="mb-1 text-muted-foreground">City</div>
              <input
                className={clsx(
                  'w-full rounded-md border bg-background px-3 py-2 text-sm',
                  errors.city && 'border-red-400 focus-visible:outline-red-400'
                )}
                value={form.address.city}
                onChange={(e) => setAddr('city', e.target.value)}
                placeholder="City"
              />
              {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city}</p>}
            </label>

            <label className="text-sm">
              <div className="mb-1 text-muted-foreground">State / Province</div>
              <input
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={form.address.state}
                onChange={(e) => setAddr('state', e.target.value)}
                placeholder="State or Province"
              />
            </label>

            <label className="text-sm">
              <div className="mb-1 text-muted-foreground">Country</div>
              <input
                className={clsx(
                  'w-full rounded-md border bg-background px-3 py-2 text-sm',
                  errors.country && 'border-red-400 focus-visible:outline-red-400'
                )}
                value={form.address.country}
                onChange={(e) => setAddr('country', e.target.value)}
                placeholder="Country"
              />
              {errors.country && <p className="mt-1 text-xs text-red-500">{errors.country}</p>}
            </label>

            <label className="text-sm">
              <div className="mb-1 text-muted-foreground">ZIP / Postal Code</div>
              <input
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={form.address.zip}
                onChange={(e) => setAddr('zip', e.target.value)}
                placeholder="ZIP / Postal Code"
              />
            </label>
          </div>
        </section>

        {/* GEO TAG */}
        <section className="rounded-lg border p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium">Geo Tag (Lat / Lng)</h4>
            <span className="text-xs text-muted-foreground">Optional</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm">
              <div className="mb-1 text-muted-foreground">Latitude</div>
              <input
                inputMode="decimal"
                className={clsx(
                  'w-full rounded-md border bg-background px-3 py-2 text-sm',
                  errors.lat && 'border-red-400 focus-visible:outline-red-400'
                )}
                value={form.geo.lat}
                onChange={(e) => setGeo('lat', e.target.value)}
                placeholder="e.g., 51.5074"
              />
              {errors.lat && <p className="mt-1 text-xs text-red-500">{errors.lat}</p>}
            </label>

            <label className="text-sm">
              <div className="mb-1 text-muted-foreground">Longitude</div>
              <input
                inputMode="decimal"
                className={clsx(
                  'w-full rounded-md border bg-background px-3 py-2 text-sm',
                  errors.lng && 'border-red-400 focus-visible:outline-red-400'
                )}
                value={form.geo.lng}
                onChange={(e) => setGeo('lng', e.target.value)}
                placeholder="e.g., -0.1278"
              />
              {errors.lng && <p className="mt-1 text-xs text-red-500">{errors.lng}</p>}
            </label>
          </div>
        </section>

        {/* CONTACTS */}
        <div className="space-y-6 mb-24">
          <ContactSelector
            label="Primary Contact"
            slot={form.contacts.primary}
            onChange={(next) => setContact('primary', next)}
            errors={contactErrors.primary}
          />
          <ContactSelector
            label="Alternate Contact"
            slot={form.contacts.alternate}
            onChange={(next) => setContact('alternate', next)}
            errors={contactErrors.alternate}
          />
          <ContactSelector
            label="Billing Contact"
            slot={form.contacts.billing}
            onChange={(next) => setContact('billing', next)}
            errors={contactErrors.billing}
          />
        </div>

        {/* Sticky actions INSIDE the scroller */}
        <div className="sticky bottom-0 left-0 right-0 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="pointer-events-auto mx-0 md:mx-1 my-4 flex items-center gap-2 justify-end">
            {savedAt && (
              <span className="text-xs text-muted-foreground mr-auto pl-1">
                Saved {new Date(savedAt).toLocaleTimeString()}
              </span>
            )}

            <button
              className="rounded-md border px-3 py-2 text-sm hover:bg-muted/50 disabled:opacity-50"
              onClick={handleReset}
              disabled={!dirty || isSaving}
            >
              Reset
            </button>
            <button
              className={clsx(
                'rounded-md border px-3 py-2 text-sm',
                dirty
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-700'
                  : 'hover:bg-muted/50'
              )}
              onClick={handleSave}
              disabled={!dirty || isSaving}
            >
              {isSaving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
