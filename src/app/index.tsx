import {
  Redirect,
} from 'expo-router';

import {
  useAuth,
} from '../context/AuthContext';

/*
 * ------------------------------------------------
 * ENTRY ROUTE
 * ------------------------------------------------
 *
 * Session restore and the splash now happen once in
 * the root layout, so this route only has to send
 * the user to the right place.
 * ------------------------------------------------
 */
export default function StartupScreen() {
  const {
    status,
  } = useAuth();

  if (
    status ===
    'authenticated'
  ) {
    return (
      <Redirect
        href="/(tabs)/home"
      />
    );
  }

  return (
    <Redirect
      href="/(auth)/login"
    />
  );
}
