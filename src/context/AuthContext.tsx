import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import type {
  PropsWithChildren,
} from 'react';

import {
  restoreSession,
  signOut,
} from '../../services/auth';

import type {
  AuthUser,
} from '../../services/auth';

/*
 * ------------------------------------------------
 * AUTH STATUS
 * ------------------------------------------------
 *
 * 'restoring' is the important one: while the app
 * is in this state no route may mount, because the
 * access token lives in memory inside
 * services/auth.ts and any screen calling
 * authenticatedFetch() before the stored session is
 * rehydrated would throw "Your session is not
 * available".
 * ------------------------------------------------
 */
export type AuthStatus =
  | 'restoring'
  | 'authenticated'
  | 'unauthenticated';

type AuthContextValue = {
  user:
    AuthUser | null;

  status:
    AuthStatus;

  markAuthenticated: (
    user: AuthUser,
  ) => void;

  signOutUser:
    () => Promise<void>;
};

const AuthContext =
  createContext<
    AuthContextValue | undefined
  >(undefined);

/*
 * Keeps the brand splash on screen for a moment so
 * a fast restore does not flash past the user.
 */
const MIN_SPLASH_TIME_MS =
  1200;

export function AuthProvider({
  children,
}: PropsWithChildren) {
  const [user, setUser] =
    useState<AuthUser | null>(
      null,
    );

  const [status, setStatus] =
    useState<AuthStatus>(
      'restoring',
    );

  /*
   * ------------------------------------------------
   * RESTORE ON EVERY LAUNCH
   * ------------------------------------------------
   *
   * This runs from the root layout, so it happens no
   * matter which URL the app was opened at. That is
   * what makes a deep entry point (an iOS "Add to
   * Home Screen" icon saved on /home, a shared link,
   * a browser refresh) behave the same as a cold
   * start from the splash route.
   * ------------------------------------------------
   */
  useEffect(() => {
    let active =
      true;

    async function restore() {
      const startedAt =
        Date.now();

      let restoredUser:
        AuthUser | null =
        null;

      try {
        restoredUser =
          await restoreSession();
      } catch (error) {
        console.error(
          'Startup session restore failed:',
          error,
        );

        restoredUser =
          null;
      }

      const remaining =
        MIN_SPLASH_TIME_MS -
        (Date.now() -
          startedAt);

      if (
        remaining >
        0
      ) {
        await new Promise<void>(
          (resolve) => {
            setTimeout(
              resolve,
              remaining,
            );
          },
        );
      }

      if (!active) {
        return;
      }

      setUser(
        restoredUser,
      );

      setStatus(
        restoredUser
          ? 'authenticated'
          : 'unauthenticated',
      );
    }

    void restore();

    return () => {
      active =
        false;
    };
  }, []);

  const markAuthenticated =
    useCallback(
      (
        nextUser: AuthUser,
      ) => {
        setUser(
          nextUser,
        );

        setStatus(
          'authenticated',
        );
      },
      [],
    );

  const signOutUser =
    useCallback(
      async () => {
        try {
          await signOut();
        } catch (error) {
          console.error(
            'Sign out failed:',
            error,
          );
        } finally {
          /*
           * Always drop to the login screen, even if
           * clearing stored state threw. Leaving the
           * user "signed in" after they asked to
           * sign out is the worse outcome.
           */
          setUser(null);

          setStatus(
            'unauthenticated',
          );
        }
      },
      [],
    );

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        markAuthenticated,
        signOutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider',
    );
  }

  return context;
}
