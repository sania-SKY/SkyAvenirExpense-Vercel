import {
  Alert,
  Platform,
} from 'react-native';

/*
 * ------------------------------------------------
 * CROSS-PLATFORM CONFIRM
 * ------------------------------------------------
 *
 * react-native-web ships Alert as a no-op stub, so
 * Alert.alert() silently does nothing in a browser.
 * Use the native dialog on iOS/Android and the
 * browser's own confirm() on web.
 * ------------------------------------------------
 */
export function confirmAction({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
}: {
  title:
    string;

  message:
    string;

  confirmLabel?:
    string;

  cancelLabel?:
    string;

  destructive?:
    boolean;

  onConfirm:
    () => void;
}): void {
  if (
    Platform.OS ===
    'web'
  ) {
    const accepted =
      globalThis.confirm?.(
        `${title}\n\n${message}`,
      ) ??
      true;

    if (accepted) {
      onConfirm();
    }

    return;
  }

  Alert.alert(
    title,
    message,
    [
      {
        text:
          cancelLabel,

        style:
          'cancel',
      },

      {
        text:
          confirmLabel,

        style:
          destructive
            ? 'destructive'
            : 'default',

        onPress:
          onConfirm,
      },
    ],
  );
}
