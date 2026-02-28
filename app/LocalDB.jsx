// app/LocalDB.jsx
import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("sciquiz3.db");

export const initDB = () => {
  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS users (
        uid TEXT PRIMARY KEY NOT NULL,
        email TEXT,
        password TEXT,
        fullName TEXT,
        avatarId TEXT,
        score INTEGER,
        needsSync INTEGER DEFAULT 0
      );
    `);
    console.log("SQLite Database initialized!");
  } catch (error) {
    console.error("Error creating SQLite table:", error);
  }
};

export const saveLocalUser = (
  uid,
  email,
  password,
  fullName,
  avatarId,
  score,
  needsSync = 0,
) => {
  try {
    db.runSync(
      `INSERT OR REPLACE INTO users (uid, email, password, fullName, avatarId, score, needsSync) 
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [
        uid,
        email || "",
        password || "",
        fullName || "",
        avatarId || null,
        score || 0,
        needsSync,
      ],
    );
    console.log("Saved user to SQLite successfully!");
  } catch (error) {
    console.error("Error saving to SQLite:", error);
  }
};

export const getLocalUserByCredentials = (email, password) => {
  return db.getFirstSync(
    `SELECT * FROM users WHERE email = ? AND password = ?;`,
    [email, password],
  );
};

export const getLocalUser = (uid) => {
  return db.getFirstSync(`SELECT * FROM users WHERE uid = ?;`, [uid]);
};

export const getUnsyncedUsers = () => {
  return db.getAllSync(`SELECT * FROM users WHERE needsSync = 1;`);
};

export const markUserSynced = (uid) => {
  db.runSync(`UPDATE users SET needsSync = 0 WHERE uid = ?;`, [uid]);
};

export const logEntireDatabase = () => {
  try {
    const allUsers = db.getAllSync(`SELECT * FROM users;`);
    console.log("\n=== SQLITE DATABASE CONTENTS ===");
    console.log(JSON.stringify(allUsers, null, 2));
    console.log("================================\n");
  } catch (error) {
    console.error("Could not fetch database:", error);
  }
};
