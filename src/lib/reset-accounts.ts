// Utility to reset all account data and start fresh
import { migrationUtils } from "./migration";

export const resetUtils = {
  // Clear all localStorage data
  clearAllData: () => {
    if (typeof window === "undefined") return;

    // Clear all web chat related localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes("web_chat")) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));

    console.log("All local data cleared!");
    return keysToRemove;
  },

  // Show confirmation dialog before clearing
  confirmAndClear: () => {
    if (typeof window === "undefined") return;

    const confirmed = window.confirm(
      "Are you sure you want to clear ALL account data? This will:\n" +
        "- Remove all local account information\n" +
        "- Clear all cached posts and comments\n" +
        "- You'll need to create new accounts\n\n" +
        "This action cannot be undone!"
    );

    if (confirmed) {
      return resetUtils.clearAllData();
    }
    return null;
  },

  // Get current data status
  getDataStatus: () => {
    if (typeof window === "undefined") return { hasData: false, dataCount: 0 };

    const hasData = migrationUtils.hasLocalStorageData();
    let dataCount = 0;

    if (localStorage.getItem("web_chat_user")) dataCount++;
    if (localStorage.getItem("web_chat_posts")) dataCount++;
    if (localStorage.getItem("web_chat_comments")) dataCount++;
    if (localStorage.getItem("web_chat_all_users")) dataCount++;

    return { hasData, dataCount };
  },
};
