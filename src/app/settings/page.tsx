'use client';

import React from 'react';
import SettingsShell from '@/components/layout/SettingsShell';
import SettingsClient from '@/components/settings/SettingsClient';
import { HELP, type TabKey } from '@/config/settingsTabs';
import { fetchHelpSummary } from '@/src/lib/help/fetchHelpSummary';

type HelpSummary = { title: string; bullets: string[] };

export default function SettingsPage() {
  const [summary, setSummary] = React.useState<HelpSummary>();
  const [tabsH, setTabsH] = React.useState(48);

  React.useEffect(() => {
    void fetchHelpSummary(HELP.workspace.path)
      .then(setSummary)
      .catch(() =>
        setSummary({
          title: HELP.workspace.title,
          bullets: ['Help summary unavailable right now.'],
        })
      );
  }, []);

  const handleHelpTopicChange = React.useCallback((tabKey: TabKey) => {
    const meta = HELP[tabKey] ?? HELP.workspace;
    void fetchHelpSummary(meta.path)
      .then(setSummary)
      .catch(() =>
        setSummary({
          title: meta.title,
          bullets: ['Help summary unavailable right now.'],
        })
      );
  }, []);

  return (
    <SettingsShell summary={summary} tabsBarHeight={tabsH}>
      <SettingsClient
        onSummaryChange={setSummary}
        onHelpTopicChange={handleHelpTopicChange}
        onTabsBarHeightChange={setTabsH}
      />
    </SettingsShell>
  );
}
