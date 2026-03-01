import NetInfo from "@react-native-community/netinfo";
import { ref, update } from "firebase/database";
import { db as firebaseDb } from "./Firebase";
import { getUnsyncedUsers, markUserSynced } from "./LocalDB";

export const forceSyncNow = async () => {
  const state = await NetInfo.fetch();
  if (state.isConnected && state.isInternetReachable) {
    await syncDataToFirebase();
  }
};

export const startSyncManager = () => {
  forceSyncNow();

  NetInfo.addEventListener((state) => {
    if (state.isConnected && state.isInternetReachable) {
      console.log("Connection restored! Starting Auto-Sync...");
      syncDataToFirebase();
    }
  });

  setInterval(() => {
    forceSyncNow();
  }, 15000);
};

const syncDataToFirebase = async () => {
  const pendingUsers = getUnsyncedUsers();

  if (!pendingUsers || pendingUsers.length === 0) {
    return;
  }

  for (const user of pendingUsers) {
    try {
      const userRef = ref(firebaseDb, `users/${user.uid}`);
      const updates = {};

      if (user.score > 0) updates.score = user.score;
      if (user.fullName) updates.fullName = user.fullName;
      if (user.avatarId) updates.avatarId = user.avatarId;

      if (user.lesson1Completed === 1) updates["lesson1/completed"] = true;
      if (user.lesson2Completed === 1) {
        updates["gene_genius/completed"] = true;
        updates["gene_genius/score"] = 5;
      }
      if (user.lesson3Completed === 1) updates["curious_case/completed"] = true;
      if (user.lesson4Completed === 1) updates["lesson4/completed"] = true;
      if (user.lesson5Completed === 1) updates["lesson5/completed"] = true;
      if (user.lesson5_5Completed === 1) updates["lesson5_5/completed"] = true;
      if (user.lesson6Completed === 1) updates["lesson6/completed"] = true;
      if (user.lesson7Completed === 1) updates["lesson7/completed"] = true;

      if (user.lesson8Completed === 1) updates["lesson8/completed"] = true;
      if (user.lesson8Score > 0) updates["lesson8/score"] = user.lesson8Score;

      if (user.lesson9Completed === 1) updates["lesson9/completed"] = true;
      if (user.lesson9Score > 0) updates["lesson9/score"] = user.lesson9Score;

      if (user.lesson10Completed === 1) updates["lesson10/completed"] = true;
      if (user.lesson10Score > 0)
        updates["lesson10/score"] = user.lesson10Score;

      // NEW: Final Quiz Sync
      if (user.finalQuizCompleted === 1) updates["final_quiz/completed"] = true;
      if (user.finalQuizScore > 0)
        updates["final_quiz/score"] = user.finalQuizScore;

      if (Object.keys(updates).length > 0) {
        await update(userRef, updates);
        console.log(`Successfully auto-synced user ${user.uid} to Firebase!`);
      }

      markUserSynced(user.uid);
    } catch (error) {
      console.error("Sync failed for user:", user.uid, error);
    }
  }
};
