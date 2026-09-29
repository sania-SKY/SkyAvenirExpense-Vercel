import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export type AuthProvider =
  | 'email';

export type AuthUser = {
  id: string;

  provider:
    AuthProvider;

  providerUserId:
    string;

  name:
    string;

  email:
    string;
};

type AuthResponse = {
  authenticated:
    boolean;

  accessToken?:
    string;

  user?: {
    id?:
      string;

    provider?:
      AuthProvider;

    providerUserId?:
      string;

    name?:
      string;

    email?:
      string;
  };

  message?:
    string;
};

type MessageResponse = {
  message?:
    string;
};

type StoredSession = {
  accessToken:
    string;

  user:
    AuthUser;
};

export type RegisterInput = {
  name:
    string;

  email:
    string;

  password:
    string;
};

export type ResetPasswordInput = {
  email:
    string;

  code:
    string;

  newPassword:
    string;
};

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL;

const REQUEST_TIMEOUT_MS =
  15000;

const SESSION_STORAGE_KEY =
  'sky_avenir_expense_session_v1';

let currentUser:
  AuthUser | null =
  null;

let currentAccessToken:
  string | null =
  null;

/*
 * ------------------------------------------------
 * API CONFIG
 * ------------------------------------------------
 */

function requireApiUrl():
  string {
  const value =
    API_BASE_URL?.trim();

  if (!value) {
    throw new Error(
      'The Sky Avenir server address is missing. Please contact support.',
    );
  }

  return value.replace(
    /\/+$/,
    '',
  );
}

/*
 * ------------------------------------------------
 * FETCH WITH TIMEOUT
 * ------------------------------------------------
 */

async function fetchWithTimeout(
  url:
    string,

  options:
    RequestInit = {},
): Promise<Response> {
  const controller =
    new AbortController();

  const timeout =
    setTimeout(
      () => {
        controller.abort();
      },
      REQUEST_TIMEOUT_MS,
    );

  try {
    return await fetch(
      url,
      {
        ...options,

        signal:
          controller.signal,
      },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.name ===
        'AbortError'
    ) {
      throw new Error(
        'The server is taking too long to respond. Please try again.',
      );
    }

    throw new Error(
      'Unable to connect to the Sky Avenir server. Please check your connection and try again.',
    );
  } finally {
    clearTimeout(
      timeout,
    );
  }
}

/*
 * ------------------------------------------------
 * RESPONSE HELPERS
 * ------------------------------------------------
 */

async function readAuthResponse(
  response:
    Response,
): Promise<AuthResponse> {
  try {
    return await response.json();
  } catch {
    throw new Error(
      'The server returned an invalid authentication response.',
    );
  }
}

async function readMessageResponse(
  response:
    Response,
): Promise<MessageResponse> {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

/*
 * ------------------------------------------------
 * NORMALIZE USER
 * ------------------------------------------------
 */

function normalizeUser(
  data:
    AuthResponse,
): AuthUser {
  if (
    !data.authenticated ||
    !data.user
  ) {
    throw new Error(
      data.message ??
        'Authentication failed.',
    );
  }

  const id =
    data.user.id;

  const providerUserId =
    data.user.providerUserId;

  const name =
    data.user.name
      ?.trim();

  const email =
    data.user.email
      ?.trim()
      .toLowerCase();

  if (
    !id ||
    !providerUserId ||
    !name ||
    !email
  ) {
    throw new Error(
      'The server returned an incomplete user profile.',
    );
  }

  return {
    id,

    provider:
      'email',

    providerUserId,

    name,

    email,
  };
}

/*
 * ------------------------------------------------
 * SECURE SESSION STORAGE
 * ------------------------------------------------
 *
 * expo-secure-store has no web implementation.
 *
 * On web, fall back to localStorage. This is not
 * as secure as the native Keychain/Keystore, but
 * it is only used for the browser-based preview
 * of this app, not the shipped native builds.
 * ------------------------------------------------
 */

async function setStoredValue(
  key:
    string,

  value:
    string,
): Promise<void> {
  if (
    Platform.OS ===
    'web'
  ) {
    globalThis.localStorage?.setItem(
      key,
      value,
    );

    return;
  }

  await SecureStore.setItemAsync(
    key,
    value,
  );
}

async function getStoredValue(
  key:
    string,
): Promise<string | null> {
  if (
    Platform.OS ===
    'web'
  ) {
    return (
      globalThis.localStorage?.getItem(
        key,
      ) ??
      null
    );
  }

  return await SecureStore.getItemAsync(
    key,
  );
}

async function deleteStoredValue(
  key:
    string,
): Promise<void> {
  if (
    Platform.OS ===
    'web'
  ) {
    globalThis.localStorage?.removeItem(
      key,
    );

    return;
  }

  await SecureStore.deleteItemAsync(
    key,
  );
}

async function saveSession(
  session:
    StoredSession,
): Promise<void> {
  try {
    await setStoredValue(
      SESSION_STORAGE_KEY,
      JSON.stringify(
        session,
      ),
    );
  } catch (error) {
    console.error(
      'Unable to save secure session:',
      error,
    );

    throw new Error(
      'Unable to securely save your session.',
    );
  }
}

async function removeStoredSession():
  Promise<void> {
  try {
    await deleteStoredValue(
      SESSION_STORAGE_KEY,
    );
  } catch (error) {
    console.warn(
      'Unable to remove stored session:',
      error,
    );
  }
}

/*
 * ------------------------------------------------
 * SET SESSION
 * ------------------------------------------------
 */

async function setAuthenticatedSession(
  data:
    AuthResponse,
): Promise<AuthUser> {
  if (
    !data.accessToken
  ) {
    throw new Error(
      'The server did not create an application session.',
    );
  }

  const user =
    normalizeUser(
      data,
    );

  currentUser =
    user;

  currentAccessToken =
    data.accessToken;

  try {
    await saveSession({
      user,

      accessToken:
        data.accessToken,
    });
  } catch (error) {
    /*
     * If secure persistence fails,
     * do not leave an inconsistent
     * in-memory authenticated state.
     */

    currentUser =
      null;

    currentAccessToken =
      null;

    throw error;
  }

  return user;
}

/*
 * ------------------------------------------------
 * PUBLIC AUTH STATE
 * ------------------------------------------------
 */

export function getCurrentUser():
  AuthUser | null {
  return currentUser;
}

export function getAccessToken():
  string | null {
  return currentAccessToken;
}

export function isSignedIn():
  boolean {
  return Boolean(
    currentUser &&
      currentAccessToken,
  );
}

/*
 * Memory-only clear.
 *
 * Kept for compatibility if any existing screen
 * still imports signOutLocal().
 */

export function signOutLocal():
  void {
  currentUser =
    null;

  currentAccessToken =
    null;
}

/*
 * Real sign-out.
 *
 * Clears both:
 * - memory
 * - encrypted persistent session
 */

export async function signOut():
  Promise<void> {
  currentUser =
    null;

  currentAccessToken =
    null;

  await removeStoredSession();
}

/*
 * ------------------------------------------------
 * RESTORE SESSION
 * ------------------------------------------------
 *
 * Called when the app starts.
 *
 * 1. Read session from SecureStore.
 * 2. Restore it in memory.
 * 3. Validate token with /api/auth/me.
 *
 * Invalid/expired token:
 *   -> clear session
 *   -> return null
 *
 * Temporary network/server problem:
 *   -> retain secure local session
 *   -> avoid unnecessary logout
 * ------------------------------------------------
 */

export async function restoreSession():
  Promise<AuthUser | null> {
  let rawSession:
    string | null =
    null;

  try {
    rawSession =
      await getStoredValue(
        SESSION_STORAGE_KEY,
      );
  } catch (error) {
    console.warn(
      'Unable to read stored session:',
      error,
    );

    return null;
  }

  if (!rawSession) {
    return null;
  }

  let storedSession:
    StoredSession;

  try {
    storedSession =
      JSON.parse(
        rawSession,
      ) as StoredSession;
  } catch {
    await signOut();

    return null;
  }

  if (
    !storedSession ||
    typeof storedSession.accessToken !==
      'string' ||
    !storedSession.accessToken ||
    !storedSession.user ||
    typeof storedSession.user.id !==
      'string' ||
    typeof storedSession.user.providerUserId !==
      'string' ||
    typeof storedSession.user.name !==
      'string' ||
    typeof storedSession.user.email !==
      'string'
  ) {
    await signOut();

    return null;
  }

  currentUser = {
    id:
      storedSession.user.id,

    provider:
      'email',

    providerUserId:
      storedSession.user.providerUserId,

    name:
      storedSession.user.name
        .trim(),

    email:
      storedSession.user.email
        .trim()
        .toLowerCase(),
  };

  currentAccessToken =
    storedSession.accessToken;

  try {
    const apiBaseUrl =
      requireApiUrl();

    const response =
      await fetchWithTimeout(
        `${apiBaseUrl}/api/auth/me`,
        {
          method:
            'GET',

          headers: {
            Authorization:
              `Bearer ${storedSession.accessToken}`,
          },
        },
      );

    /*
     * Token is definitely invalid/expired.
     */

    if (
      response.status ===
        401 ||
      response.status ===
        403
    ) {
      await signOut();

      return null;
    }

    /*
     * Temporary server failure.
     *
     * Keep local secure session.
     */

    if (!response.ok) {
      return currentUser;
    }

    const data =
      await readAuthResponse(
        response,
      );

    if (
      !data.authenticated ||
      !data.user
    ) {
      await signOut();

      return null;
    }

    const verifiedUser =
      normalizeUser(
        data,
      );

    currentUser =
      verifiedUser;

    await saveSession({
      user:
        verifiedUser,

      accessToken:
        storedSession.accessToken,
    });

    return verifiedUser;
  } catch (error) {
    /*
     * No network / temporary backend problem.
     *
     * Do not crash.
     * Do not delete a potentially valid session.
     */

    console.warn(
      'Session validation unavailable:',
      error,
    );

    return currentUser;
  }
}

/*
 * ------------------------------------------------
 * EMAIL/PASSWORD LOGIN
 * ------------------------------------------------
 */

export async function signInWithWorkEmail(
  emailInput:
    string,

  passwordInput:
    string,
): Promise<AuthUser> {
  const apiBaseUrl =
    requireApiUrl();

  const email =
    emailInput
      .trim()
      .toLowerCase();

  const password =
    passwordInput;

  if (!email) {
    throw new Error(
      'Please enter your work email.',
    );
  }

  if (
    !email.includes(
      '@',
    )
  ) {
    throw new Error(
      'Please enter a valid work email.',
    );
  }

  if (!password) {
    throw new Error(
      'Please enter your password.',
    );
  }

  const response =
    await fetchWithTimeout(
      `${apiBaseUrl}/api/auth/login`,
      {
        method:
          'POST',

        headers: {
          'Content-Type':
            'application/json',
        },

        body:
          JSON.stringify({
            email,
            password,
          }),
      },
    );

  const data =
    await readAuthResponse(
      response,
    );

  if (!response.ok) {
    throw new Error(
      data.message ??
        `Unable to sign in (${response.status}).`,
    );
  }

  return await setAuthenticatedSession(
    data,
  );
}

/*
 * ------------------------------------------------
 * CREATE ACCOUNT
 * ------------------------------------------------
 */

export async function registerWithWorkEmail(
  input:
    RegisterInput,
): Promise<AuthUser> {
  const apiBaseUrl =
    requireApiUrl();

  const name =
    input.name
      .trim()
      .replace(
        /\s+/g,
        ' ',
      );

  const email =
    input.email
      .trim()
      .toLowerCase();

  const password =
    input.password;

  if (
    name.length <
    2
  ) {
    throw new Error(
      'Please enter your full name.',
    );
  }

  if (!email) {
    throw new Error(
      'Please enter your work email.',
    );
  }

  if (
    !email.includes(
      '@',
    )
  ) {
    throw new Error(
      'Please enter a valid work email.',
    );
  }

  if (
    password.length <
    8
  ) {
    throw new Error(
      'Password must contain at least 8 characters.',
    );
  }

  const response =
    await fetchWithTimeout(
      `${apiBaseUrl}/api/auth/register`,
      {
        method:
          'POST',

        headers: {
          'Content-Type':
            'application/json',
        },

        body:
          JSON.stringify({
            name,
            email,
            password,
          }),
      },
    );

  const data =
    await readAuthResponse(
      response,
    );

  if (!response.ok) {
    throw new Error(
      data.message ??
        `Unable to create account (${response.status}).`,
    );
  }

  return await setAuthenticatedSession(
    data,
  );
}

/*
 * ------------------------------------------------
 * REQUEST PASSWORD RESET
 * ------------------------------------------------
 */

export async function requestPasswordReset(
  emailInput:
    string,
): Promise<string> {
  const apiBaseUrl =
    requireApiUrl();

  const email =
    emailInput
      .trim()
      .toLowerCase();

  if (!email) {
    throw new Error(
      'Please enter your work email.',
    );
  }

  if (
    !email.includes(
      '@',
    )
  ) {
    throw new Error(
      'Please enter a valid work email.',
    );
  }

  const response =
    await fetchWithTimeout(
      `${apiBaseUrl}/api/auth/forgot-password`,
      {
        method:
          'POST',

        headers: {
          'Content-Type':
            'application/json',
        },

        body:
          JSON.stringify({
            email,
          }),
      },
    );

  const data =
    await readMessageResponse(
      response,
    );

  if (!response.ok) {
    throw new Error(
      data.message ??
        'Unable to request a password reset.',
    );
  }

  return (
    data.message ??
    'If an account exists for that email, a password reset code has been sent.'
  );
}

/*
 * ------------------------------------------------
 * RESET PASSWORD
 * ------------------------------------------------
 */

export async function resetPassword(
  input:
    ResetPasswordInput,
): Promise<string> {
  const apiBaseUrl =
    requireApiUrl();

  const email =
    input.email
      .trim()
      .toLowerCase();

  const code =
    input.code
      .trim();

  const newPassword =
    input.newPassword;

  if (!email) {
    throw new Error(
      'Work email is required.',
    );
  }

  if (
    !email.includes(
      '@',
    )
  ) {
    throw new Error(
      'Please enter a valid work email.',
    );
  }

  if (
    !/^\d{6}$/.test(
      code,
    )
  ) {
    throw new Error(
      'Please enter the 6-digit reset code.',
    );
  }

  if (
    newPassword.length <
    8
  ) {
    throw new Error(
      'Password must contain at least 8 characters.',
    );
  }

  const response =
    await fetchWithTimeout(
      `${apiBaseUrl}/api/auth/reset-password`,
      {
        method:
          'POST',

        headers: {
          'Content-Type':
            'application/json',
        },

        body:
          JSON.stringify({
            email,
            code,
            newPassword,
          }),
      },
    );

  const data =
    await readMessageResponse(
      response,
    );

  if (!response.ok) {
    throw new Error(
      data.message ??
        'Unable to reset your password.',
    );
  }

  /*
   * Important:
   *
   * If this device happened to contain an old
   * authenticated session for the same user,
   * remove it after changing the password.
   *
   * User signs in again with the new password.
   */

  await signOut();

  return (
    data.message ??
    'Password updated successfully.'
  );
}

/*
 * ------------------------------------------------
 * AUTHENTICATED API REQUEST
 * ------------------------------------------------
 */

export async function authenticatedFetch(
  path:
    string,

  options:
    RequestInit = {},
): Promise<Response> {
  const apiBaseUrl =
    requireApiUrl();

  if (
    !currentAccessToken
  ) {
    throw new Error(
      'Your session is not available. Please sign in again.',
    );
  }

  const headers =
    new Headers(
      options.headers,
    );

  headers.set(
    'Authorization',
    `Bearer ${currentAccessToken}`,
  );

  const isFormData =
    typeof FormData !==
      'undefined' &&
    options.body instanceof
      FormData;

  if (
    options.body &&
    !isFormData &&
    !headers.has(
      'Content-Type',
    )
  ) {
    headers.set(
      'Content-Type',
      'application/json',
    );
  }

  const response =
    await fetchWithTimeout(
      `${apiBaseUrl}${path}`,
      {
        ...options,

        headers,
      },
    );

  /*
   * Any authenticated request proving that the
   * JWT is no longer valid clears the secure
   * session.
   */

  if (
    response.status ===
      401
  ) {
    await signOut();
  }

  return response;
}