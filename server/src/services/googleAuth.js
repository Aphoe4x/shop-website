import { OAuth2Client } from 'google-auth-library';
import { config } from '../config/index.js';

const client = new OAuth2Client(
  config.google.clientId,
  config.google.clientSecret,
  config.google.redirectUri
);

/**
 * Generate Google OAuth2 consent screen URL
 */
export function getGoogleAuthUrl() {
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
  ];

  return client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });
}

/**
 * Exchange authorization code for tokens and get user info
 * @param {string} code - Authorization code from Google
 */
export async function getGoogleUserInfo(code) {
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: config.google.clientId,
  });

  const payload = ticket.getPayload();
  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
    emailVerified: payload.email_verified,
  };
}
