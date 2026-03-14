const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        // Initialize tables
        initDb();
    }
});

function initDb() {
    // Create applications table
    db.run(`
        CREATE TABLE IF NOT EXISTS applications (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            age INTEGER NOT NULL,
            qualification TEXT NOT NULL,
            experience TEXT NOT NULL,
            gender TEXT NOT NULL,
            vehicle TEXT NOT NULL,
            location TEXT NOT NULL,
            coupon TEXT,
            languages TEXT NOT NULL,
            status TEXT DEFAULT 'Pending',
            timestamp TEXT NOT NULL
        )
    `, (err) => {
        if (err) console.error('Error creating applications table:', err.message);
    });
}

module.exports = db;
