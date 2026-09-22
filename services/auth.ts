export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

type AuthResponse = {
  authenticated: boolean;
  user: AuthUser;
};

const API_BASE_URL =
  'http://192.168.100.126:4000';

export async function signInWithMicrosoft(): Promise<AuthUser> {
  const response = await fetch(
    `${API_BASE_URL}/api/auth/me`,
  );

  if (!response.ok) {
    throw new Error(
      `Authentication failed (${response.status})`,
    );
  }

  const data: AuthResponse =
    await response.json();

  if (
    !data.authenticated ||
    !data.user
  ) {
    throw new Error(
      'Authentication failed.',
    );
  }

  return data.user;
}