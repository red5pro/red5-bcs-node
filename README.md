# Red5 Node Backend SDK

Red5 Node Backend SDK allows you to generate conference tokens for different user roles in your Red5 video conferencing application.

## Installation

```bash
npm install red5-bcs-node
```

## Features

- 🔐 Secure conference token generation with multiple user role support

## Quick Start

```javascript
import Red5Client from 'red5-bcs-node';

// Get masterKey and masterSecret from Red5 Cloud panel
// For production, get these from environment variables!
const masterKey = '12m1k90e4122230a0085a9a48050c23c';
const masterSecret = 'YUN1UzSlMzRkZmI0Yzc1YjhhNWU4MTUzNWM4N2U2N2I2ZjE4OWRiODA1NjZhMTlmMzIxYTVlYWU5YTIyNmRlMjQ1ZTQwYTZkMGNkZjhiZmUyYzczMzcxNDU5YTRhMTc5MjE3ZGE3YmNhYjI0ZWI3MTEzMTgzZjYzMjVmYjA1OTU3YmU4YWUxZjBlMTY1NGE4YjEyMTliMDFhMTRmNzYlYUhiOWQzZmJlMmUwYWIxNWZlZTY4OWQ3ZWRkMjZkYTU2MDE3OTQ2N2QwMWU2NDVhMTg5YTk4MmJmZTg1ZWQyOWRhOTQ4YWEwZDQyN2Y4MjYwZmY1YTIxNmIwOTI5Yjk5ZTI3YzFjYjdkYWY5MDRjM2RhMGUxZmQ4MWZmMWE2MDM5MDc4NWQ3ODgxNWE1OYU0MzQ2OGZhOGRlYjQ2YmI3YzY5OTg3YzUzZDUwNjkwYTJlMzE0YjcwMjhiMmIyN2Y5MA==';

const client = new Red5Client(masterKey, masterSecret);

async function getToken() {
  const conferenceToken = await client.getConferenceToken("someUser", "someRoomId", "admin");
  return conferenceToken;
}

const token = getToken();
// Use this token in red5 frontend conference sdk.
console.log(token);
```

## API Reference

### `getConferenceToken(userId, roomId, role, expirationMinutes)`

Generates a secure conference token that includes both Red5 conference authentication and embedded PubNub credentials.

**Parameters:**

- `userId` (string, required) - Unique identifier for the user joining the conference
- `roomId` (string, required) - Conference room identifier
- `role` (string, optional) - User role determining permissions. Options:
  - `'admin'` - Full control over the conference
  - `'publisher'` - Can publish audio/video streams
  - `'subscriber'` - Can only receive streams (default: `'publisher'`)
- `expirationMinutes` (number, optional) - Token validity duration in minutes (default: `60`)

**Returns:**

Promise that resolves to a JWT token string containing:
- User authentication credentials
- Room access permissions
- Embedded PubNub token for real-time messaging
- Token expiration time

**Example:**

```javascript
// Admin token with 2-hour expiration
const adminToken = await client.getConferenceToken(
  "user123",
  "room456",
  "admin",
  120
);

// Publisher token with default 1-hour expiration
const publisherToken = await client.getConferenceToken(
  "user456",
  "room456",
  "publisher"
);

// Subscriber token (view-only)
const subscriberToken = await client.getConferenceToken(
  "viewer789",
  "room456",
  "subscriber",
  30
);
```

## Using the Token

Pass the generated token to Red5 Conference SDK and API endpoints as an authorization bearer token.

### Recommended Setup:

1. Store credentials in environment variables:

```javascript
// .env file
RED5_MASTER_KEY=your_master_key_here
RED5_MASTER_SECRET=your_master_secret_here
```

2. Use them in your backend:

```javascript
import Red5Client from 'red5-bcs-node';

const client = new Red5Client(
  process.env.RED5_MASTER_KEY,
  process.env.RED5_MASTER_SECRET
);
```

3. Create a secure API endpoint:

```javascript
// Express.js example
app.post('/api/get-conference-token', async (req, res) => {
  const { userId, roomId, role } = req.body;
  
  // Add your authentication/authorization logic here
  
  try {
    const token = await client.getConferenceToken(userId, roomId, role);
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Requirements

- Red5 Cloud account with valid master credentials