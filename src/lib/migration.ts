// Migration utility to help transition from localStorage to Firebase
// This can be used to export existing data before switching to Firebase

export const migrationUtils = {
  // Export all localStorage data to JSON
  exportLocalStorageData: () => {
    if (typeof window === "undefined") return null;

    const data = {
      users: localStorage.getItem("web_chat_all_users"),
      posts: localStorage.getItem("web_chat_posts"),
      comments: localStorage.getItem("web_chat_comments"),
      currentUser: localStorage.getItem("web_chat_user"),
    };

    // Create and download JSON file
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "web-chat-backup.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return data;
  },

  // Clear all localStorage data
  clearLocalStorageData: () => {
    if (typeof window === "undefined") return;

    localStorage.removeItem("web_chat_user");
    localStorage.removeItem("web_chat_posts");
    localStorage.removeItem("web_chat_comments");
    localStorage.removeItem("web_chat_all_users");
  },

  // Check if localStorage has data
  hasLocalStorageData: () => {
    if (typeof window === "undefined") return false;

    return !!(
      localStorage.getItem("web_chat_user") ||
      localStorage.getItem("web_chat_posts") ||
      localStorage.getItem("web_chat_comments") ||
      localStorage.getItem("web_chat_all_users")
    );
  },
};
