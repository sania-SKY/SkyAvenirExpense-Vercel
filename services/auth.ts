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

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
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
 * API CONFIG
 * ------------------------------------------------
 */

function requireApiUrl(): string {
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
 * READ AUTH RESPONSE
 * ------------------------------------------------
 */

async function readAuthResponse(
  response: Response,
): Promise<AuthResponse> {
  try {
    return await response.json();
  } catch {
    throw new Error(
      'The server returned an invalid authentication response.',
    );
  }
}

/*
 * ------------------------------------------------
 * NORMALIZE USER
 * ------------------------------------------------
 */

function normalizeUser(
  data: AuthResponse,
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
 * SAVE AUTH SESSION
 * ------------------------------------------------
 */

function setAuthenticatedSession(
  data: AuthResponse,
): AuthUser {
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

export function signOutLocal():
  void {
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
  emailInput: string,
  passwordInput: string,
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
    !email.includes('@')
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

  return setAuthenticatedSession(
    data,
  );
}

/*
 * ------------------------------------------------
 * CREATE ACCOUNT
 * ------------------------------------------------
 */

export async function registerWithWorkEmail(
  input: RegisterInput,
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
    name.length < 2
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
    !email.includes('@')
  ) {
    throw new Error(
      'Please enter a valid work email.',
    );
  }

  if (
    password.length < 8
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

  return setAuthenticatedSession(
    data,
  );
}

/*
 * ------------------------------------------------
 * AUTHENTICATED API REQUEST
 * ------------------------------------------------
 */

export async function authenticatedFetch(
  path: string,
  options: RequestInit = {},
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

  return fetchWithTimeout(
    `${apiBaseUrl}${path}`,
    {
      ...options,
      headers,
    },
  );
}