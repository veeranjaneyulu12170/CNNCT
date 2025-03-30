export default function Settings() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>

      <div className="bg-white rounded-lg shadow divide-y">
        <div className="p-6">
          <h2 className="text-lg font-medium mb-4">Profile</h2>
          <p className="text-gray-600 mb-4">
            Manage your personal information and preferences
          </p>
          {/* Placeholder for profile settings */}
        </div>

        <div className="p-6">
          <h2 className="text-lg font-medium mb-4">Account</h2>
          <p className="text-gray-600 mb-4">
            Update your email and password settings
          </p>
          {/* Placeholder for account settings */}
        </div>
      </div>
    </div>
  );
}