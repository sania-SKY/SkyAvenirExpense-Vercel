import { ScrollViewStyleReset } from 'expo-router/html';

import type { PropsWithChildren } from 'react';

/*
 * ------------------------------------------------
 * ROOT HTML (WEB ONLY)
 * ------------------------------------------------
 *
 * Runs at static-export time in Node. Used to attach
 * the PWA manifest so "Add to Home Screen" opens at
 * "/" and restores the session from the root layout.
 * ------------------------------------------------
 */
export default function Root({
  children,
}: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />

        <meta
          httpEquiv="X-UA-Compatible"
          content="IE=edge"
        />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />

        <meta
          name="theme-color"
          content="#062B4A"
        />

        <meta
          name="apple-mobile-web-app-capable"
          content="yes"
        />

        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />

        <meta
          name="apple-mobile-web-app-title"
          content="Sky Avenir"
        />

        <link
          rel="manifest"
          href="/manifest.json"
        />

        <link
          rel="apple-touch-icon"
          href="/icon-192.png"
        />

        <ScrollViewStyleReset />
      </head>

      <body>
        {children}
      </body>
    </html>
  );
}
