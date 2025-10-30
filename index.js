const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const PubNub = require('pubnub');

class Red5Client {
  constructor(masterKey, masterSecret) {
    this.masterKey = masterKey;
    this.masterSecret = masterSecret;
    
    // Extract credentials on initialization
    this.credentials = this._extractCredentials();

    if (!this.credentials || !this._validateCredentials(this.credentials)) {
    console.error('Failed to initialize Red5Client: Missing or invalid credentials');
    return;
    }
    
    // Initialize PubNub client
    this.pubnub = new PubNub({
      subscribeKey: this.credentials.subKey,
      publishKey: this.credentials.pubKey,
      secretKey: this.credentials.pubnubSecret,
      userId: this.masterKey // Default userId for SDK
    });
  }

  _validateCredentials(credentials) {
    if (!credentials) {
      return false;
    }

    const required = ['conferenceSecret', 'pubnubSecret', 'pubKey', 'subKey'];
    const missing = required.filter(key => !credentials[key]);

    if (missing.length > 0) {
      console.error('Missing required credentials:', missing.join(', '));
      return false;
    }

    return true;
  }
  
  /**
   * Extract original service credentials from master key/secret
   * @private
   */
  _extractCredentials() {
    try {
      // Decode master secret to get encrypted credentials
      const encryptedCredentials = Buffer.from(this.masterSecret, 'base64').toString();
      
      // Decrypt using master key
      const decryptedBundle = this._decryptCredentials(encryptedCredentials, this.masterKey);
      
      // Parse the credentials
      const [conferenceSecret, pubnubSecret, pubKey, subKey] = decryptedBundle.split('|');
      
      return {
        conferenceSecret,
        pubnubSecret,
        pubKey,
        subKey
      };
    } catch (error) {
      throw new Error('Failed to extract credentials from master key/secret: ' + error.message);
    }
  }
  
  /**
   * Decrypt credentials using AES decryption
   * @private
   */
   _decryptCredentials(encryptedHex, key) {
      try {
        // Derive key the same way createDecipher did internally
        const keyBuffer = Buffer.from(key.substring(0, 16));
        const hash = crypto.createHash('md5').update(keyBuffer).digest();
        
        const decipher = crypto.createDecipheriv('aes-128-ecb', hash, null);
        decipher.setAutoPadding(true);
        
        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
      } catch (error) {
        throw new Error('Failed to decrypt credentials: ' + error.message);
      }
    }
  
  /**
   * Create Conference JWT token with embedded PubNub token
   * @private
   */
  async _createConferenceToken(secretKey, uid, roomId, role, pubnubSubscribeKey, pubnubPublishKey, pubnubToken, expirationMinutes = 60) {
    const payload = {
      uid: uid,
      roomId: roomId,
      role: role,
      pubnubSubscribeKey: pubnubSubscribeKey,
      pubnubPublishKey: pubnubPublishKey,
      pubnubToken: pubnubToken, // Embed PubNub token inside Conference JWT
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (expirationMinutes * 60)
    };
    
    const token = jwt.sign(payload, secretKey, { algorithm: 'HS256' });
    
    return token;
  }
  
  /**
   * Generate PubNub token for the given room and user
   * @private
   */
  async _generatePubnubToken(userId, roomId, ttlMinutes = 60) {
  try {
    const token = await this.pubnub.grantToken({
      ttl: ttlMinutes,
      authorized_uuid: userId,
      resources: {
        channels: {
          [roomId]: {
            read: true,
            write: true
          },
           [`${roomId}-pnpres`]: {
              read: true,
              write: true
            }
        }
      }
    });
    
    return token;
  } catch (error) {
    throw new Error('Failed to generate PubNub token: ' + error.message);
  }
}

  /**
   * Generate chat token for the given channel and user
   * @private
   */
  async getChatToken(userId, channelId, read, write, ttlMinutes = 60,) {
  try {
    const token = await this.pubnub.grantToken({
      ttl: ttlMinutes,
      authorized_uuid: userId,
      resources: {
        channels: {
          [channelId]: {
            read: read,
            write: write
          },
           [`${channelId}-pnpres`]: {
              read: read,
              write: write
            }
        }
      }
    });
    
    return token;
  } catch (error) {
    throw new Error('Failed to generate chat token: ' + error.message);
  }
}
  
  /**
   * Get conference token 
   * @param {string} userId - User ID for token authentication
   * @param {string} roomId - Room ID for the conference
   * @param {string} role - User role (e.g., 'admin', 'publisher', 'subscriber')
   * @param {number} expirationMinutes - Token expiration time in minutes (default: 60)
   * @returns {Promise<{token: string, userId: string, roomId: string, role: string, expiresAt: string}>}
   */
  async getConferenceToken(userId, roomId, role = 'publisher', expirationMinutes = 60) {
    if (!userId || !roomId) {
      throw new Error('userId and roomId are required');
    }
    
    if (!role) {
      throw new Error('role is required');
    }
    
    try {
      // First generate PubNub token
      const pubnubToken = await this._generatePubnubToken(
        userId.trim(),
        roomId.trim(),
        expirationMinutes
      );
      
      // Then embed it inside Conference JWT token
      const conferenceToken = await this._createConferenceToken(
        this.credentials.conferenceSecret,
        userId.trim(),
        roomId.trim(),
        role,
        this.credentials.subKey,
        this.credentials.pubKey,
        pubnubToken, // Embed PubNub token
        expirationMinutes
      );
      
     return conferenceToken
    } catch (error) {
      throw new Error('Failed to generate token: ' + error.message);
    }
  }
  
  /**
   * Get the extracted service credentials (for debugging/verification)
   * @returns {Object} The extracted credentials
   */
  getCredentials() {
    return {
      conferenceSecret: this.credentials.conferenceSecret,
      pubnubSecret: this.credentials.pubnubSecret,
      pubKey: this.credentials.pubKey,
      subKey: this.credentials.subKey
    };
  }
  
  /**
   * Validate if conference token is still valid
   * @param {string} conferenceToken - The conference JWT token to validate
   * @returns {boolean} True if token is still valid
   */
  validateConferenceToken(conferenceToken) {
    try {
      // Decode JWT payload without verification (just to check expiry)
      const parts = conferenceToken.split('.');
      if (parts.length !== 3) return false;
      
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      const now = Math.floor(Date.now() / 1000);
      
      return payload.exp > now;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Extract PubNub token from Conference JWT token
   * @param {string} conferenceToken - The conference JWT token
   * @returns {string|null} The embedded PubNub token or null if not found
   */
  extractPubnubToken(conferenceToken) {
    try {
      const parts = conferenceToken.split('.');
      if (parts.length !== 3) return null;
      
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      return payload.pubnubToken || null;
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Decode conference token to get all payload data
   * @param {string} conferenceToken - The conference JWT token
   * @returns {Object|null} The decoded payload or null if invalid
   */
  decodeToken(conferenceToken) {
    try {
      const parts = conferenceToken.split('.');
      if (parts.length !== 3) return null;
      
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      return {
        userId: payload.uid,
        roomId: payload.roomId,
        role: payload.role,
        pubnubToken: payload.pubnubToken,
        issuedAt: new Date(payload.iat * 1000).toISOString(),
        expiresAt: new Date(payload.exp * 1000).toISOString(),
        isValid: payload.exp > Math.floor(Date.now() / 1000)
      };
    } catch (error) {
      return null;
    }
  }
}

export default Red5Client;
