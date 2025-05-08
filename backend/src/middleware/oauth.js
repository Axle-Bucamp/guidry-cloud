/**
 * OAuth authentication middleware for Proxmox PaaS
 */
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2').Strategy;
const jwt = require('jsonwebtoken');
const db = require("../../config/database");

// Configure OAuth2 strategy
passport.use(new OAuth2Strategy({
    authorizationURL: process.env.OAUTH_AUTHORIZATION_URL,
    tokenURL: process.env.OAUTH_TOKEN_URL,
    clientID: process.env.OAUTH_CLIENT_ID,
    clientSecret: process.env.OAUTH_CLIENT_SECRET,
    callbackURL: process.env.OAUTH_CALLBACK_URL,
    scope: ['profile', 'email']
  },
  async function(accessToken, refreshToken, profile, done) {
    try {
      // Get user profile from OAuth provider
      const userProfile = await getUserProfile(accessToken);
      
      // Check if user exists in database
      const userResult = await db.query(
        'SELECT * FROM users WHERE oauth_id = $1 AND oauth_provider = $2',
        [userProfile.id, 'oauth2']
      );
      
      let user;
      
      if (userResult.rows.length === 0) {
        // User doesn't exist, create new user
        const newUserResult = await db.query(
          'INSERT INTO users (email, name, oauth_provider, oauth_id, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [userProfile.email, userProfile.name, 'oauth2', userProfile.id, 'user']
        );
        user = newUserResult.rows[0];
      } else {
        // User exists, update profile
        user = userResult.rows[0];
        await db.query(
          'UPDATE users SET email = $1, name = $2, updated_at = NOW() WHERE id = $3',
          [userProfile.email, userProfile.name, user.id]
        );
      }
      
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

// JWT strategy for API authentication
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
};

passport.use(new JwtStrategy(jwtOptions, async (payload, done) => {
  try {
    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [payload.id]);
    
    if (userResult.rows.length === 0) {
      return done(null, false);
    }
    
    const user = userResult.rows[0];
    return done(null, user);
  } catch (error) {
    return done(error, false);
  }
}));

// Helper function to get user profile from OAuth provider
async function getUserProfile(accessToken) {
  // This is a placeholder. In a real implementation, you would make an API call
  // to the OAuth provider's user info endpoint using the access token.
  // For example, with axios:
  // const response = await axios.get(process.env.OAUTH_USER_INFO_URL, {
  //   headers: { Authorization: `Bearer ${accessToken}` }
  // });
  // return response.data;
  
  // For now, return a mock profile
  return {
    id: 'oauth-user-id',
    email: 'user@example.com',
    name: 'Example User'
  };
}

module.exports = passport;
