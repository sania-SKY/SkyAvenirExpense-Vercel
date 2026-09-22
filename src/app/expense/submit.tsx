import { useState } from 'react';

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { useReceipt } from '../../context/ReceiptContext';

import { businessPurposes } from '../../../data/businessPurposes';
import { categories } from '../../../data/categories';

type SelectorType =
  | 'category'
  | 'purpose'
  | null;

export default function SubmitExpenseScreen() {
  const { receipt } = useReceipt();

  const [category, setCategory] =
    useState('');

  const [businessPurpose, setBusinessPurpose] =
    useState('');

  const [comments, setComments] =
    useState('');

  const [attendees, setAttendees] =
    useState<string[]>(['']);

  const [selectorType, setSelectorType] =
    useState<SelectorType>(null);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const requiresAttendees =
    category ===
    'Travel - Meals and Entertainment with Attendees';

  const selectorOptions =
    selectorType === 'category'
      ? categories
      : businessPurposes;

  function selectOption(
    value: string,
  ) {
    if (
      selectorType === 'category'
    ) {
      setCategory(value);
    }

    if (
      selectorType === 'purpose'
    ) {
      setBusinessPurpose(value);
    }

    setSelectorType(null);
  }

  function updateAttendee(
    index: number,
    value: string,
  ) {
    setAttendees((current) =>
      current.map(
        (
          attendee,
          attendeeIndex,
        ) =>
          attendeeIndex === index
            ? value
            : attendee,
      ),
    );
  }

  function addAttendee() {
    setAttendees((current) => [
      ...current,
      '',
    ]);
  }

  function removeAttendee(
    index: number,
  ) {
    setAttendees((current) => {
      const next =
        current.filter(
          (_, attendeeIndex) =>
            attendeeIndex !== index,
        );

      return next.length
        ? next
        : [''];
    });
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

    if (requiresAttendees) {
      const validAttendees =
        attendees.filter(
          (name) =>
            name.trim().length > 0,
        );

      if (
        validAttendees.length === 0
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

  async function submitExpense() {
    if (!validateExpense()) {
      return;
    }

    if (!receipt) {
      Alert.alert(
        'Receipt missing',
        'Please capture or select a receipt.',
      );

      return;
    }

    try {
      setIsSubmitting(true);

      const expenseData = {
        receiptUri:
          receipt.uri,

        category,

        businessPurpose,

        comments:
          comments.trim(),

        attendees:
          requiresAttendees
            ? attendees
                .map(
                  (name) =>
                    name.trim(),
                )
                .filter(Boolean)
            : [],
      };

      console.log(
        'Expense ready for backend:',
        expenseData,
      );

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            700,
          ),
      );

      router.push(
        '/expense/success',
      );
    } catch (error) {
      console.error(
        'Submit expense error:',
        error,
      );

      Alert.alert(
        'Unable to submit expense',
        'Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!receipt) {
    return (
      <View style={styles.emptyScreen}>
        <Ionicons
          name="receipt-outline"
          size={52}
          color="#8EA4B5"
        />

        <Text style={styles.emptyTitle}>
          Receipt unavailable
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
      style={styles.container}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Pressable
          onPress={() =>
            router.back()
          }
          style={styles.headerButton}
        >
          <Ionicons
            name="chevron-back"
            size={25}
            color="#082F56"
          />
        </Pressable>

        <Text style={styles.headerTitle}>
          Expense Details
        </Text>

        <View
          style={styles.headerSpacer}
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
        <View
          style={
            styles.receiptContainer
          }
        >
          <View
            style={
              styles.receiptPreview
            }
          >
            <Image
              source={{
                uri: receipt.uri,
              }}
              style={
                styles.receiptImage
              }
              resizeMode="contain"
            />
          </View>

          <Pressable
            onPress={() =>
              router.back()
            }
            style={
              styles.editReceiptButton
            }
          >
            <Ionicons
              name="create-outline"
              size={17}
              color="#075A98"
            />

            <Text
              style={
                styles.editReceiptText
              }
            >
              Edit Receipt
            </Text>
          </Pressable>
        </View>

        <FieldLabel
          label="Category"
          required
        />

        <Selector
          icon="grid-outline"
          value={category}
          placeholder="Select category"
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
          value={businessPurpose}
          placeholder="Select business purpose"
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
                Required for this expense type
              </Text>
            </View>

            {attendees.map(
              (
                attendee,
                index,
              ) => (
                <View
                  key={index}
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
                      size={19}
                      color="#668095"
                    />

                    <TextInput
                      value={
                        attendee
                      }
                      onChangeText={(
                        value,
                      ) =>
                        updateAttendee(
                          index,
                          value,
                        )
                      }
                      placeholder="Attendee name"
                      placeholderTextColor="#8AA0B1"
                      style={
                        styles.attendeeInput
                      }
                    />
                  </View>

                  {attendees.length >
                    1 && (
                    <Pressable
                      onPress={() =>
                        removeAttendee(
                          index,
                        )
                      }
                      style={
                        styles.removeAttendee
                      }
                    >
                      <Ionicons
                        name="close"
                        size={19}
                        color="#B42318"
                      />
                    </Pressable>
                  )}
                </View>
              ),
            )}

            <Pressable
              onPress={addAttendee}
              style={
                styles.addAttendeeButton
              }
            >
              <Ionicons
                name="add-circle-outline"
                size={20}
                color="#075A98"
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

        <FieldLabel
          label="Comments"
        />

        <View
          style={
            styles.commentsContainer
          }
        >
          <TextInput
            value={comments}
            onChangeText={
              setComments
            }
            multiline
            maxLength={500}
            placeholder="Add any additional details..."
            placeholderTextColor="#8AA0B1"
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
          Optional — add details only when useful.
        </Text>

        <View style={styles.summaryCard}>
          <View
            style={
              styles.summaryIcon
            }
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={21}
              color="#075A98"
            />
          </View>

          <View style={styles.summaryText}>
            <Text
              style={
                styles.summaryTitle
              }
            >
              Ready when you are
            </Text>

            <Text
              style={
                styles.summaryDescription
              }
            >
              Review the receipt and
              expense details before
              submitting.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable
          disabled={isSubmitting}
          onPress={submitExpense}
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

      <Modal
        visible={
          selectorType !== null
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setSelectorType(null)
        }
      >
        <Pressable
          style={
            styles.modalBackdrop
          }
          onPress={() =>
            setSelectorType(null)
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
                (option) => {
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
                          color="#0870B8"
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
  label: string;
  required?: boolean;
};

function FieldLabel({
  label,
  required = false,
}: FieldLabelProps) {
  return (
    <Text style={styles.fieldLabel}>
      {label}

      {required && (
        <Text
          style={styles.required}
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

  value: string;

  placeholder: string;

  onPress: () => void;
};

function Selector({
  icon,
  value,
  placeholder,
  onPress,
}: SelectorProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.selector,

        pressed &&
          styles.selectorPressed,
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
          color="#075A98"
        />
      </View>

      <Text
        style={[
          styles.selectorText,

          !value &&
            styles.selectorPlaceholder,
        ]}
      >
        {value || placeholder}
      </Text>

      <Ionicons
        name="chevron-down"
        size={20}
        color="#58758B"
      />
    </Pressable>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F5F9FC',
    },

    header: {
      paddingTop: 50,
      paddingHorizontal: 18,
      paddingBottom: 15,

      flexDirection: 'row',
      alignItems: 'center',

      backgroundColor: '#FFFFFF',

      borderBottomWidth: 1,
      borderBottomColor: '#E5EDF3',
    },

    headerButton: {
      width: 44,
      height: 44,

      borderRadius: 22,

      alignItems: 'center',
      justifyContent: 'center',

      backgroundColor: '#EFF5F9',
    },

    headerTitle: {
      flex: 1,

      textAlign: 'center',

      fontSize: 18,
      fontWeight: '700',

      color: '#082F56',
    },

    headerSpacer: {
      width: 44,
    },

    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 125,
    },

    receiptContainer: {
      alignItems: 'center',

      marginBottom: 18,
    },

    receiptPreview: {
      width: 170,
      height: 205,

      overflow: 'hidden',

      borderRadius: 20,

      backgroundColor: '#E5EDF3',

      elevation: 4,
    },

    receiptImage: {
      width: '100%',
      height: '100%',
    },

    editReceiptButton: {
      marginTop: 12,

      flexDirection: 'row',
      alignItems: 'center',

      gap: 6,

      paddingVertical: 8,
      paddingHorizontal: 14,

      borderRadius: 20,

      backgroundColor: '#E5F1F9',
    },

    editReceiptText: {
      fontSize: 12.5,
      fontWeight: '700',

      color: '#075A98',
    },

    fieldLabel: {
      marginTop: 18,
      marginBottom: 8,

      fontSize: 14,
      fontWeight: '700',

      color: '#173D5D',
    },

    required: {
      color: '#C63A34',
    },

    selector: {
      height: 58,

      paddingHorizontal: 13,

      flexDirection: 'row',
      alignItems: 'center',

      borderRadius: 16,

      borderWidth: 1,
      borderColor: '#D2E0EA',

      backgroundColor: '#FFFFFF',
    },

    selectorPressed: {
      backgroundColor: '#F8FBFD',
    },

    selectorIcon: {
      width: 38,
      height: 38,

      marginRight: 10,

      borderRadius: 12,

      alignItems: 'center',
      justifyContent: 'center',

      backgroundColor: '#E8F3FA',
    },

    selectorText: {
      flex: 1,

      fontSize: 14,
      fontWeight: '600',

      color: '#173D5D',
    },

    selectorPlaceholder: {
      fontWeight: '400',

      color: '#8297A8',
    },

    attendeeHeadingRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent:
        'space-between',
    },

    attendeeHint: {
      marginBottom: 8,

      fontSize: 10.5,

      color: '#8498A7',
    },

    attendeeRow: {
      flexDirection: 'row',

      gap: 9,

      marginBottom: 10,
    },

    attendeeInputContainer: {
      flex: 1,

      height: 55,

      paddingHorizontal: 14,

      flexDirection: 'row',
      alignItems: 'center',

      gap: 9,

      borderRadius: 15,

      borderWidth: 1,
      borderColor: '#D2E0EA',

      backgroundColor: '#FFFFFF',
    },

    attendeeInput: {
      flex: 1,

      fontSize: 14,

      color: '#173D5D',
    },

    removeAttendee: {
      width: 46,
      height: 55,

      borderRadius: 15,

      alignItems: 'center',
      justifyContent: 'center',

      backgroundColor: '#FFF1F0',
    },

    addAttendeeButton: {
      alignSelf: 'flex-start',

      flexDirection: 'row',
      alignItems: 'center',

      gap: 7,

      marginTop: 3,

      paddingVertical: 8,
    },

    addAttendeeText: {
      fontSize: 13,
      fontWeight: '700',

      color: '#075A98',
    },

    commentsContainer: {
      minHeight: 115,

      paddingHorizontal: 14,
      paddingTop: 12,
      paddingBottom: 8,

      borderWidth: 1,
      borderColor: '#D2E0EA',

      borderRadius: 16,

      backgroundColor: '#FFFFFF',
    },

    commentsInput: {
      minHeight: 70,

      fontSize: 14,
      lineHeight: 20,

      color: '#173D5D',

      textAlignVertical: 'top',
    },

    characterCount: {
      textAlign: 'right',

      fontSize: 10.5,

      color: '#92A5B4',
    },

    commentsHelp: {
      marginTop: 7,

      fontSize: 11,

      color: '#8397A6',
    },

    summaryCard: {
      marginTop: 25,

      padding: 15,

      flexDirection: 'row',

      gap: 12,

      borderRadius: 18,

      backgroundColor: '#EAF4FA',
    },

    summaryIcon: {
      width: 40,
      height: 40,

      borderRadius: 13,

      alignItems: 'center',
      justifyContent: 'center',

      backgroundColor: '#D9EBF7',
    },

    summaryText: {
      flex: 1,
    },

    summaryTitle: {
      fontSize: 13.5,
      fontWeight: '700',

      color: '#174966',
    },

    summaryDescription: {
      marginTop: 3,

      fontSize: 11.5,
      lineHeight: 17,

      color: '#5A788C',
    },

    bottomBar: {
      position: 'absolute',

      bottom: 0,
      left: 0,
      right: 0,

      paddingHorizontal: 20,
      paddingTop: 13,
      paddingBottom: 27,

      backgroundColor: '#FFFFFF',

      borderTopWidth: 1,
      borderTopColor: '#E5EDF3',
    },

    submitButton: {
      height: 58,

      flexDirection: 'row',

      gap: 8,

      alignItems: 'center',
      justifyContent: 'center',

      borderRadius: 16,

      backgroundColor: '#0868AE',
    },

    submitDisabled: {
      opacity: 0.6,
    },

    submitButtonText: {
      fontSize: 16,
      fontWeight: '700',

      color: '#FFFFFF',
    },

    modalBackdrop: {
      flex: 1,

      justifyContent: 'flex-end',

      backgroundColor:
        'rgba(5, 26, 43, 0.40)',
    },

    selectorSheet: {
      maxHeight: '72%',

      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 30,

      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,

      backgroundColor: '#FFFFFF',
    },

    sheetHandle: {
      width: 42,
      height: 4,

      alignSelf: 'center',

      marginBottom: 19,

      borderRadius: 5,

      backgroundColor: '#D4E0E8',
    },

    sheetHeader: {
      flexDirection: 'row',

      alignItems: 'center',
      justifyContent:
        'space-between',

      marginBottom: 15,
    },

    sheetTitle: {
      fontSize: 20,
      fontWeight: '700',

      color: '#082F56',
    },

    sheetSubtitle: {
      marginTop: 3,

      fontSize: 12,

      color: '#8196A6',
    },

    closeSheetButton: {
      width: 40,
      height: 40,

      borderRadius: 20,

      alignItems: 'center',
      justifyContent: 'center',

      backgroundColor: '#EFF5F9',
    },

    optionsList: {
      maxHeight: 430,
    },

    optionRow: {
      minHeight: 54,

      paddingHorizontal: 15,

      flexDirection: 'row',

      alignItems: 'center',
      justifyContent:
        'space-between',

      marginBottom: 7,

      borderRadius: 14,

      backgroundColor: '#F7FAFC',
    },

    optionRowSelected: {
      borderWidth: 1,
      borderColor: '#8DC6E8',

      backgroundColor: '#E8F4FB',
    },

    optionText: {
      fontSize: 14,

      color: '#365A73',
    },

    optionTextSelected: {
      fontWeight: '700',

      color: '#075A98',
    },

    emptyScreen: {
      flex: 1,

      alignItems: 'center',
      justifyContent: 'center',

      paddingHorizontal: 30,

      backgroundColor: '#F5F9FC',
    },

    emptyTitle: {
      marginTop: 13,

      fontSize: 20,
      fontWeight: '700',

      color: '#173D5D',
    },

    captureAgainButton: {
      marginTop: 22,

      height: 52,

      paddingHorizontal: 24,

      borderRadius: 15,

      alignItems: 'center',
      justifyContent: 'center',

      backgroundColor: '#0868AE',
    },

    captureAgainText: {
      fontSize: 15,
      fontWeight: '700',

      color: '#FFFFFF',
    },
  });