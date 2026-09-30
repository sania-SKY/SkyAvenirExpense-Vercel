import {
  createContext,
  useContext,
  useState,
} from 'react';

import type {
  PropsWithChildren,
} from 'react';

export type ReceiptSource =
  | 'camera'
  | 'gallery';

export type ReceiptState = {
  uri: string;
  source: ReceiptSource;
  isBlurry: boolean;
};

type ReceiptContextValue = {
  receipt: ReceiptState | null;

  setReceipt: (
    receipt: Omit<ReceiptState, 'isBlurry'> & {
      isBlurry?: boolean;
    },
  ) => void;

  updateReceiptUri: (
    uri: string,
  ) => void;

  setReceiptBlurry: (
    isBlurry: boolean,
  ) => void;

  clearReceipt: () => void;
};

const ReceiptContext =
  createContext<
    ReceiptContextValue | undefined
  >(undefined);

export function ReceiptProvider({
  children,
}: PropsWithChildren) {
  const [receipt, setReceiptState] =
    useState<ReceiptState | null>(
      null,
    );

  function setReceipt(
    nextReceipt: Omit<ReceiptState, 'isBlurry'> & {
      isBlurry?: boolean;
    },
  ) {
    setReceiptState({
      uri:
        nextReceipt.uri,

      source:
        nextReceipt.source,

      isBlurry:
        nextReceipt.isBlurry ??
        false,
    });
  }

  function updateReceiptUri(
    uri: string,
  ) {
    setReceiptState(
      (currentReceipt) => {
        if (!currentReceipt) {
          return null;
        }

        return {
          ...currentReceipt,
          uri,
          /*
           * Crop / rotate may change sharpness,
           * so clear the previous result until
           * preview re-checks the new image.
           */
          isBlurry:
            false,
        };
      },
    );
  }

  function setReceiptBlurry(
    isBlurry: boolean,
  ) {
    setReceiptState(
      (currentReceipt) => {
        if (!currentReceipt) {
          return null;
        }

        return {
          ...currentReceipt,
          isBlurry,
        };
      },
    );
  }

  function clearReceipt() {
    setReceiptState(null);
  }

  return (
    <ReceiptContext.Provider
      value={{
        receipt,
        setReceipt,
        updateReceiptUri,
        setReceiptBlurry,
        clearReceipt,
      }}
    >
      {children}
    </ReceiptContext.Provider>
  );
}

export function useReceipt() {
  const context =
    useContext(ReceiptContext);

  if (!context) {
    throw new Error(
      'useReceipt must be used inside ReceiptProvider',
    );
  }

  return context;
}
