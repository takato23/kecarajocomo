export default function TestNavPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">Test Navigation Page</h1>
      <p className="text-lg text-gray-600">
        The new navigation bar should appear at the top with professional icons and styling.
      </p>
      <p className="mt-4 text-gray-600">
        Features:
      </p>
      <ul className="list-disc list-inside mt-2 space-y-2 text-gray-600">
        <li>Clean, professional design with Lucide icons</li>
        <li>Dropdown menus for main sections</li>
        <li>Command palette (press ⌘K)</li>
        <li>Mobile bottom navigation</li>
        <li>No more emojis in navigation</li>
      </ul>
    </div>
  );
}