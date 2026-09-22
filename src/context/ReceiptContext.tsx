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
};

type ReceiptContextValue = {
  receipt: ReceiptState | null;

  setReceipt: (
    receipt: ReceiptState,
  ) => void;

  updateReceiptUri: (
    uri: string,
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
    nextReceipt: ReceiptState,
  ) {
    setReceiptState(nextReceipt);
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