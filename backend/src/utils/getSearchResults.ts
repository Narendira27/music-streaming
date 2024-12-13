import path from "path";
import sqlite3 from "sqlite3";

const searchSongs = (value: string): Promise<any[]> => {
  const dbPath = path.resolve(__dirname, "../../db/songsList.db");

  return new Promise((resolve, reject) => {
    // Connect to the SQLite database
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.log(err);
        return reject(
          new Error("Error connecting to SQLite database: " + err.message)
        );
      }
    });

    const query = `SELECT * FROM songs WHERE song_name LIKE ? OR album LIKE ?`;
    const searchValue = `${value}%`;

    // Execute the query
    db.all(query, [searchValue, searchValue], (err, rows) => {
      if (err) {
        reject(new Error("Error executing query: " + err.message));
      } else {
        resolve(rows);
      }
    });

    // Close the database connection
    db.close((err) => {
      if (err) {
        console.error("Error closing the database connection:", err.message);
      }
    });
  });
};

export default searchSongs;
