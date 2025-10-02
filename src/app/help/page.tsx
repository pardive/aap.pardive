import HelpShell from './HelpShell';

export default function HelpHomePage() {
  return (
    <HelpShell
      title="Help Center"
      description={[
        "Explore guides, FAQs, and workspace setup instructions.",
        "Use the sidebar to navigate by category.",
      ]}
    >
      <div className="prose max-w-3xl">
        <h2>Welcome to the Help Center</h2>
        <p>
          Start by selecting a topic from the sidebar. Each section contains detailed instructions and best practices.
        </p>
        <ul>
          <li><strong>Docs</strong> – Technical and workspace documentation</li>
          <li><strong>Settings</strong> – Configure your workspace environment</li>
          <li><strong>Members</strong> – Manage access and permissions</li>
        </ul>
      </div>
    </HelpShell>
  );
}
