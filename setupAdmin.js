const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        return;
    }
    console.log('Connected to the SQLite database.');

    // Create admin table and insert default
    db.serialize(() => {
        db.run(`
            CREATE TABLE IF NOT EXISTS admins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            )
        `);

        // Insert default admin if table is empty
        const defaultPassword = 'admin123';
        const hash = bcrypt.hashSync(defaultPassword, 10);

        db.get("SELECT COUNT(*) as count FROM admins", [], (err, row) => {
            if (row.count === 0) {
                db.run("INSERT INTO admins (username, password) VALUES ('admin', ?)", [hash], (err) => {
                    if (err) console.error(err.message);
                    else console.log('Default admin created.');
                });
            } else {
                // If it exists, update it to make sure it's valid
                db.run("UPDATE admins SET password = ? WHERE username = 'admin'", [hash], (err) => {
                    if (err) console.error(err.message);
                    else console.log('Admin password updated/verified.');
                });
            }
        });
    });
});
