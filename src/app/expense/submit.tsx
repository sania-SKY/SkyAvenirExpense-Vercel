import {
  useState,
} from 'react';

import {
  Ionicons,
} from '@expo/vector-icons';

import {
  router,
} from 'expo-router';

import {
  File,
} from 'expo-file-system';

import {
  fetch as expoFetch,
} from 'expo/fetch';

import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  useReceipt,
} from '../../context/ReceiptContext';

import {
  businessPurposes,
} from '../../../data/businessPurposes';

import {
  categories,
} from '../../../data/categories';

import {
  authenticatedFetch,
  getAccessToken,
} from '../../../services/auth';

type SelectorType =
  | 'category'
  | 'purpose'
  | null;

type ExpenseResponse = {
  expense?: {
    id: string;
    user_id: string;
    category: string;
    business_purpose: string;
    comments: string | null;
    receipt_storage_key: string | null;
    status: string;

    external_reference?:
      string | null;

    external_status?:
      string | null;

    external_error?:
      string | null;

    last_sync_at?:
      string | null;

    submitted_at: string;
    created_at: string;
    updated_at: string;

    attendees?: string[];
  };

  message?: string;

  errors?: unknown;
};

type UploadResponse = {
  storageKey?: string;

  originalName?: string;

  mimeType?: string;

  size?: number;

  message?: string;
};

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL;

export default function SubmitExpenseScreen() {
  const {
    receipt,
    clearReceipt,
  } = useReceipt();

  const [
    category,
    setCategory,
  ] = useState('');

  const [
    businessPurpose,
    setBusinessPurpose,
  ] = useState('');

  const [
    comments,
    setComments,
  ] = useState('');

 type AttendeeType =
  | 'WAVETRONIX_EMPLOYEE'
  | 'NON_WAVETRONIX';

type AttendeeInput = {
  name: string;
  attendeeType: AttendeeType;
};

const [
  attendeeTab,
  setAttendeeTab,
] =
  useState<AttendeeType>(
    'WAVETRONIX_EMPLOYEE',
  );

const [
  wavetronixAttendees,
  setWavetronixAttendees,
] =
  useState<string[]>(
    [''],
  );

const [
  nonWavetronixAttendees,
  setNonWavetronixAttendees,
] =
  useState<string[]>(
    [''],
  );

  const [
    selectorType,
    setSelectorType,
  ] = useState<SelectorType>(
    null,
  );

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const requiresAttendees =
    category ===
    'Travel - Meals and Entertainment with Attendees';

  const selectorOptions =
    selectorType ===
    'category'
      ? categories
      : businessPurposes;

  function selectOption(
    value: string,
  ) {
    if (
      selectorType ===
      'category'
    ) {
      setCategory(
        value,
      );
    }

    if (
      selectorType ===
      'purpose'
    ) {
      setBusinessPurpose(
        value,
      );
    }

    setSelectorType(
      null,
    );
  }

  function updateAttendee(
  type:
    AttendeeType,

  index:
    number,

  value:
    string,
) {
  const setter =
    type ===
    'WAVETRONIX_EMPLOYEE'
      ? setWavetronixAttendees
      : setNonWavetronixAttendees;

  setter(
    (current) =>
      current.map(
        (
          attendee,
          attendeeIndex,
        ) =>
          attendeeIndex ===
          index
            ? value
            : attendee,
      ),
  );
}

function addAttendee(
  type:
    AttendeeType,
) {
  const setter =
    type ===
    'WAVETRONIX_EMPLOYEE'
      ? setWavetronixAttendees
      : setNonWavetronixAttendees;

  setter(
    (current) => [
      ...current,
      '',
    ],
  );
}

function removeAttendee(
  type:
    AttendeeType,

  index:
    number,
) {
  const setter =
    type ===
    'WAVETRONIX_EMPLOYEE'
      ? setWavetronixAttendees
      : setNonWavetronixAttendees;

  setter(
    (current) => {
      const next =
        current.filter(
          (
            _,
            attendeeIndex,
          ) =>
            attendeeIndex !==
            index,
        );

      return next.length
        ? next
        : [''];
    },
  );
}

  function validateExpense() {
    if (!category) {
      Alert.alert(
        'Category required',
        'Please select an expense category.',
      );

      return false;
    }

    if (!businessPurpose) {
      Alert.alert(
        'Business purpose required',
        'Please select a business purpose.',
      );

      return false;
    }
if (
  requiresAttendees
) {
  const validWavetronix =
    wavetronixAttendees.filter(
      (name) =>
        name.trim().length >
        0,
    );

  const validNonWavetronix =
    nonWavetronixAttendees.filter(
      (name) =>
        name.trim().length >
        0,
    );

  if (
    validWavetronix.length +
      validNonWavetronix.length ===
    0
  ) {
    Alert.alert(
      'Attendee required',
      'Please add at least one attendee.',
    );

    return false;
  }
}

    return true;
  }

  /*
   * ------------------------------------------------
   * SUBMIT EXPENSE
   * ------------------------------------------------
   *
   * STEP 1:
   * Upload actual receipt file.
   *
   * STEP 2:
   * Backend returns receipt storage key.
   *
   * STEP 3:
   * Create expense record in PostgreSQL.
   *
   * STEP 4:
   * Backend queues integration job.
   *
   * STEP 5:
   * Show Success only after backend confirms.
   * ------------------------------------------------
   */

  async function submitExpense() {
    if (
      isSubmitting
    ) {
      return;
    }

    if (
      !validateExpense()
    ) {
      return;
    }

    if (!receipt) {
      Alert.alert(
        'Receipt missing',
        'Please capture or select a receipt.',
      );

      return;
    }

    if (!API_BASE_URL) {
      Alert.alert(
        'Configuration Error',
        'The API URL is not configured.',
      );

      return;
    }

    const accessToken =
      getAccessToken();

    if (!accessToken) {
      Alert.alert(
        'Sign In Required',
        'Your session is unavailable. Please sign in again.',
      );

      return;
    }

    try {
      setIsSubmitting(
        true,
      );

      /*
       * ------------------------------------------------
       * STEP 1
       * PREPARE ACTUAL RECEIPT FILE
       * ------------------------------------------------
       *
       * Native (iOS/Android):
       *   Expo SDK's File implementation, uploaded
       *   with expo/fetch for multipart FormData.
       *
       * Web:
       *   receipt.uri is a blob:/data: URI, not a
       *   device file path. expo-file-system's File
       *   and expo/fetch do not support that on web,
       *   so the blob is fetched directly and posted
       *   with the browser's native fetch/FormData.
       */

      const formData =
        new FormData();

      if (
        Platform.OS ===
        'web'
      ) {
        const receiptBlob =
          await (
            await fetch(
              receipt.uri,
            )
          ).blob();

        formData.append(
          'receipt',
          receiptBlob,
          'receipt.jpg',
        );
      } else {
        const receiptFile =
          new File(
            receipt.uri,
          );

        if (
          !receiptFile.exists
        ) {
          throw new Error(
            'The receipt file could not be found on this device.',
          );
        }

        formData.append(
          'receipt',
          receiptFile,
        );
      }

      /*
       * ------------------------------------------------
       * STEP 2
       * UPLOAD RECEIPT
       * ------------------------------------------------
       *
       * IMPORTANT:
       * Do NOT manually set Content-Type.
       * fetch/expo-fetch create the multipart
       * boundary automatically for FormData bodies.
       */

      console.log(
        '[Expense] Uploading receipt...',
      );

      const uploadFetch =
        Platform.OS ===
        'web'
          ? fetch
          : expoFetch;

      const uploadResponse =
        await uploadFetch(
          `${API_BASE_URL}/api/expenses/upload`,
          {
            method:
              'POST',

            headers: {
              Authorization:
                `Bearer ${accessToken}`,
            },

            body:
              formData,
          },
        );

      let uploadData:
        UploadResponse;

      try {
        uploadData =
          await uploadResponse.json();
      } catch {
        throw new Error(
          'The receipt upload server returned an invalid response.',
        );
      }

      if (
        !uploadResponse.ok
      ) {
        console.error(
          'Receipt upload failed:',
          {
            status:
              uploadResponse.status,

            message:
              uploadData.message,
          },
        );

        throw new Error(
          uploadData.message ??
            `Receipt upload failed (${uploadResponse.status}).`,
        );
      }

      const receiptStorageKey =
        uploadData.storageKey;

      if (
        !receiptStorageKey
      ) {
        throw new Error(
          'The server did not return a receipt storage key.',
        );
      }

      console.log(
        '[Expense] Receipt uploaded:',
        receiptStorageKey,
      );

      /*
       * ------------------------------------------------
       * STEP 3
       * CLEAN ATTENDEES
       * ------------------------------------------------
       */

    const cleanedAttendees:
  AttendeeInput[] =
  requiresAttendees
    ? [
        ...wavetronixAttendees
          .map(
            (name) =>
              name.trim(),
          )
          .filter(Boolean)
          .map(
            (name) => ({
              name,

              attendeeType:
                'WAVETRONIX_EMPLOYEE' as const,
            }),
          ),

        ...nonWavetronixAttendees
          .map(
            (name) =>
              name.trim(),
          )
          .filter(Boolean)
          .map(
            (name) => ({
              name,

              attendeeType:
                'NON_WAVETRONIX' as const,
            }),
          ),
      ]
    : [];

      /*
       * ------------------------------------------------
       * STEP 4
       * CREATE DATABASE EXPENSE
       * ------------------------------------------------
       */

      console.log(
        '[Expense] Creating database record...',
      );

      const response =
        await authenticatedFetch(
          '/api/expenses',
          {
            method:
              'POST',

            body:
              JSON.stringify({
                category,

                businessPurpose,

                comments:
                  comments
                    .trim() ||
                  null,

                receiptStorageKey,

                attendees:
                  cleanedAttendees,
              }),
          },
        );

      let data:
        ExpenseResponse;

      try {
        data =
          await response.json();
      } catch {
        throw new Error(
          'The server returned an invalid expense response.',
        );
      }

      if (
        !response.ok
      ) {
        console.error(
          'Expense backend error:',
          {
            status:
              response.status,

            message:
              data.message,

            errors:
              data.errors,
          },
        );

        throw new Error(
          data.message ??
            `Unable to create expense (${response.status}).`,
        );
      }

      if (
        !data.expense?.id
      ) {
        throw new Error(
          'The backend did not confirm the expense.',
        );
      }

      console.log(
        '[Expense] Successfully stored:',
        {
          id:
            data.expense.id,

          status:
            data.expense.status,

          category:
            data.expense.category,

          receiptStorageKey:
            data.expense
              .receipt_storage_key,
        },
      );

      /*
       * ------------------------------------------------
       * STEP 5
       * CLEAR LOCAL RECEIPT ONLY AFTER SUCCESS
       * ------------------------------------------------
       */

      clearReceipt();

      /*
       * ------------------------------------------------
       * STEP 6
       * SUCCESS SCREEN
       * ------------------------------------------------
       */

      router.replace(
        '/expense/success',
      );
    } catch (error) {
      console.error(
        'Submit expense error:',
        error,
      );

      Alert.alert(
        'Unable to submit expense',

        error instanceof Error
          ? error.message
          : 'Please try again.',
      );
    } finally {
      setIsSubmitting(
        false,
      );
    }
  }

  /*
   * ------------------------------------------------
   * NO RECEIPT
   * ------------------------------------------------
   */

  if (!receipt) {
    return (
      <View
        style={
          styles.emptyScreen
        }
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#F4F8FB"
        />

        <View
          style={
            styles.emptyIcon
          }
        >
          <Ionicons
            name="receipt-outline"
            size={34}
            color="#0A67A7"
          />
        </View>

        <Text
          style={
            styles.emptyTitle
          }
        >
          Receipt unavailable
        </Text>

        <Text
          style={
            styles.emptySubtitle
          }
        >
          Capture or upload a
          receipt to continue.
        </Text>

        <Pressable
          style={
            styles.captureAgainButton
          }
          onPress={() =>
            router.replace(
              '/expense/capture',
            )
          }
        >
          <Text
            style={
              styles.captureAgainText
            }
          >
            Capture Receipt
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={
        styles.container
      }
      behavior={
        Platform.OS ===
        'ios'
          ? 'padding'
          : undefined
      }
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />

      {/* HEADER */}

      <View
        style={
          styles.header
        }
      >
        <Pressable
          disabled={
            isSubmitting
          }
          onPress={() =>
            router.back()
          }
          style={
            styles.headerButton
          }
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color="#0A3558"
          />
        </Pressable>

        <View
          style={
            styles.headerText
          }
        >
          <Text
            style={
              styles.headerTitle
            }
          >
            Expense Details
          </Text>

          <Text
            style={
              styles.headerSubtitle
            }
          >
            Review before
            submitting
          </Text>
        </View>

        <View
          style={
            styles.headerSpacer
          }
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={
          styles.scrollContent
        }
      >
        {/* RECEIPT */}

        <View
          style={
            styles.receiptCard
          }
        >
          <View
            style={
              styles.receiptImageWrap
            }
          >
            <Image
              source={{
                uri:
                  receipt.uri,
              }}
              style={
                styles.receiptImage
              }
              resizeMode="contain"
            />
          </View>

          <View
            style={
              styles.receiptMeta
            }
          >
            <View>
              <Text
                style={
                  styles.receiptLabel
                }
              >
                Receipt attached
              </Text>

              <Text
                style={
                  styles.receiptHint
                }
              >
                Ready for expense
                details
              </Text>
            </View>

            <Pressable
              disabled={
                isSubmitting
              }
              onPress={() =>
                router.back()
              }
              style={
                styles.editReceiptButton
              }
            >
              <Ionicons
                name="create-outline"
                size={16}
                color="#075A98"
              />

              <Text
                style={
                  styles.editReceiptText
                }
              >
                Edit
              </Text>
            </Pressable>
          </View>
        </View>

        {/* EXPENSE FORM */}

        <View
          style={
            styles.formCard
          }
        >
          <Text
            style={
              styles.sectionEyebrow
            }
          >
            EXPENSE INFORMATION
          </Text>

          <FieldLabel
            label="Category"
            required
          />

          <Selector
            icon="grid-outline"
            value={
              category
            }
            placeholder="Select category"
            disabled={
              isSubmitting
            }
            onPress={() =>
              setSelectorType(
                'category',
              )
            }
          />

          <FieldLabel
            label="Business Purpose"
            required
          />

          <Selector
            icon="briefcase-outline"
            value={
              businessPurpose
            }
            placeholder="Select business purpose"
            disabled={
              isSubmitting
            }
            onPress={() =>
              setSelectorType(
                'purpose',
              )
            }
          />

          {requiresAttendees && (
  <View>
    <View
      style={
        styles.attendeeHeadingRow
      }
    >
      <FieldLabel
        label="Attendees"
        required
      />

      <Text
        style={
          styles.attendeeHint
        }
      >
        Required
      </Text>
    </View>

    <View
      style={
        styles.attendeeTabs
      }
    >
      <Pressable
        disabled={
          isSubmitting
        }
        onPress={() =>
          setAttendeeTab(
            'WAVETRONIX_EMPLOYEE',
          )
        }
        style={[
          styles.attendeeTab,

          attendeeTab ===
            'WAVETRONIX_EMPLOYEE' &&
            styles.attendeeTabActive,
        ]}
      >
        <Text
          style={[
            styles.attendeeTabText,

            attendeeTab ===
              'WAVETRONIX_EMPLOYEE' &&
              styles.attendeeTabTextActive,
          ]}
        >
          Wavetronix Employees
        </Text>
      </Pressable>

      <Pressable
        disabled={
          isSubmitting
        }
        onPress={() =>
          setAttendeeTab(
            'NON_WAVETRONIX',
          )
        }
        style={[
          styles.attendeeTab,

          attendeeTab ===
            'NON_WAVETRONIX' &&
            styles.attendeeTabActive,
        ]}
      >
        <Text
          style={[
            styles.attendeeTabText,

            attendeeTab ===
              'NON_WAVETRONIX' &&
              styles.attendeeTabTextActive,
          ]}
        >
          Non-Wavetronix Attendees
        </Text>
      </Pressable>
    </View>

    {attendeeTab ===
    'WAVETRONIX_EMPLOYEE' ? (
      <View>
        {wavetronixAttendees.map(
          (
            attendee,
            index,
          ) => (
            <View
              key={
                index
              }
              style={
                styles.attendeeRow
              }
            >
              <View
                style={
                  styles.attendeeInputContainer
                }
              >
                <Ionicons
                  name="person-outline"
                  size={
                    18
                  }
                  color="#698297"
                />

                <TextInput
                  editable={
                    !isSubmitting
                  }
                  value={
                    attendee
                  }
                  onChangeText={(
                    value,
                  ) =>
                    updateAttendee(
                      'WAVETRONIX_EMPLOYEE',
                      index,
                      value,
                    )
                  }
                  placeholder="Wavetronix employee name"
                  placeholderTextColor="#91A3B1"
                  style={
                    styles.attendeeInput
                  }
                />
              </View>

              {wavetronixAttendees.length >
                1 && (
                <Pressable
                  disabled={
                    isSubmitting
                  }
                  onPress={() =>
                    removeAttendee(
                      'WAVETRONIX_EMPLOYEE',
                      index,
                    )
                  }
                  style={
                    styles.removeAttendee
                  }
                >
                  <Ionicons
                    name="close"
                    size={
                      19
                    }
                    color="#B23B34"
                  />
                </Pressable>
              )}
            </View>
          ),
        )}

        <Pressable
          disabled={
            isSubmitting
          }
          onPress={() =>
            addAttendee(
              'WAVETRONIX_EMPLOYEE',
            )
          }
          style={
            styles.addAttendeeButton
          }
        >
          <Ionicons
            name="add-circle-outline"
            size={
              19
            }
            color="#0868AE"
          />

          <Text
            style={
              styles.addAttendeeText
            }
          >
            Add another employee
          </Text>
        </Pressable>
      </View>
    ) : (
      <View>
        {nonWavetronixAttendees.map(
          (
            attendee,
            index,
          ) => (
            <View
              key={
                index
              }
              style={
                styles.attendeeRow
              }
            >
              <View
                style={
                  styles.attendeeInputContainer
                }
              >
                <Ionicons
                  name="person-outline"
                  size={
                    18
                  }
                  color="#698297"
                />

                <TextInput
                  editable={
                    !isSubmitting
                  }
                  value={
                    attendee
                  }
                  onChangeText={(
                    value,
                  ) =>
                    updateAttendee(
                      'NON_WAVETRONIX',
                      index,
                      value,
                    )
                  }
                  placeholder="Attendee name"
                  placeholderTextColor="#91A3B1"
                  style={
                    styles.attendeeInput
                  }
                />
              </View>

              {nonWavetronixAttendees.length >
                1 && (
                <Pressable
                  disabled={
                    isSubmitting
                  }
                  onPress={() =>
                    removeAttendee(
                      'NON_WAVETRONIX',
                      index,
                    )
                  }
                  style={
                    styles.removeAttendee
                  }
                >
                  <Ionicons
                    name="close"
                    size={
                      19
                    }
                    color="#B23B34"
                  />
                </Pressable>
              )}
            </View>
          ),
        )}

        <Pressable
          disabled={
            isSubmitting
          }
          onPress={() =>
            addAttendee(
              'NON_WAVETRONIX',
            )
          }
          style={
            styles.addAttendeeButton
          }
        >
          <Ionicons
            name="add-circle-outline"
            size={
              19
            }
            color="#0868AE"
          />

          <Text
            style={
              styles.addAttendeeText
            }
          >
            Add another attendee
          </Text>
        </Pressable>
      </View>
    )}
  </View>
)}

          <FieldLabel
            label="Comments"
          />

          <View
            style={
              styles.commentsContainer
            }
          >
            <TextInput
              editable={
                !isSubmitting
              }
              value={
                comments
              }
              onChangeText={
                setComments
              }
              multiline
              maxLength={500}
              placeholder="Add any useful details..."
              placeholderTextColor="#91A3B1"
              style={
                styles.commentsInput
              }
            />

            <Text
              style={
                styles.characterCount
              }
            >
              {comments.length}/500
            </Text>
          </View>

          <Text
            style={
              styles.commentsHelp
            }
          >
            Optional — only add
            information that helps
            explain the expense.
          </Text>
        </View>

        {/* REVIEW CARD */}

        <View
          style={
            styles.reviewCard
          }
        >
          <View
            style={
              styles.reviewIcon
            }
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={22}
              color="#0868AE"
            />
          </View>

          <View
            style={
              styles.reviewText
            }
          >
            <Text
              style={
                styles.reviewTitle
              }
            >
              Ready to submit
            </Text>

            <Text
              style={
                styles.reviewDescription
              }
            >
              Your receipt will be
              uploaded securely and
              linked to this expense.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* BOTTOM */}

      <View
        style={
          styles.bottomBar
        }
      >
        <Pressable
          disabled={
            isSubmitting
          }
          onPress={
            submitExpense
          }
          style={[
            styles.submitButton,

            isSubmitting &&
              styles.submitDisabled,
          ]}
        >
          <Text
            style={
              styles.submitButtonText
            }
          >
            {isSubmitting
              ? 'Submitting...'
              : 'Submit Expense'}
          </Text>

          {!isSubmitting && (
            <Ionicons
              name="arrow-forward"
              size={20}
              color="#FFFFFF"
            />
          )}
        </Pressable>
      </View>

      {/* SELECTOR */}

      <Modal
        visible={
          selectorType !==
            null &&
          !isSubmitting
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setSelectorType(
            null,
          )
        }
      >
        <Pressable
          style={
            styles.modalBackdrop
          }
          onPress={() =>
            setSelectorType(
              null,
            )
          }
        >
          <Pressable
            style={
              styles.selectorSheet
            }
            onPress={() => {}}
          >
            <View
              style={
                styles.sheetHandle
              }
            />

            <View
              style={
                styles.sheetHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.sheetTitle
                  }
                >
                  {selectorType ===
                  'category'
                    ? 'Select Category'
                    : 'Business Purpose'}
                </Text>

                <Text
                  style={
                    styles.sheetSubtitle
                  }
                >
                  Choose one option
                </Text>
              </View>

              <Pressable
                onPress={() =>
                  setSelectorType(
                    null,
                  )
                }
                style={
                  styles.closeSheetButton
                }
              >
                <Ionicons
                  name="close"
                  size={20}
                  color="#45647D"
                />
              </Pressable>
            </View>

            <ScrollView
              style={
                styles.optionsList
              }
              showsVerticalScrollIndicator={
                false
              }
            >
              {selectorOptions.map(
                (
                  option,
                ) => {
                  const selected =
                    selectorType ===
                    'category'
                      ? category ===
                        option
                      : businessPurpose ===
                        option;

                  return (
                    <Pressable
                      key={
                        option
                      }
                      onPress={() =>
                        selectOption(
                          option,
                        )
                      }
                      style={[
                        styles.optionRow,

                        selected &&
                          styles.optionRowSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionText,

                          selected &&
                            styles.optionTextSelected,
                        ]}
                      >
                        {option}
                      </Text>

                      {selected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={21}
                          color="#0868AE"
                        />
                      )}
                    </Pressable>
                  );
                },
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

type FieldLabelProps = {
  label:
    string;

  required?:
    boolean;
};

function FieldLabel({
  label,
  required = false,
}: FieldLabelProps) {
  return (
    <Text
      style={
        styles.fieldLabel
      }
    >
      {label}

      {required && (
        <Text
          style={
            styles.required
          }
        >
          {' '}*
        </Text>
      )}
    </Text>
  );
}

type SelectorProps = {
  icon:
    keyof typeof Ionicons.glyphMap;

  value:
    string;

  placeholder:
    string;

  onPress:
    () => void;

  disabled?:
    boolean;
};

function Selector({
  icon,
  value,
  placeholder,
  onPress,
  disabled = false,
}: SelectorProps) {
  return (
    <Pressable
      disabled={
        disabled
      }
      onPress={
        onPress
      }
      style={({
        pressed,
      }) => [
        styles.selector,

        pressed &&
          !disabled &&
          styles.selectorPressed,

        disabled &&
          styles.selectorDisabled,
      ]}
    >
      <View
        style={
          styles.selectorIcon
        }
      >
        <Ionicons
          name={icon}
          size={20}
          color="#0868AE"
        />
      </View>

      <Text
        numberOfLines={1}
        style={[
          styles.selectorText,

          !value &&
            styles.selectorPlaceholder,
        ]}
      >
        {value ||
          placeholder}
      </Text>

      <Ionicons
        name="chevron-down"
        size={19}
        color="#637C8F"
      />
    </Pressable>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex:
        1,

      backgroundColor:
        '#F4F8FB',
    },

    header: {
      paddingTop:
        50,

      paddingHorizontal:
        18,

      paddingBottom:
        15,

      flexDirection:
        'row',

      alignItems:
        'center',

      borderBottomWidth:
        1,

      borderBottomColor:
        '#E8EEF3',

      backgroundColor:
        '#FFFFFF',
    },

    headerButton: {
      width:
        44,

      height:
        44,

      borderRadius:
        22,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        '#EFF5F9',
    },

    headerText: {
      flex:
        1,

      alignItems:
        'center',
    },

    headerTitle: {
      fontSize:
        18.5,

      fontWeight:
        '700',

      color:
        '#0A3558',
    },

    headerSubtitle: {
      marginTop:
        2,

      fontSize:
        10.5,

      color:
        '#8498A8',
    },

    headerSpacer: {
      width:
        44,
    },

    scrollContent: {
      paddingHorizontal:
        18,

      paddingTop:
        18,

      paddingBottom:
        125,
    },

    receiptCard: {
      padding:
        14,

      borderRadius:
        22,

      backgroundColor:
        '#FFFFFF',

      elevation:
        2,
    },

    receiptImageWrap: {
      height:
        230,

      overflow:
        'hidden',

      borderRadius:
        17,

      backgroundColor:
        '#EDF3F7',
    },

    receiptImage: {
      width:
        '100%',

      height:
        '100%',
    },

    receiptMeta: {
      marginTop:
        13,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',
    },

    receiptLabel: {
      fontSize:
        13.5,

      fontWeight:
        '700',

      color:
        '#173F60',
    },

    receiptHint: {
      marginTop:
        2,

      fontSize:
        10.5,

      color:
        '#899CAB',
    },

    editReceiptButton: {
      paddingHorizontal:
        13,

      paddingVertical:
        8,

      flexDirection:
        'row',

      alignItems:
        'center',

      gap:
        5,

      borderRadius:
        16,

      backgroundColor:
        '#E7F2FA',
    },

    editReceiptText: {
      fontSize:
        11.5,

      fontWeight:
        '700',

      color:
        '#075A98',
    },

    formCard: {
      marginTop:
        16,

      padding:
        17,

      borderRadius:
        22,

      backgroundColor:
        '#FFFFFF',
    },

    sectionEyebrow: {
      marginBottom:
        5,

      fontSize:
        8.5,

      fontWeight:
        '700',

      letterSpacing:
        2,

      color:
        '#8BA0B0',
    },

    fieldLabel: {
      marginTop:
        17,

      marginBottom:
        8,

      fontSize:
        13.5,

      fontWeight:
        '700',

      color:
        '#173F60',
    },

    required: {
      color:
        '#C53A35',
    },

    selector: {
      height:
        58,

      paddingHorizontal:
        12,

      flexDirection:
        'row',

      alignItems:
        'center',

      borderWidth:
        1,

      borderColor:
        '#D4E2EB',

      borderRadius:
        16,

      backgroundColor:
        '#FBFDFE',
    },

    selectorPressed: {
      backgroundColor:
        '#F5F9FC',
    },

    selectorDisabled: {
      opacity:
        0.6,
    },

    selectorIcon: {
      width:
        38,

      height:
        38,

      marginRight:
        10,

      borderRadius:
        12,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        '#E7F2FA',
    },

    selectorText: {
      flex:
        1,

      fontSize:
        13.5,

      fontWeight:
        '600',

      color:
        '#173F60',
    },

    selectorPlaceholder: {
      fontWeight:
        '400',

      color:
        '#8CA0AF',
    },

    attendeeHeadingRow: {
      flexDirection:
        'row',

      alignItems:
        'flex-end',

      justifyContent:
        'space-between',
    },

    attendeeHint: {
      marginBottom:
        8,

      fontSize:
        10.5,

      fontWeight:
        '600',

      color:
        '#B23B34',
    },
    attendeeTabs: {
  marginBottom: 13,
  padding: 4,
  flexDirection: 'row',
  gap: 4,
  borderRadius: 15,
  backgroundColor: '#EEF4F8',
},

attendeeTab: {
  flex: 1,
  minHeight: 44,
  paddingHorizontal: 8,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 12,
},

attendeeTabActive: {
  backgroundColor: '#FFFFFF',
  elevation: 1,
},

attendeeTabText: {
  textAlign: 'center',
  fontSize: 10.5,
  lineHeight: 14,
  fontWeight: '600',
  color: '#70879A',
},

attendeeTabTextActive: {
  fontWeight: '700',
  color: '#0868AE',
},

    attendeeRow: {
      flexDirection:
        'row',

      gap:
        8,

      marginBottom:
        9,
    },

    attendeeInputContainer: {
      flex:
        1,

      height:
        54,

      paddingHorizontal:
        13,

      flexDirection:
        'row',

      alignItems:
        'center',

      gap:
        8,

      borderWidth:
        1,

      borderColor:
        '#D4E2EB',

      borderRadius:
        15,

      backgroundColor:
        '#FBFDFE',
    },

    attendeeInput: {
      flex:
        1,

      fontSize:
        13.5,

      color:
        '#173F60',
    },

    removeAttendee: {
      width:
        45,

      height:
        54,

      borderRadius:
        15,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        '#FDECEA',
    },

    addAttendeeButton: {
      alignSelf:
        'flex-start',

      marginTop:
        1,

      paddingVertical:
        8,

      flexDirection:
        'row',

      alignItems:
        'center',

      gap:
        6,
    },

    addAttendeeText: {
      fontSize:
        12,

      fontWeight:
        '700',

      color:
        '#0868AE',
    },

    commentsContainer: {
      minHeight:
        108,

      paddingHorizontal:
        13,

      paddingTop:
        11,

      paddingBottom:
        8,

      borderWidth:
        1,

      borderColor:
        '#D4E2EB',

      borderRadius:
        16,

      backgroundColor:
        '#FBFDFE',
    },

    commentsInput: {
      minHeight:
        66,

      fontSize:
        13.5,

      lineHeight:
        19,

      color:
        '#173F60',

      textAlignVertical:
        'top',
    },

    characterCount: {
      textAlign:
        'right',

      fontSize:
        9.5,

      color:
        '#9AADBA',
    },

    commentsHelp: {
      marginTop:
        7,

      fontSize:
        10.5,

      lineHeight:
        15,

      color:
        '#879CAA',
    },

    reviewCard: {
      marginTop:
        16,

      padding:
        15,

      flexDirection:
        'row',

      gap:
        11,

      borderRadius:
        19,

      backgroundColor:
        '#E8F3FA',
    },

    reviewIcon: {
      width:
        42,

      height:
        42,

      borderRadius:
        13,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        '#D8EBF6',
    },

    reviewText: {
      flex:
        1,
    },

    reviewTitle: {
      fontSize:
        13,

      fontWeight:
        '700',

      color:
        '#174966',
    },

    reviewDescription: {
      marginTop:
        3,

      fontSize:
        10.5,

      lineHeight:
        15,

      color:
        '#5E7A8D',
    },

    bottomBar: {
      position:
        'absolute',

      left:
        0,

      right:
        0,

      bottom:
        0,

      paddingHorizontal:
        18,

      paddingTop:
        12,

      paddingBottom:
        26,

      borderTopWidth:
        1,

      borderTopColor:
        '#E8EEF3',

      backgroundColor:
        '#FFFFFF',
    },

    submitButton: {
      height:
        58,

      borderRadius:
        17,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap:
        8,

      backgroundColor:
        '#0868AE',
    },

    submitDisabled: {
      opacity:
        0.65,
    },

    submitButtonText: {
      fontSize:
        16,

      fontWeight:
        '700',

      color:
        '#FFFFFF',
    },

    modalBackdrop: {
      flex:
        1,

      justifyContent:
        'flex-end',

      backgroundColor:
        'rgba(5,26,43,0.42)',
    },

    selectorSheet: {
      maxHeight:
        '72%',

      paddingHorizontal:
        18,

      paddingTop:
        10,

      paddingBottom:
        28,

      borderTopLeftRadius:
        28,

      borderTopRightRadius:
        28,

      backgroundColor:
        '#FFFFFF',
    },

    sheetHandle: {
      width:
        42,

      height:
        4,

      alignSelf:
        'center',

      marginBottom:
        18,

      borderRadius:
        4,

      backgroundColor:
        '#D4E0E8',
    },

    sheetHeader: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      marginBottom:
        14,
    },

    sheetTitle: {
      fontSize:
        19,

      fontWeight:
        '700',

      color:
        '#0A3558',
    },

    sheetSubtitle: {
      marginTop:
        3,

      fontSize:
        11,

      color:
        '#8498A8',
    },

    closeSheetButton: {
      width:
        40,

      height:
        40,

      borderRadius:
        20,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        '#EFF5F9',
    },

    optionsList: {
      maxHeight:
        430,
    },

    optionRow: {
      minHeight:
        52,

      paddingHorizontal:
        14,

      marginBottom:
        6,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      borderRadius:
        14,

      backgroundColor:
        '#F7FAFC',
    },

    optionRowSelected: {
      borderWidth:
        1,

      borderColor:
        '#8DC6E8',

      backgroundColor:
        '#E8F4FB',
    },

    optionText: {
      flex:
        1,

      paddingRight:
        10,

      fontSize:
        13,

      color:
        '#365A73',
    },

    optionTextSelected: {
      fontWeight:
        '700',

      color:
        '#075A98',
    },

    emptyScreen: {
      flex:
        1,

      paddingHorizontal:
        30,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        '#F4F8FB',
    },

    emptyIcon: {
      width:
        72,

      height:
        72,

      borderRadius:
        24,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        '#E5F1F9',
    },

    emptyTitle: {
      marginTop:
        16,

      fontSize:
        20,

      fontWeight:
        '700',

      color:
        '#173F60',
    },

    emptySubtitle: {
      marginTop:
        6,

      textAlign:
        'center',

      fontSize:
        12.5,

      color:
        '#8397A6',
    },

    captureAgainButton: {
      marginTop:
        22,

      height:
        52,

      paddingHorizontal:
        24,

      borderRadius:
        15,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        '#0868AE',
    },

    captureAgainText: {
      fontSize:
        14,

      fontWeight:
        '700',

      color:
        '#FFFFFF',
    },
  });