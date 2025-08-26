const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create or connect to the database
const db = new sqlite3.Database(path.join(__dirname, 'voting_app.db'));

// Initialize database tables
function initDatabase() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Create polls table
            db.run(`CREATE TABLE IF NOT EXISTS polls (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                options TEXT NOT NULL,
                deadline TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`, (err) => {
                if (err) {
                    console.error('Error creating polls table:', err);
                    reject(err);
                    return;
                }
            });

            // Create votes table
            db.run(`CREATE TABLE IF NOT EXISTS votes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                poll_id TEXT NOT NULL,
                option_index INTEGER NOT NULL,
                voter_ip TEXT,
                voted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (poll_id) REFERENCES polls (id)
            )`, (err) => {
                if (err) {
                    console.error('Error creating votes table:', err);
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    });
}

// Create a new poll
function createPoll(pollData) {
    return new Promise((resolve, reject) => {
        const { id, title, description, options, deadline } = pollData;
        const optionsJson = JSON.stringify(options);
        
        db.run(
            'INSERT INTO polls (id, title, description, options, deadline) VALUES (?, ?, ?, ?, ?)',
            [id, title, description, optionsJson, deadline],
            function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id, title, description, options, deadline });
                }
            }
        );
    });
}

// Get poll by ID
function getPoll(pollId) {
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT * FROM polls WHERE id = ?',
            [pollId],
            (err, row) => {
                if (err) {
                    reject(err);
                } else if (!row) {
                    resolve(null);
                } else {
                    const poll = {
                        ...row,
                        options: JSON.parse(row.options)
                    };
                    resolve(poll);
                }
            }
        );
    });
}

// Submit a vote
function submitVote(pollId, optionIndex, voterIp) {
    return new Promise((resolve, reject) => {
        // First check if this IP has already voted for this poll
        db.get(
            'SELECT id FROM votes WHERE poll_id = ? AND voter_ip = ?',
            [pollId, voterIp],
            (err, row) => {
                if (err) {
                    reject(err);
                } else if (row) {
                    reject(new Error('You have already voted in this poll'));
                } else {
                    // Submit the vote
                    db.run(
                        'INSERT INTO votes (poll_id, option_index, voter_ip) VALUES (?, ?, ?)',
                        [pollId, optionIndex, voterIp],
                        function(err) {
                            if (err) {
                                reject(err);
                            } else {
                                resolve({ voteId: this.lastID });
                            }
                        }
                    );
                }
            }
        );
    });
}

// Get poll results
function getPollResults(pollId) {
    return new Promise((resolve, reject) => {
        db.all(
            'SELECT option_index, COUNT(*) as vote_count FROM votes WHERE poll_id = ? GROUP BY option_index',
            [pollId],
            (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    // Create results array with vote counts
                    const results = {};
                    rows.forEach(row => {
                        results[row.option_index] = row.vote_count;
                    });
                    resolve(results);
                }
            }
        );
    });
}

// Get total vote count for a poll
function getTotalVotes(pollId) {
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT COUNT(*) as total FROM votes WHERE poll_id = ?',
            [pollId],
            (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row.total);
                }
            }
        );
    });
}

module.exports = {
    initDatabase,
    createPoll,
    getPoll,
    submitVote,
    getPollResults,
    getTotalVotes,
    db
};