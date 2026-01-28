# gator project

A CLI-based RSS feed aggregator that allows users to follow multiple blogs, fetch posts automatically, and browse content from their followed feeds.

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd blog-aggregator
```

2. Install dependencies:

```bash
npm install
```

3. Set up the database:

```bash
npm run migrate
```

## Configuration

The application requires a configuration file at `~/.gatorconfig.json` with your database URL. Create this file manually:

```json
{
  "db_url": "postgresql://username:password@localhost:5432/database_name",
  "current_user_name": ""
}
```

Replace `username`, `password`, and `database_name` with your PostgreSQL credentials.

## Running the Application

The CLI is run using:

```bash
npm start <command> [arguments]
```

## Available Commands

### User Management

- **`register <username>`** - Create a new user account and log in
- **`login <username>`** - Log in as an existing user
- **`users`** - List all registered users (shows current user)
- **`reset`** - Reset the users table (development only)

### Feed Management

- **`addfeed <name> <url>`** - Add a new RSS feed (requires login)
- **`feeds`** - List all available feeds
- **`follow <url>`** - Follow an existing feed by URL (requires login)
- **`unfollow <url>`** - Unfollow a feed by URL (requires login)
- **`following`** - Show feeds you're currently following (requires login)

### Content Browsing

- **`browse [limit]`** - Browse posts from feeds you follow (requires login, optional limit)
- **`agg <duration>`** - Start the feed aggregator that fetches posts automatically (e.g., `agg 1m` for 1 minute intervals)

### Duration Format

The `agg` command accepts durations in the format:

- `Xms` - milliseconds (e.g., `500ms`)
- `Xs` - seconds (e.g., `30s`)
- `Xm` - minutes (e.g., `5m`)
- `Xh` - hours (e.g., `2h`)

## Usage Examples

1. **Set up a new user:**

```bash
npm start register johndoe
```

2. **Add and follow a feed:**

```bash
npm start addfeed techblog "https://example.com/rss.xml"
npm start follow "https://example.com/rss.xml"
```

3. **Browse recent posts:**

```bash
npm start browse 10
```

4. **Start automatic feed fetching:**

```bash
npm start agg 5m
```

## Database Schema

The application uses PostgreSQL with the following main tables:

- `users` - User accounts
- `feeds` - RSS feed information
- `feed_follows` - User-feed relationships
- `posts` - Individual blog posts from feeds

## Development

### Database Migrations

To generate new migrations after schema changes:

```bash
npm run generate
```

To apply migrations:

```bash
npm run migrate
```

### Project Structure

- `src/index.ts` - Main CLI application and command handlers
- `src/config.ts` - Configuration file management
- `src/lib/db/` - Database schema, queries, and migrations
- `src/lib/db/schema.ts` - Drizzle ORM database schema definitions

## Technologies Used

- **Node.js** - Runtime environment
- **TypeScript** - Type-safe JavaScript
- **Drizzle ORM** - Database ORM
- **PostgreSQL** - Database
- **fast-xml-parser** - RSS feed parsing
- **tsx** - TypeScript execution

## Notes

- The aggregator fetches RSS feeds and stores posts in the database
- Each user can follow different feeds and browse their own content
- The `agg` command runs continuously until stopped with Ctrl+C
- RSS feeds are fetched automatically at the specified interval when the aggregator is running
