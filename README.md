# Red5 Node Backend SDK

Red5 Node Backend SDK allows you to generate conference tokens for different user roles in your Red5 video conferencing application and generate chat tokens for chat authentication.

## Installation

```bash
npm install red5-bcs-node
```

## Features

- 🔐 Secure conference token generation with multiple user role support
- 🔐 Secure chat token generation for sending/receiving messages from channels
- 🎥 Conference room management API methods (user management, recording, transcription)
- 📊 Room and user status monitoring
- 🎬 Recording and transcription control

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

## Conference API Methods

The SDK provides methods to manage conference rooms, users, recording, and transcription. All methods automatically generate admin tokens and make authenticated requests to the Stream Manager Conference API.

### Room & User Management

#### `getUserStatus(roomId, userId)`

Get detailed status information for a specific user in a room.

**Parameters:**
- `roomId` (string, required) - Room identifier
- `userId` (string, required) - User identifier

**Returns:** Promise resolving to user status object containing:
- `uid` - User ID
- `online` - Online status (boolean)
- `role` - User role (admin/publisher/subscriber)
- `audioEnabled` - Audio status (boolean)
- `videoEnabled` - Video status (boolean)
- `joinTime` - Timestamp when user joined

**Example:**
```javascript
const userStatus = await client.getUserStatus('room123', 'user456');
console.log(userStatus);
// { uid: 'user456', online: true, role: 'publisher', audioEnabled: true, videoEnabled: true, joinTime: 1234567890 }
```

#### `getUserList(roomId, limit, offset)`

Get paginated list of all users in a room.

**Parameters:**
- `roomId` (string, required) - Room identifier
- `limit` (number, optional) - Maximum users to return (default: 100)
- `offset` (number, optional) - Pagination offset (default: 0)

**Returns:** Promise resolving to object with `userCount` and `users` array

**Example:**
```javascript
const userList = await client.getUserList('room123', 50, 0);
console.log(userList);
// { userCount: 3, users: [...] }
```

#### `getHostList(roomId)`

Get list of all hosts (publishers) in a room.

**Parameters:**
- `roomId` (string, required) - Room identifier

**Returns:** Promise resolving to object with `hostCount` and `hosts` array

**Example:**
```javascript
const hosts = await client.getHostList('room123');
console.log(hosts);
// { hostCount: 2, hosts: [...] }
```

#### `getRoomList(state, limit, offset)`

Get paginated list of all conference rooms filtered by state.

**Parameters:**
- `state` (string, optional) - Filter by room state: 'active', 'inactive', or 'all' (default: 'active')
- `limit` (number, optional) - Maximum rooms to return (default: 50)
- `offset` (number, optional) - Pagination offset (default: 0)

**Returns:** Promise resolving to object with `roomCount` and `rooms` array

**Example:**
```javascript
const activeRooms = await client.getRoomList('active', 20, 0);
console.log(activeRooms);
// { roomCount: 5, rooms: [...] }
```

### User Moderation

#### `blockUser(roomId, userId, blockDurationSeconds)`

Block a user from accessing a room for a specified duration.

**Parameters:**
- `roomId` (string, required) - Room identifier
- `userId` (string, required) - User identifier to block
- `blockDurationSeconds` (number, optional) - Block duration in seconds (default: 1)

**Returns:** Promise resolving to block confirmation message

**Example:**
```javascript
// Block user for 1 hour
const result = await client.blockUser('room123', 'badUser', 3600);
console.log(result.message);
// "User with ID badUser in room room123 blocked for 3600 seconds"
```

#### `unblockUser(roomId, userId)`

Unblock a previously blocked user.

**Parameters:**
- `roomId` (string, required) - Room identifier
- `userId` (string, required) - User identifier to unblock

**Returns:** Promise resolving to unblock confirmation message

**Example:**
```javascript
const result = await client.unblockUser('room123', 'badUser');
console.log(result.message);
// "User with ID badUser in room room123 unblocked"
```

### Recording Control

#### `startRecording(roomId)`

Start recording for all active streams in a room. The recording combines all participant streams into a single output.

**Parameters:**
- `roomId` (string, required) - Room identifier

**Returns:** Promise resolving to object containing:
- `message` - Success message
- `recordingStreamName` - Name of the recording stream
- `participantCount` - Number of participants being recorded
- `originIp` - Origin server IP handling the recording

**Example:**
```javascript
const recording = await client.startRecording('room123');
console.log(recording);
// { message: "Recording stream created...", recordingStreamName: "room123_1234567890", participantCount: 5, originIp: "10.0.0.1" }
```

#### `stopRecording(roomId)`

Stop the active recording for a room.

**Parameters:**
- `roomId` (string, required) - Room identifier

**Returns:** Promise resolving to object containing:
- `message` - Success message
- `recordingStreamName` - Name of the stopped recording stream
- `mixerStopped` - Boolean indicating if mixer was stopped successfully

**Example:**
```javascript
const result = await client.stopRecording('room123');
console.log(result);
// { message: "Recording stopped successfully...", recordingStreamName: "room123_1234567890", mixerStopped: true }
```

### Transcription Control

#### `startTranscription(roomId, userId)`

Start real-time transcription for all participant audio streams, with transcriptions delivered to a specific user.

**Parameters:**
- `roomId` (string, required) - Room identifier
- `userId` (string, required) - User ID who will receive transcriptions

**Returns:** Promise resolving to object containing:
- `message` - Success message
- `successfulStreams` - Array of stream names with transcription started
- `totalParticipants` - Total number of participants

**Example:**
```javascript
const result = await client.startTranscription('room123', 'user456');
console.log(result);
// { message: "Transcription started successfully...", successfulStreams: [...], totalParticipants: 5 }
```

#### `stopTranscription(roomId, userId)`

Stop transcription delivery for a specific user.

**Parameters:**
- `roomId` (string, required) - Room identifier
- `userId` (string, required) - User ID to stop receiving transcriptions

**Returns:** Promise resolving to object containing:
- `message` - Success message
- `successfulStreams` - Array of stream names with transcription updated
- `totalParticipants` - Total number of participants

**Example:**
```javascript
const result = await client.stopTranscription('room123', 'user456');
console.log(result);
// { message: "Transcription stopped successfully...", successfulStreams: [...], totalParticipants: 5 }
```

## Complete Usage Example

```javascript
import Red5Client from 'red5-bcs-node';

const client = new Red5Client(
  process.env.RED5_MASTER_KEY,
  process.env.RED5_MASTER_SECRET
);

async function manageConference() {
  try {
    // Get list of active rooms
    const rooms = await client.getRoomList('active');
    console.log(`Active rooms: ${rooms.roomCount}`);

    // Get users in a specific room
    const users = await client.getUserList('room123');
    console.log(`Users in room: ${users.userCount}`);

    // Start recording
    const recording = await client.startRecording('room123');
    console.log(`Recording started: ${recording.recordingStreamName}`);

    // Start transcription for a user
    await client.startTranscription('room123', 'user456');

    // Block a disruptive user for 30 minutes
    await client.blockUser('room123', 'spammer', 1800);

    // Later, stop recording
    await client.stopRecording('room123');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

manageConference();
```

## Express.js API Endpoint Examples

```javascript
import express from 'express';
import Red5Client from 'red5-bcs-node';

const app = express();
const client = new Red5Client(
  process.env.RED5_MASTER_KEY,
  process.env.RED5_MASTER_SECRET
);

// Get conference token for user
app.post('/api/conference/token', async (req, res) => {
  const { userId, roomId, role } = req.body;
  try {
    const token = await client.getConferenceToken(userId, roomId, role);
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start recording
app.post('/api/conference/recording/start', async (req, res) => {
  const { roomId } = req.body;
  try {
    const result = await client.startRecording(roomId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stop recording
app.post('/api/conference/recording/stop', async (req, res) => {
  const { roomId } = req.body;
  try {
    const result = await client.stopRecording(roomId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get room users
app.get('/api/conference/room/:roomId/users', async (req, res) => {
  const { roomId } = req.params;
  try {
    const users = await client.getUserList(roomId);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Block user
app.post('/api/conference/room/:roomId/user/:userId/block', async (req, res) => {
  const { roomId, userId } = req.params;
  const { duration } = req.body; // duration in seconds
  try {
    const result = await client.blockUser(roomId, userId, duration);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

## Requirements

- Red5 Cloud account with valid master credentials