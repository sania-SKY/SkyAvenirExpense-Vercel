import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';

export type AuthProvider =
  | 'microsoft'
  | 'google'
  | 'email';

export type AuthUser = {
  id: string;
  provider: AuthProvider;
  providerUserId: string;
  name: string;
  email: string;
};

type AuthResponse = {
  authenticated: boolean;
  accessToken?: string;
  user?: Partial<AuthUser>;
  message?: string;
};

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL;

const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

const GOOGLE_IOS_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

const REQUEST_TIMEOUT_MS = 7000;

let currentUser: AuthUser | null =
  null;

let currentAccessToken: string | null =
  null;

/*
 * ------------------------------------------------
 * GOOGLE NATIVE CONFIGURATION
 * ------------------------------------------------
 *
 * webClientId must be the Google WEB OAuth client.
 * iosClientId must be the Google iOS OAuth client.
 */

GoogleSignin.configure({
  webClientId:
    GOOGLE_WEB_CLIENT_ID,

  iosClientId:
    GOOGLE_IOS_CLIENT_ID,

  offlineAccess:
    false,
});

/*
 * ------------------------------------------------
 * FETCH WITH TIMEOUT
 * ------------------------------------------------
 */

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
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
      error.name === 'AbortError'
    ) {
      throw new Error(
        'The server is taking too long to respond.',
      );
    }

    throw error;
  } finally {
    clearTimeout(
      timeout,
    );
  }
}

/*
 * ------------------------------------------------
 * NORMALIZE BACKEND USER
 * ------------------------------------------------
 */

function normalizeUser(
  data: AuthResponse,
  fallbackProvider:
    AuthProvider,
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
    data.user.name?.trim();

  const email =
    data.user.email
      ?.trim()
      .toLowerCase();

  const provider =
    data.user.provider ??
    fallbackProvider;

  if (
    !id ||
    !providerUserId ||
    !name ||
    !email
  ) {
    throw new Error(
      'Authentication returned an incomplete user profile.',
    );
  }

  return {
    id,
    provider,
    providerUserId,
    name,
    email,
  };
}

/*
 * ------------------------------------------------
 * CURRENT AUTHENTICATED USER
 * ------------------------------------------------
 */

export function getCurrentUser():
  AuthUser | null {
  return currentUser;
}

/*
 * ------------------------------------------------
 * CURRENT APPLICATION SESSION TOKEN
 * ------------------------------------------------
 */

export function getAccessToken():
  string | null {
  return currentAccessToken;
}

/*
 * ------------------------------------------------
 * CLEAR LOCAL APP SESSION
 * ------------------------------------------------
 */

export function signOutLocal():
  void {
  currentUser =
    null;

  currentAccessToken =
    null;
}

/*
 * ------------------------------------------------
 * AUTHENTICATED BACKEND REQUEST
 * ------------------------------------------------
 */

export async function authenticatedFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  if (!API_BASE_URL) {
    throw new Error(
      'API URL is not configured.',
    );
  }

  if (!currentAccessToken) {
    throw new Error(
      'You are not signed in.',
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

  /*
   * Only automatically set JSON Content-Type
   * when a request has a body and the caller
   * has not already supplied Content-Type.
   *
   * Later multipart receipt upload can supply
   * its own content type.
   */
  if (
    options.body &&
    !headers.has(
      'Content-Type',
    )
  ) {
    headers.set(
      'Content-Type',
      'application/json',
    );
  }

  return fetchWithTimeout(
    `${API_BASE_URL}${path}`,
    {
      ...options,
      headers,
    },
  );
}

/*
 * ------------------------------------------------
 * GOOGLE SIGN-IN
 * ------------------------------------------------
 *
 * Native Google account chooser
 *        ↓
 * Google ID token
 *        ↓
 * POST /api/auth/google
 *        ↓
 * Backend verifies Google token
 *        ↓
 * Backend returns internal DB user + app session
 * ------------------------------------------------
 */

export async function signInWithGoogle():
  Promise<AuthUser> {
  if (!API_BASE_URL) {
    throw new Error(
      'API URL is not configured.',
    );
  }

  if (!GOOGLE_WEB_CLIENT_ID) {
    throw new Error(
      'Google authentication is not configured.',
    );
  }

  try {
    console.log(
      '[Google Auth] Opening native Google account chooser...',
    );

    await GoogleSignin
      .hasPlayServices({
        showPlayServicesUpdateDialog:
          true,
      });

    const result =
      await GoogleSignin.signIn();

    if (
      !isSuccessResponse(
        result,
      )
    ) {
      throw new Error(
        'GOOGLE_SIGN_IN_CANCELLED',
      );
    }

    console.log(
      '[Google Auth] Native sign-in result type: success',
    );

    const idToken =
      result.data.idToken;

    if (!idToken) {
      throw new Error(
        'Google did not return an ID token.',
      );
    }

    console.log(
      '[Google Auth] Google returned an ID token.',
    );

    console.log(
      '[Google Auth] Sending token to Sky Avenir backend...',
    );

    const response =
      await fetchWithTimeout(
        `${API_BASE_URL}/api/auth/google`,
        {
          method:
            'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body:
            JSON.stringify({
              idToken,
            }),
        },
      );

    /*
     * FIXED:
     *
     * Do not write:
     *
     * await response.json()
     *   as AuthResponse
     *
     * Use the generic json<T>() form instead.
     */

    const data: AuthResponse =
  await response.json();

    if (!response.ok) {
      console.error(
        '[Google Auth] Backend rejected Google authentication:',
        response.status,
        data.message,
      );

      throw new Error(
        data.message ??
          `Google authentication failed (${response.status}).`,
      );
    }

    if (!data.accessToken) {
      throw new Error(
        'The backend did not return an application session.',
      );
    }

    const user =
      normalizeUser(
        data,
        'google',
      );

    /*
     * Save actual authenticated employee
     * and application session in memory.
     */

    currentUser =
      user;

    currentAccessToken =
      data.accessToken;

    console.log(
      '[Google Auth] Sky Avenir authentication successful.',
    );

    return user;
  } catch (error) {
    /*
     * Genuine cancellation stays silent in
     * the login screen.
     */

    if (
      error instanceof Error &&
      error.message ===
        'GOOGLE_SIGN_IN_CANCELLED'
    ) {
      throw error;
    }

    /*
     * Preserve useful native Google errors
     * instead of treating every error as
     * cancellation.
     */

    if (
      isErrorWithCode(
        error,
      )
    ) {
      switch (
        error.code
      ) {
        case statusCodes.IN_PROGRESS:
          throw new Error(
            'A Google sign-in request is already in progress.',
          );

        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          throw new Error(
            'Google Play Services are unavailable or need to be updated.',
          );

        default:
          throw new Error(
            `Google native sign-in failed [${error.code}]: ${error.message}`,
          );
      }
    }

    throw error;
  }
}

/*
 * ------------------------------------------------
 * MICROSOFT
 * ------------------------------------------------
 *
 * TEMPORARY:
 * Real Microsoft Entra authentication has not
 * been implemented yet.
 * ------------------------------------------------
 */

export async function signInWithMicrosoft():
  Promise<AuthUser> {
  throw new Error(
    'Microsoft authentication is not configured yet.',
  );
}

/*
 * ------------------------------------------------
 * WORK EMAIL
 * ------------------------------------------------
 *
 * TEMPORARY:
 * Production authentication must later use
 * backend verification + OTP/magic link.
 * ------------------------------------------------
 */

export async function signInWithWorkEmail(
  _email: string,
): Promise<AuthUser> {
  throw new Error(
    'Work email authentication is not configured yet.',
  );
}