const express = require('express');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const {
    initDatabase,
    createPoll,
    getPoll,
    submitVote,
    getPollResults,
    getTotalVotes
} = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Initialize database
initDatabase().then(() => {
    console.log('Database initialized successfully');
}).catch(err => {
    console.error('Database initialization failed:', err);
    process.exit(1);
});

// Helper function to get client IP
function getClientIP(req) {
    return req.headers['x-forwarded-for'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null);
}

// Routes

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve poll page
app.get('/poll/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'poll.html'));
});

// Serve results page
app.get('/results/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'results.html'));
});

// API Routes

// Create a new poll
app.post('/api/polls', async (req, res) => {
    try {
        const { title, description, options, deadline } = req.body;
        
        // Validate input
        if (!title || !options || !Array.isArray(options) || options.length < 2) {
            return res.status(400).json({ 
                error: 'Title and at least 2 options are required' 
            });
        }

        // Filter out empty options
        const validOptions = options.filter(option => option.trim().length > 0);
        if (validOptions.length < 2) {
            return res.status(400).json({ 
                error: 'At least 2 non-empty options are required' 
            });
        }

        // Validate deadline if provided
        if (deadline && new Date(deadline) <= new Date()) {
            return res.status(400).json({ 
                error: 'Deadline must be in the future' 
            });
        }

        const pollId = uuidv4();
        const poll = await createPoll({
            id: pollId,
            title: title.trim(),
            description: description ? description.trim() : '',
            options: validOptions,
            deadline: deadline || null
        });

        res.json({ 
            success: true, 
            poll: poll,
            pollUrl: `${req.protocol}://${req.get('host')}/poll/${pollId}`,
            resultsUrl: `${req.protocol}://${req.get('host')}/results/${pollId}`
        });
    } catch (error) {
        console.error('Error creating poll:', error);
        res.status(500).json({ error: 'Failed to create poll' });
    }
});

// Get poll details
app.get('/api/polls/:id', async (req, res) => {
    try {
        const poll = await getPoll(req.params.id);
        if (!poll) {
            return res.status(404).json({ error: 'Poll not found' });
        }

        // Check if poll has expired
        const isExpired = poll.deadline && new Date(poll.deadline) <= new Date();
        
        res.json({ 
            success: true, 
            poll: { ...poll, isExpired }
        });
    } catch (error) {
        console.error('Error fetching poll:', error);
        res.status(500).json({ error: 'Failed to fetch poll' });
    }
});

// Submit a vote
app.post('/api/polls/:id/vote', async (req, res) => {
    try {
        const pollId = req.params.id;
        const { optionIndex } = req.body;
        const voterIp = getClientIP(req);

        // Validate option index
        if (optionIndex === undefined || optionIndex < 0) {
            return res.status(400).json({ error: 'Valid option selection is required' });
        }

        // Check if poll exists and is not expired
        const poll = await getPoll(pollId);
        if (!poll) {
            return res.status(404).json({ error: 'Poll not found' });
        }

        if (poll.deadline && new Date(poll.deadline) <= new Date()) {
            return res.status(400).json({ error: 'This poll has expired' });
        }

        if (optionIndex >= poll.options.length) {
            return res.status(400).json({ error: 'Invalid option selected' });
        }

        await submitVote(pollId, optionIndex, voterIp);
        
        res.json({ 
            success: true, 
            message: 'Vote submitted successfully',
            resultsUrl: `${req.protocol}://${req.get('host')}/results/${pollId}`
        });
    } catch (error) {
        if (error.message === 'You have already voted in this poll') {
            res.status(409).json({ error: error.message });
        } else {
            console.error('Error submitting vote:', error);
            res.status(500).json({ error: 'Failed to submit vote' });
        }
    }
});

// Get poll results
app.get('/api/polls/:id/results', async (req, res) => {
    try {
        const pollId = req.params.id;
        
        const [poll, results, totalVotes] = await Promise.all([
            getPoll(pollId),
            getPollResults(pollId),
            getTotalVotes(pollId)
        ]);

        if (!poll) {
            return res.status(404).json({ error: 'Poll not found' });
        }

        // Format results with option names and percentages
        const formattedResults = poll.options.map((option, index) => {
            const voteCount = results[index] || 0;
            const percentage = totalVotes > 0 ? ((voteCount / totalVotes) * 100).toFixed(1) : 0;
            
            return {
                option,
                votes: voteCount,
                percentage: parseFloat(percentage)
            };
        });

        const isExpired = poll.deadline && new Date(poll.deadline) <= new Date();

        res.json({
            success: true,
            poll: { ...poll, isExpired },
            results: formattedResults,
            totalVotes,
            pollUrl: `${req.protocol}://${req.get('host')}/poll/${pollId}`
        });
    } catch (error) {
        console.error('Error fetching results:', error);
        res.status(500).json({ error: 'Failed to fetch results' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Voting app server running on http://localhost:${PORT}`);
});

module.exports = app;