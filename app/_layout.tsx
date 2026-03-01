import { Stack } from "expo-router";
import { useEffect } from "react";
import "./global.css";
import { initDB } from "./LocalDB"; // Import your DB init function
import { startSyncManager } from "./SyncManager"; // Import your Sync Manager

export default function RootLayout() {
  useEffect(() => {
    // 1. Initialize the SQLite Database
    initDB();

    // 2. Start the Background Sync Manager
    // This will watch for internet and auto-sync offline data to Firebase
    startSyncManager();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
