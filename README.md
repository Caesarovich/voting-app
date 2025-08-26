⚠️ This is not an app I built, it was 'vibe coded' by AI. I juste wanted to test the new Github Agent mode.

Prompt: Implement complete voting/poll application with private polls, shareable links, and deadline support

# 🗳️ Voting App

A web-based voting/poll application where users can create private polls, share them via links, and view real-time results with deadline support.

## Features

- **Create Polls**: Easy-to-use interface for creating polls with multiple options
- **Private & Shareable**: Each poll gets a unique link that can be shared privately
- **Real-time Results**: Live results with visual charts and percentages
- **Deadline Support**: Optional deadlines to automatically close polls
- **Duplicate Vote Prevention**: One vote per IP address per poll
- **Responsive Design**: Works on desktop and mobile devices
- **No Registration Required**: Anonymous voting and poll creation

## Tech Stack

- **Backend**: Node.js with Express
- **Database**: SQLite3 for data storage
- **Frontend**: Vanilla HTML, CSS, and JavaScript
- **Dependencies**: express, sqlite3, uuid

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd voting-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to `http://localhost:3000`

## Usage

### Creating a Poll

1. Visit the homepage (`/`)
2. Enter a poll title and description (optional)
3. Add poll options (minimum 2, maximum 10)
4. Set a deadline (optional)
5. Click "Create Poll"
6. Share the voting link with participants
7. Monitor results using the results link

### Voting

1. Visit a poll link (`/poll/:id`)
2. Select your preferred option
3. Click "Submit Vote"
4. View results immediately after voting

### Viewing Results

1. Visit a results link (`/results/:id`)
2. See real-time vote counts and percentages
3. Results auto-refresh every 30 seconds for active polls
4. Share the poll or results links

## API Endpoints

### POST /api/polls
Create a new poll
```json
{
  "title": "Your poll title",
  "description": "Optional description",
  "options": ["Option 1", "Option 2", "Option 3"],
  "deadline": "2024-12-31T23:59:59"
}
```

### GET /api/polls/:id
Get poll details

### POST /api/polls/:id/vote
Submit a vote
```json
{
  "optionIndex": 0
}
```

### GET /api/polls/:id/results
Get poll results with vote counts and percentages

## Database Schema

### Polls Table
- `id` (TEXT PRIMARY KEY): Unique poll identifier
- `title` (TEXT): Poll title
- `description` (TEXT): Optional poll description
- `options` (TEXT): JSON array of poll options
- `deadline` (TEXT): Optional deadline timestamp
- `created_at` (DATETIME): Creation timestamp

### Votes Table
- `id` (INTEGER PRIMARY KEY): Unique vote identifier
- `poll_id` (TEXT): Reference to poll
- `option_index` (INTEGER): Selected option index
- `voter_ip` (TEXT): Voter IP address (for duplicate prevention)
- `voted_at` (DATETIME): Vote timestamp

## Security Features

- **IP-based Vote Limiting**: Prevents multiple votes from the same IP
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Prevention**: Parameterized queries
- **XSS Prevention**: HTML escaping for user inputs
- **Deadline Enforcement**: Server-side deadline validation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details

## Development

### Running in Development Mode
```bash
npm run dev
```

### File Structure
```
voting-app/
├── server.js          # Main Express server
├── database.js        # Database operations
├── package.json       # Project configuration
├── public/           
│   ├── index.html    # Main page (poll creation)
│   ├── poll.html     # Voting page
│   ├── results.html  # Results page
│   ├── style.css     # CSS styles
│   └── script.js     # Client-side JavaScript
├── voting_app.db     # SQLite database (auto-created)
└── README.md         # This file
```

## Deployment

The app can be deployed to any Node.js hosting platform:

1. **Heroku**: Add `Procfile` with `web: node server.js`
2. **Railway**: Direct deployment from Git
3. **DigitalOcean**: App Platform or Droplet
4. **Vercel**: Serverless deployment
5. **AWS**: EC2 or Elastic Beanstalk

Make sure to set the `PORT` environment variable if required by your hosting platform.

## Future Enhancements

- User authentication and poll ownership
- Poll editing and deletion
- Advanced analytics and charts
- Export results to CSV/PDF
- Email notifications
- Poll templates
- Multi-language support
- Integration with external services