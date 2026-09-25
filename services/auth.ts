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
    id?: string;

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

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL;

const REQUEST_TIMEOUT_MS =
  15000;

let currentUser:
  AuthUser | null =
  null;

let currentAccessToken:
  string | null =
  null;

/*
 * ------------------------------------------------
 * CONFIG
 * ------------------------------------------------
 */

function requireApiUrl() {
  const value =
    API_BASE_URL?.trim();

  if (!value) {
    throw new Error(
      'The Sky Avenir server is not configured.',
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
) {
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

    throw error;
  } finally {
    clearTimeout(
      timeout,
    );
  }
}

/*
 * ------------------------------------------------
 * NORMALIZE AUTH USER
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
    data.user
      .providerUserId;

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
 * PUBLIC AUTH STATE
 * ------------------------------------------------
 */

export function getCurrentUser() {
  return currentUser;
}

export function getAccessToken() {
  return currentAccessToken;
}

export function isSignedIn() {
  return Boolean(
    currentUser &&
      currentAccessToken,
  );
}

export function signOutLocal() {
  currentUser =
    null;

  currentAccessToken =
    null;
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
    !email.endsWith(
      '@skyavenir.com',
    )
  ) {
    throw new Error(
      'Please use your Sky Avenir work email.',
    );
  }

  if (!password) {
    throw new Error(
      'Please enter your password.',
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

  let data:
    AuthResponse;

  try {
    data =
      await response.json();
  } catch {
    throw new Error(
      'The server returned an invalid authentication response.',
    );
  }

  if (!response.ok) {
    throw new Error(
      data.message ??
        `Unable to sign in (${response.status}).`,
    );
  }

  if (!data.accessToken) {
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

  return user;
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
) {
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

  return fetchWithTimeout(
    `${apiBaseUrl}${path}`,
    {
      ...options,
      headers,
    },
  );
}