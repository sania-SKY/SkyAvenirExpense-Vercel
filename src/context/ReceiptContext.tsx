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

export type AttendeeType =
  | 'WAVETRONIX_EMPLOYEE'
  | 'NON_WAVETRONIX';

/*
 * Set when an employee retakes a receipt that was
 * flagged for review. It carries the details they
 * already filled in so the submit screen can
 * restore them and update the same expense
 * instead of creating a new one.
 */
export type RetakeTarget = {
  expenseId: string;

  category: string;

  businessPurpose: string;

  comments: string;

  attendees: {
    name: string;
    attendeeType: AttendeeType;
  }[];
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

  retakeTarget: RetakeTarget | null;

  startRetake: (
    target: RetakeTarget,
  ) => void;

  beginNewExpense: () => void;
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

  const [retakeTarget, setRetakeTarget] =
    useState<RetakeTarget | null>(
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

  function startRetake(
    target: RetakeTarget,
  ) {
    setReceiptState(null);
    setRetakeTarget(target);
  }

  /*
   * Capturing a brand new expense must never
   * inherit a pending retake.
   */
  function beginNewExpense() {
    setReceiptState(null);
    setRetakeTarget(null);
  }

  return (
    <ReceiptContext.Provider
      value={{
        receipt,
        setReceipt,
        updateReceiptUri,
        setReceiptBlurry,
        clearReceipt,
        retakeTarget,
        startRetake,
        beginNewExpense,
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
