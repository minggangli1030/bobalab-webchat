// Run this script in the browser console to clear all local data
// Usage: Copy and paste this into your browser's developer console

import { resetUtils } from "./reset-accounts";

// Clear all local data
const clearAllData = () => {
  console.log("🧹 Clearing all local data...");

  const cleared = resetUtils.confirmAndClear();

  if (cleared) {
    console.log("✅ All local data cleared successfully!");
    console.log("🔄 Please refresh the page to start fresh.");
  } else {
    console.log("❌ Data clearing cancelled.");
  }

  return cleared;
};

// Export for console use
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).clearAllData = clearAllData;

console.log("📝 Data clearing script loaded!");
console.log("💡 Run clearAllData() to clear all local data and start fresh");
console.log(
  "⚠️  This will remove all cached posts, users, and login information"
);
