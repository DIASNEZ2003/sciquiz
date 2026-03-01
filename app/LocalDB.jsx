import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("sciquiz4.db");

export const initDB = () => {
  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS users (
        uid TEXT PRIMARY KEY NOT NULL,
        email TEXT,
        password TEXT,
        fullName TEXT,
        avatarId TEXT,
        score INTEGER DEFAULT 0,
        lesson1Completed INTEGER DEFAULT 0,
        lesson2Completed INTEGER DEFAULT 0,
        lesson3Completed INTEGER DEFAULT 0,
        lesson4Completed INTEGER DEFAULT 0,
        lesson5Completed INTEGER DEFAULT 0,
        lesson5_5Completed INTEGER DEFAULT 0,
        lesson6Completed INTEGER DEFAULT 0,
        lesson7Completed INTEGER DEFAULT 0,
        lesson8Completed INTEGER DEFAULT 0,
        lesson8Score INTEGER DEFAULT 0,
        lesson9Completed INTEGER DEFAULT 0,
        lesson9Score INTEGER DEFAULT 0,
        lesson10Completed INTEGER DEFAULT 0,
        lesson10Score INTEGER DEFAULT 0,
        finalQuizCompleted INTEGER DEFAULT 0,
        finalQuizScore INTEGER DEFAULT 0,
        needsSync INTEGER DEFAULT 0
      );
    `);

    const tableInfo = db.getAllSync(`PRAGMA table_info(users);`);
    const existingColumns = tableInfo.map((col) => col.name);

    const requiredColumns = [
      "lesson1Completed",
      "lesson2Completed",
      "lesson3Completed",
      "lesson4Completed",
      "lesson5Completed",
      "lesson5_5Completed",
      "lesson6Completed",
      "lesson7Completed",
      "lesson8Completed",
      "lesson8Score",
      "lesson9Completed",
      "lesson9Score",
      "lesson10Completed",
      "lesson10Score",
      "finalQuizCompleted",
      "finalQuizScore", // ADDED FOR FINAL QUIZ
    ];

    requiredColumns.forEach((col) => {
      if (!existingColumns.includes(col)) {
        db.execSync(`ALTER TABLE users ADD COLUMN ${col} INTEGER DEFAULT 0;`);
        console.log(`Migration: Added missing column ${col}`);
      }
    });
    console.log("SQLite Database initialized successfully!");
  } catch (error) {
    console.error("Error creating/migrating SQLite table:", error);
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
    const existingUser = db.getFirstSync(
      `SELECT uid FROM users WHERE uid = ?;`,
      [uid],
    );
    if (existingUser) {
      db.runSync(
        `UPDATE users SET email=?, password=?, fullName=?, avatarId=?, score=?, needsSync=? WHERE uid=?;`,
        [
          email || "",
          password || "",
          fullName || "",
          avatarId || null,
          score || 0,
          needsSync,
          uid,
        ],
      );
    } else {
      db.runSync(
        `INSERT INTO users (uid, email, password, fullName, avatarId, score, needsSync) VALUES (?, ?, ?, ?, ?, ?, ?);`,
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
    }
  } catch (error) {
    console.error("Error saving user to SQLite:", error);
  }
};

export const syncFirebaseToLocal = (uid, data) => {
  try {
    const l1 = data?.lesson1?.completed ? 1 : 0;
    const l2 = data?.gene_genius?.completed ? 1 : 0;
    const l3 = data?.curious_case?.completed ? 1 : 0;
    const l4 = data?.lesson4?.completed ? 1 : 0;
    const l5 = data?.lesson5?.completed ? 1 : 0;
    const l5_5 = data?.lesson5_5?.completed ? 1 : 0;
    const l6 = data?.lesson6?.completed ? 1 : 0;
    const l7 = data?.lesson7?.completed ? 1 : 0;
    const l8 = data?.lesson8?.completed ? 1 : 0;
    const l8Score = data?.lesson8?.score || 0;
    const l9 = data?.lesson9?.completed ? 1 : 0;
    const l9Score = data?.lesson9?.score || 0;
    const l10 = data?.lesson10?.completed ? 1 : 0;
    const l10Score = data?.lesson10?.score || 0;

    // FINAL QUIZ SYNC
    const finalQ = data?.final_quiz?.completed ? 1 : 0;
    const finalQScore = data?.final_quiz?.score || 0;

    const score = data?.score || 0;

    db.runSync(
      `
      UPDATE users 
      SET lesson1Completed = ?, lesson2Completed = ?, lesson3Completed = ?, lesson4Completed = ?, lesson5Completed = ?, lesson5_5Completed = ?, lesson6Completed = ?, lesson7Completed = ?, lesson8Completed = ?, lesson8Score = ?, lesson9Completed = ?, lesson9Score = ?, lesson10Completed = ?, lesson10Score = ?, finalQuizCompleted = ?, finalQuizScore = ?, score = ?
      WHERE uid = ?;
    `,
      [
        l1,
        l2,
        l3,
        l4,
        l5,
        l5_5,
        l6,
        l7,
        l8,
        l8Score,
        l9,
        l9Score,
        l10,
        l10Score,
        finalQ,
        finalQScore,
        score,
        uid,
      ],
    );
  } catch (error) {
    console.error("Error syncing Firebase to Local:", error);
  }
};

export const updateLocalProgress = (uid, columnToUpdate, isCompleted) => {
  try {
    const validColumns = [
      "lesson1Completed",
      "lesson2Completed",
      "lesson3Completed",
      "lesson4Completed",
      "lesson5Completed",
      "lesson5_5Completed",
      "lesson6Completed",
      "lesson7Completed",
      "lesson8Completed",
      "lesson9Completed",
      "lesson10Completed",
      "finalQuizCompleted",
    ];

    if (!validColumns.includes(columnToUpdate)) return;

    db.runSync(
      `UPDATE users SET ${columnToUpdate} = ?, needsSync = 1 WHERE uid = ?;`,
      [isCompleted ? 1 : 0, uid],
    );
  } catch (error) {
    console.error("Error updating local progress:", error);
  }
};

export const updateLocalLessonScore = (uid, scoreColumn, newScore) => {
  try {
    db.runSync(
      `UPDATE users SET ${scoreColumn} = ?, needsSync = 1 WHERE uid = ?;`,
      [newScore, uid],
    );
  } catch (error) {
    console.error("Error updating local lesson score:", error);
  }
};

export const updateLocalUserScore = (uid, newScore) => {
  try {
    db.runSync(`UPDATE users SET score = ?, needsSync = 1 WHERE uid = ?;`, [
      newScore,
      uid,
    ]);
  } catch (error) {
    console.error("Error updating local score:", error);
  }
};

export const getLocalUser = (uid) => {
  try {
    return db.getFirstSync(`SELECT * FROM users WHERE uid = ?;`, [uid]) || null;
  } catch (error) {
    return null;
  }
};

export const getLocalUserByCredentials = (email, password) => {
  try {
    return db.getFirstSync(
      `SELECT * FROM users WHERE email = ? AND password = ?;`,
      [email, password],
    );
  } catch (error) {
    return null;
  }
};

export const getUnsyncedUsers = () => {
  try {
    return db.getAllSync(`SELECT * FROM users WHERE needsSync = 1;`);
  } catch (error) {
    return [];
  }
};

export const markUserSynced = (uid) => {
  try {
    db.runSync(`UPDATE users SET needsSync = 0 WHERE uid = ?;`, [uid]);
  } catch (error) {
    console.error("Error marking user as synced:", error);
  }
};

export const logEntireDatabase = () => {
  try {
    const allUsers = db.getAllSync(`SELECT * FROM users;`);
    console.log("\n=== SQLITE DATABASE CONTENTS ===");
    console.log(JSON.stringify(allUsers, null, 2));
    console.log("================================\n");
  } catch (error) {
    console.error("Could not fetch database contents:", error);
  }
};
