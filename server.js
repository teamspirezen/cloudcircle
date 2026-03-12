const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'thecloutcircle_super_secret_key_2026'; // In production, use environment variables

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '')));

// --- AUTHENTICATION ---

// Simple hardcoded admin password for this use-case (admin123)
// Hash generated using: bcrypt.hashSync('admin123', 10)
const ADMIN_PASSWORD_HASH = '$2b$10$WpkkL28KbHrv4kGTafcKGVbiWsCioqii9/4aTlnTxfT6E4K0T4lI2';

app.post('/api/login', (req, res) => {
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ error: 'Password is required' });
    }

    db.get("SELECT password FROM admins WHERE username = 'admin'", [], async (err, row) => {
        if (err) {
            console.error('Database error during login:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (!row) {
            return res.status(401).json({ error: 'Admin account not found' });
        }

        try {
            const match = await bcrypt.compare(password, row.password);
            if (match) {
                const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
                res.json({ token, message: 'Login successful' });
            } else {
                res.status(401).json({ error: 'Invalid password' });
            }
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
});

// Middleware to verify JWT token for protected routes
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
        req.user = user;
        next();
    });
};

// --- API ROUTES ---

// 1. Submit new application (Public)
app.post('/api/applications', (req, res) => {
    const {
        id, name, phone, age, qualification, experience,
        gender, vehicle, location, coupon, languages, status, timestamp
    } = req.body;

    const query = `
        INSERT INTO applications (id, name, phone, age, qualification, experience, gender, vehicle, location, coupon, languages, status, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(query, [id, name, phone, age, qualification, experience, gender, vehicle, location, coupon, languages, status, timestamp], function (err) {
        if (err) {
            console.error('Error inserting application:', err.message);
            return res.status(500).json({ error: 'Failed to submit application' });
        }
        res.status(201).json({ message: 'Application submitted successfully', id: id });
    });
});

// 2. Get all applications (Protected)
app.get('/api/applications', authenticateToken, (req, res) => {
    db.all("SELECT * FROM applications ORDER BY timestamp DESC", [], (err, rows) => {
        if (err) {
            console.error('Error fetching applications:', err.message);
            return res.status(500).json({ error: 'Failed to retrieve applications' });
        }
        res.json(rows);
    });
});

// 3. Update application status (Protected)
app.put('/api/applications/:id/status', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) return res.status(400).json({ error: 'Status is required' });

    const query = "UPDATE applications SET status = ? WHERE id = ?";
    db.run(query, [status, id], function (err) {
        if (err) {
            console.error('Error updating status:', err.message);
            return res.status(500).json({ error: 'Failed to update status' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Application not found' });
        }
        res.json({ message: 'Status updated successfully' });
    });
});

// 4. Delete an application (Protected)
app.delete('/api/applications/:id', authenticateToken, (req, res) => {
    const { id } = req.params;

    const query = "DELETE FROM applications WHERE id = ?";
    db.run(query, [id], function (err) {
        if (err) {
            console.error('Error deleting application:', err.message);
            return res.status(500).json({ error: 'Failed to delete application' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Application not found' });
        }
        res.json({ message: 'Application deleted successfully' });
    });
});

// 5. Delete all applications (Protected)
app.delete('/api/applications', authenticateToken, (req, res) => {
    const query = "DELETE FROM applications";
    db.run(query, [], function (err) {
        if (err) {
            console.error('Error clearing applications:', err.message);
            return res.status(500).json({ error: 'Failed to clear applications' });
        }
        res.json({ message: 'All applications cleared successfully' });
    });
});

// --- START SERVER ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`To access the admin panel, go to http://localhost:${PORT}/admin.html`);
});
