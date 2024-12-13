import path from "path";
import sqlite3 from "sqlite3";

const getSongDetails = (id: number): Promise<any> => {
  const dbPath = path.resolve(__dirname, "../../db/songsList.db");

  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error("Error connecting to SQLite database:", err.message);
        return reject(
          new Error("Error connecting to SQLite database: " + err.message)
        );
      }
    });

    const query = `SELECT * FROM songs WHERE id = ?`;

    db.get(query, [id], (err, rows) => {
      if (err) {
        reject(new Error("Error executing query: " + err.message));
      } else {
        resolve(rows);
      }

      db.close((closeErr) => {
        if (closeErr) {
          console.error(
            "Error closing the database connection:",
            closeErr.message
          );
        }
      });
    });
  });
};

export default getSongDetails;
