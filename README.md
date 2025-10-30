# Red5 Node Backend SDK

Red5 Node Backend SDK allows you to generate conference tokens for different user roles in your Red5 video conferencing application and generate chat tokens for chat authentication.

## Installation

```bash
npm install red5-bcs-node
```

## Features

- 🔐 Secure conference token generation with multiple user role support
- 🔐 Secure chat token generation for sending/receiving messages from channels

## Quick Start

```javascript
import Red5Client from 'red5-bcs-node';

// Get masterKey and masterSecret from Red5 Cloud panel
// For production, get these from environment variables!
const masterKey = '12m1k90e4122230a0085a9a48050c23c';
const masterSecret = 'YUN1UzSlMzRkZmI0Yzc1YjhhNWU4MTUzNWM4N2U2N2I2ZjE4OWRiODA1NjZhMTlmMzIxYTVlYWU5YTIyNmRlMjQ1ZTQwYTZkMGNkZjhiZmUyYzczMzcxNDU5YTRhMTc5MjE3ZGE3YmNhYjI0ZWI3MTEzMTgzZjYzMjVmYjA1OTU3YmU4YWUxZjBlMTY1NGE4YjEyMTliMDFhMTRmNzYlYUhiOWQzZmJlMmUwYWIxNWZlZTY4OWQ3ZWRkMjZkYTU2MDE3OTQ2N2QwMWU2NDVhMTg5YTk4MmJmZTg1ZWQyOWRhOTQ4YWEwZDQyN2Y4MjYwZmY1YTIxNmIwOTI5Yjk5ZTI3YzFjYjdkYWY5MDRjM2RhMGUxZmQ4MWZmMWE2MDM5MDc4NWQ3ODgxNWE1OYU0MzQ2OGZhOGRlYjQ2YmI3YzY5OTg3YzUzZDUwNjkwYTJlMzE0YjcwMjhiMmIyN2Y5MA==';

const client = new Red5Client(masterKey, masterSecret);

async function getConferenceToken() {
  const conferenceToken = await client.getConferenceToken("someUser", "someRoomId", "admin");
  return conferenceToken;
}

const conferenceToken = getConferenceToken();
// Use this token in red5 frontend conference sdk.
console.log(token);


async function getChatToken(){
var userId = "someUserId"
var channelId = "someChannelId"
var allowRead = true;
var allowWrite = true;
var ttlMinutes = 60

const chatToken = await client.getChatToken(userId, channelId, allowRead, allowWrite, ttlMinutes)
return chatToken;
}


async function main(){
const chatToken =  await getChatToken()
console.log(chatToken)

}
main()



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


### `getChatToken(userId, channelId, read, write, ttlMinutes)`

Generates a secure chat token for authenticating users to send and receive messages in specific channels.

**Parameters:**

- `userId` (string, required) - Unique identifier for the user requesting chat access
- `channelId` (string, required) - Chat channel identifier the user wants to join
- `read` (boolean, required) - Grant read permission (receive messages)
- `write` (boolean, required) - Grant write permission (send messages)
- `ttlMinutes` (number, optional) - Token validity duration in minutes (default: `60`)

**Returns:**

Promise that resolves to a token string that grants access to:
- The specified channel with read/write permissions

**Example:**
```javascript
// Full access token (read and write) with 1-hour expiration
const fullAccessToken = await client.getChatToken(
  "user123",
  "chat-room-1",
  true,
  true,
  60
);

// Read-only token (viewer can only receive messages)
const readOnlyToken = await client.getChatToken(
  "viewer456",
  "chat-room-1",
  true,
  false,
  30
);

// Write-only token (user can only send messages)
const writeOnlyToken = await client.getChatToken(
  "sender789",
  "chat-room-1",
  false,
  true,
  120
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

app.post('/api/get-chat-token', async (req, res) => {
  const { userId, channelId, read, write, ttlMinutes } = req.body;
  
  // Add your authentication/authorization logic here
  
  try {
    const token = await client.getChatToken(userId, channelId, read, write, ttlMinutes);
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


```

## Requirements

- Red5 Cloud account with valid master credentials