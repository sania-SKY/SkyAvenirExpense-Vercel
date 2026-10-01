import {
  useCallback,
  useState,
} from 'react';

import {
  Ionicons,
} from '@expo/vector-icons';

import {
  router,
} from 'expo-router';

import { Image as ExpoImage } from 'expo-image';

import * as ImageManipulator from 'expo-image-manipulator';

import * as ImagePicker from 'expo-image-picker';

import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  useReceipt,
} from '../../context/ReceiptContext';

import {
  ReceiptCropModal,
} from '../../components/receipt-crop-modal';

import type {
  CropRegion,
} from '../../components/receipt-crop-modal';

export default function ReceiptPreviewScreen() {
  const {
    receipt,
    setReceipt,
    updateReceiptUri,
    clearReceipt,
  } = useReceipt();

  /*
   * Result of loading ONE specific photo. It is only
   * ever written when the image finishes or fails,
   * never reset to "loading" by a restarted load, so
   * the overlay and Continue cannot flicker on
   * Android Chrome. A different photo (rotate, crop,
   * replace) has a different uri, which naturally
   * reads as "not loaded yet".
   */
  const [
    imageResult,
    setImageResult,
  ] = useState<{
    uri: string;
    ok: boolean;
  } | null>(null);

  const [
    isProcessing,
    setIsProcessing,
  ] = useState(false);

  const [
    cropModalVisible,
    setCropModalVisible,
  ] = useState(false);

  const [
    cropImageDimensions,
    setCropImageDimensions,
  ] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const receiptUri =
    receipt?.uri ?? '';

  const imageLoaded =
    imageResult?.uri ===
      receiptUri &&
    imageResult.ok;

  const imageError =
    imageResult?.uri ===
      receiptUri &&
    !imageResult.ok;

  const handleImageLoad =
    useCallback(
      () => {
        setImageResult({
          uri: receiptUri,
          ok: true,
        });
      },
      [receiptUri],
    );

  const handleImageError =
    useCallback(
      (
        event: {
          error?: string;
        },
      ) => {
        console.error(
          'Receipt image failed:',
          event?.error,
        );

        setImageResult({
          uri: receiptUri,
          ok: false,
        });
      },
      [receiptUri],
    );

  /*
   * ------------------------------------------------
   * ROTATE
   * ------------------------------------------------
   */

  async function rotateReceipt(
  degrees: number,
) {
  if (
    !receiptUri ||
    isProcessing
  ) {
    return;
  }

  try {
    setIsProcessing(true);

    const result =
      await ImageManipulator
        .manipulateAsync(
          receiptUri,

          [
            {
              rotate:
                degrees,
            },
          ],

          {
            compress:
              0.9,

            format:
              ImageManipulator
                .SaveFormat
                .JPEG,
          },
        );

    updateReceiptUri(
      result.uri,
    );
  } catch (error) {
    console.error(
      'Rotate receipt error:',
      error,
    );

    Alert.alert(
      'Unable to rotate receipt',
      'Please try again.',
    );
  } finally {
    setIsProcessing(false);
  }
}

  /*
   * ------------------------------------------------
   * CROP (interactive, drag-to-adjust)
   * ------------------------------------------------
   *
   * Opens ReceiptCropModal with a movable /
   * resizable rectangle over the image, similar to
   * a normal photo editor, instead of a fixed
   * "Light Crop / Tight Crop" percentage choice.
   * ------------------------------------------------
   */

  async function cropReceipt() {
    if (
      !receiptUri ||
      isProcessing
    ) {
      return;
    }

    try {
      const dimensions =
        await getImageSize(
          receiptUri,
        );

      setCropImageDimensions(
        dimensions,
      );

      setCropModalVisible(
        true,
      );
    } catch (error) {
      console.error(
        'Unable to read receipt dimensions:',
        error,
      );

      Alert.alert(
        'Unable to crop receipt',
        'Please try again.',
      );
    }
  }

  async function handleApplyCrop(
    region:
      CropRegion,
  ) {
    setCropModalVisible(
      false,
    );

    if (
      !receiptUri ||
      isProcessing
    ) {
      return;
    }

    try {
      setIsProcessing(true);

      const result =
        await ImageManipulator
          .manipulateAsync(
            receiptUri,

            [
              {
                crop: {
                  originX:
                    region.originX,

                  originY:
                    region.originY,

                  width:
                    region.width,

                  height:
                    region.height,
                },
              },
            ],

            {
              compress:
                0.88,

              format:
                ImageManipulator
                  .SaveFormat
                  .JPEG,
            },
          );

      updateReceiptUri(
        result.uri,
      );
    } catch (error) {
      console.error(
        'Crop receipt error:',
        error,
      );

      Alert.alert(
        'Unable to crop receipt',
        'Please try again.',
      );
    } finally {
      setIsProcessing(false);
    }
  }

  function handleCancelCrop() {
    setCropModalVisible(
      false,
    );
  }

  /*
   * ------------------------------------------------
   * REPLACE FROM GALLERY
   * ------------------------------------------------
   */

  async function replaceReceipt() {
    if (isProcessing) {
      return;
    }

    try {
      const permission =
        await ImagePicker
          .requestMediaLibraryPermissionsAsync();

      if (
        !permission.granted
      ) {
        Alert.alert(
          'Photo Access Required',
          'Please allow photo access to select a receipt.',
        );

        return;
      }

      const result =
        await ImagePicker
          .launchImageLibraryAsync({
            mediaTypes: [
              'images',
            ],

            /*
             * Native crop/editor.
             */
            allowsEditing:
              true,

            quality:
              0.85,
          });

      if (
        result.canceled
      ) {
        return;
      }

      const selected =
        result.assets?.[0];

      if (
        !selected?.uri
      ) {
        Alert.alert(
          'Receipt Error',
          'The selected receipt could not be loaded.',
        );

        return;
      }

      setReceipt({
        uri:
          selected.uri,

        source:
          'gallery',
      });
    } catch (error) {
      console.error(
        'Replace receipt error:',
        error,
      );

      Alert.alert(
        'Unable to open gallery',
        'Please try again.',
      );
    }
  }

  /*
   * ------------------------------------------------
   * REMOVE
   * ------------------------------------------------
   */

  function deleteReceipt() {
    if (isProcessing) {
      return;
    }

    Alert.alert(
      'Remove receipt?',
      'This receipt will be discarded.',
      [
        {
          text:
            'Cancel',

          style:
            'cancel',
        },

        {
          text:
            'Remove',

          style:
            'destructive',

          onPress:
            () => {
              clearReceipt();

              router.replace(
                '/expense/capture',
              );
            },
        },
      ],
    );
  }

  /*
   * ------------------------------------------------
   * RETAKE
   * ------------------------------------------------
   */

  function retakeReceipt() {
    if (isProcessing) {
      return;
    }

    clearReceipt();

    router.replace(
      '/expense/capture',
    );
  }

  /*
   * ------------------------------------------------
   * CONTINUE
   * ------------------------------------------------
   */

  function continueToDetails() {
    if (
      !receiptUri ||
      imageError ||
      isProcessing
    ) {
      return;
    }

    router.push(
      '/expense/submit',
    );
  }

  /*
   * ------------------------------------------------
   * EMPTY STATE
   * ------------------------------------------------
   */

  if (!receiptUri) {
    return (
      <View
        style={
          styles.errorScreen
        }
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#F5F9FC"
        />

        <Ionicons
          name="image-outline"
          size={54}
          color="#8CA3B5"
        />

        <Text
          style={
            styles.errorTitle
          }
        >
          Receipt not available
        </Text>

        <Text
          style={
            styles.errorSubtitle
          }
        >
          Capture a receipt or
          choose one from your
          gallery to continue.
        </Text>

        <Pressable
          onPress={() =>
            router.replace(
              '/expense/capture',
            )
          }
          style={
            styles.captureAgainButton
          }
        >
          <Ionicons
            name="camera-outline"
            size={20}
            color="#FFFFFF"
          />

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
    <View
      style={
        styles.container
      }
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F5F9FC"
      />

      {/* HEADER */}

      <View
        style={
          styles.header
        }
      >
        <Pressable
          disabled={
            isProcessing
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
            size={25}
            color="#082F56"
          />
        </Pressable>

        <View
          style={
            styles.headerCenter
          }
        >
          <Text
            style={
              styles.headerTitle
            }
          >
            Review Receipt
          </Text>

          <Text
            style={
              styles.headerSubtitle
            }
          >
            Check your receipt
            before continuing
          </Text>
        </View>

        <Pressable
          disabled={
            isProcessing
          }
          onPress={
            deleteReceipt
          }
          style={[
            styles.headerButton,
            styles.deleteHeaderButton,
          ]}
        >
          <Ionicons
            name="trash-outline"
            size={21}
            color="#B42318"
          />
        </Pressable>
      </View>

      {/* IMAGE */}

      <View
        style={
          styles.previewArea
        }
      >
        <View
          style={
            styles.receiptCard
          }
        >
          <ExpoImage
            key={
              receiptUri
            }
            source={{
              uri:
                receiptUri,
            }}
            style={
              styles.receiptImage
            }
            contentFit="contain"
            transition={0}
            cachePolicy="none"
            onLoad={
              handleImageLoad
            }
            onError={
              handleImageError
            }
          />

          {!imageLoaded &&
            !imageError &&
            !isProcessing && (
              <View
                style={
                  styles.stateOverlay
                }
              >
                <ActivityIndicator
                  size="large"
                  color="#0868AE"
                />

                <Text
                  style={
                    styles.loadingText
                  }
                >
                  Loading receipt...
                </Text>
              </View>
            )}

          {imageError && (
            <View
              style={
                styles.stateOverlay
              }
            >
              <Ionicons
                name="image-outline"
                size={48}
                color="#8CA3B5"
              />

              <Text
                style={
                  styles.imageErrorTitle
                }
              >
                Receipt preview
                unavailable
              </Text>

              <Text
                style={
                  styles.imageErrorText
                }
              >
                Retake the photo or
                choose it again from
                Gallery.
              </Text>
            </View>
          )}

          {isProcessing && (
            <View
              style={
                styles.processingOverlay
              }
            >
              <ActivityIndicator
                size="large"
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.processingText
                }
              >
                Updating receipt...
              </Text>
            </View>
          )}
        </View>

        <View
          style={
            styles.reviewNotice
          }
        >
          <Ionicons
            name="eye-outline"
            size={17}
            color="#075A98"
          />

          <Text
            style={
              styles.reviewNoticeText
            }
          >
            Make sure all receipt
            details are clearly visible
          </Text>
        </View>
      </View>

      {/* TOOLS */}

      <View
        style={
          styles.toolsCard
        }
      >
        <Text
          style={
            styles.toolsHeading
          }
        >
          Adjust Receipt
        </Text>

        <View
          style={
            styles.toolsRow
          }
        >
          <ToolButton
            icon="arrow-undo-outline"
            label="Rotate Left"
            disabled={
              isProcessing
            }
            onPress={() =>
              void rotateReceipt(
                -90,
              )
            }
          />

          <ToolButton
            icon="arrow-redo-outline"
            label="Rotate Right"
            disabled={
              isProcessing
            }
            onPress={() =>
              void rotateReceipt(
                90,
              )
            }
          />

          <ToolButton
            icon="crop-outline"
            label="Crop"
            disabled={
              isProcessing
            }
            onPress={() =>
              void cropReceipt()
            }
          />

          <ToolButton
            icon="images-outline"
            label="Replace"
            disabled={
              isProcessing
            }
            onPress={() =>
              void replaceReceipt()
            }
          />
        </View>
      </View>

      {/* BOTTOM */}

      <View
        style={
          styles.bottomBar
        }
      >
        <Pressable
          onPress={
            retakeReceipt
          }
          disabled={
            isProcessing
          }
          style={[
            styles.secondaryButton,

            isProcessing &&
              styles.disabled,
          ]}
        >
          <Ionicons
            name="camera-outline"
            size={20}
            color="#075A98"
          />

          <Text
            style={
              styles.secondaryButtonText
            }
          >
            Retake
          </Text>
        </Pressable>

        <Pressable
          onPress={
            continueToDetails
          }
          disabled={
            imageError ||
            isProcessing
          }
          style={[
            styles.primaryButton,

            (
              imageError ||
              isProcessing
            ) &&
              styles.primaryButtonDisabled,
          ]}
        >
          <Text
            style={
              styles.primaryButtonText
            }
          >
            Continue
          </Text>

          <Ionicons
            name="arrow-forward"
            size={20}
            color="#FFFFFF"
          />
        </Pressable>
      </View>

      {cropImageDimensions && (
        <ReceiptCropModal
          visible={cropModalVisible}
          imageUri={receiptUri}
          imageWidth={
            cropImageDimensions.width
          }
          imageHeight={
            cropImageDimensions.height
          }
          onCancel={handleCancelCrop}
          onApply={(region) =>
            void handleApplyCrop(
              region,
            )
          }
        />
      )}
    </View>
  );
}

type ToolButtonProps = {
  icon:
    keyof typeof Ionicons.glyphMap;

  label:
    string;

  onPress:
    () => void;

  disabled?:
    boolean;
};

function ToolButton({
  icon,
  label,
  onPress,
  disabled = false,
}: ToolButtonProps) {
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
        styles.toolButton,

        pressed &&
          !disabled &&
          styles.toolButtonPressed,

        disabled &&
          styles.disabled,
      ]}
    >
      <View
        style={
          styles.toolIconCircle
        }
      >
        <Ionicons
          name={icon}
          size={22}
          color="#075A98"
        />
      </View>

      <Text
        style={
          styles.toolLabel
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}

function getImageSize(
  uri: string,
): Promise<{
  width: number;
  height: number;
}> {
  return new Promise(
    (
      resolve,
      reject,
    ) => {
      Image.getSize(
        uri,

        (
          width,
          height,
        ) => {
          resolve({
            width,
            height,
          });
        },

        (error) => {
          reject(
            error,
          );
        },
      );
    },
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

    deleteHeaderButton: {
      backgroundColor: '#FFF0EF',
    },

    headerCenter: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: 8,
    },

    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#082F56',
    },

    headerSubtitle: {
      marginTop: 3,
      fontSize: 11,
      color: '#7890A5',
    },

    previewArea: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
      alignItems: 'center',
    },

    receiptCard: {
      width: '100%',
      flex: 1,
      minHeight: 300,
      maxHeight: 470,
      borderRadius: 22,
      overflow: 'hidden',
      backgroundColor: '#E6EDF3',
      elevation: 5,
      shadowColor: '#062E56',
      shadowOpacity: 0.11,
      shadowRadius: 15,
      shadowOffset: {
        width: 0,
        height: 7,
      },
    },

    receiptImage: {
      width: '100%',
      height: '100%',
      backgroundColor: '#E6EDF3',
    },

    stateOverlay: {
      ...StyleSheet.absoluteFill,

      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 30,
      backgroundColor: '#E6EDF3',
    },

    loadingText: {
      marginTop: 12,
      fontSize: 13,
      color: '#71889A',
    },

    imageErrorTitle: {
      marginTop: 13,
      fontSize: 16,
      fontWeight: '700',
      color: '#254B69',
    },

    imageErrorText: {
      marginTop: 7,
      maxWidth: 260,
      textAlign: 'center',
      fontSize: 12.5,
      lineHeight: 18,
      color: '#71889A',
    },

    processingOverlay: {
      ...StyleSheet.absoluteFill,

      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        'rgba(4, 32, 53, 0.56)',
    },

    processingText: {
      marginTop: 11,
      fontSize: 13,
      fontWeight: '600',
      color: '#FFFFFF',
    },

    reviewNotice: {
      marginTop: 14,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      backgroundColor: '#E6F1F9',
    },

    reviewNoticeText: {
      flex: 1,
      fontSize: 11.5,
      fontWeight: '600',
      color: '#376984',
    },

    toolsCard: {
      marginTop: 14,
      marginHorizontal: 20,
      paddingHorizontal: 14,
      paddingVertical: 15,
      borderRadius: 20,
      backgroundColor: '#FFFFFF',
      elevation: 2,
    },

    toolsHeading: {
      marginBottom: 12,
      fontSize: 14,
      fontWeight: '700',
      color: '#163F61',
    },

    toolsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },

    toolButton: {
      width: '23%',
      paddingVertical: 7,
      borderRadius: 14,
      alignItems: 'center',
    },

    toolButtonPressed: {
      backgroundColor: '#F0F6FA',
    },

    toolIconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#E5F1F9',
    },

    toolLabel: {
      marginTop: 7,
      fontSize: 10.5,
      fontWeight: '600',
      textAlign: 'center',
      color: '#4C687F',
    },

    bottomBar: {
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: 27,
      backgroundColor: '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor: '#E5EDF3',
    },

    secondaryButton: {
      flex: 0.8,
      height: 56,
      flexDirection: 'row',
      gap: 7,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#CADDEA',
      backgroundColor: '#FFFFFF',
    },

    secondaryButtonText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#075A98',
    },

    primaryButton: {
      flex: 1.2,
      height: 56,
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      backgroundColor: '#0868AE',
    },

    primaryButtonDisabled: {
      opacity: 0.45,
    },

    primaryButtonText: {
      fontSize: 15.5,
      fontWeight: '700',
      color: '#FFFFFF',
    },

    disabled: {
      opacity: 0.5,
    },

    errorScreen: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 30,
      backgroundColor: '#F5F9FC',
    },

    errorTitle: {
      marginTop: 13,
      fontSize: 20,
      fontWeight: '700',
      color: '#082F56',
    },

    errorSubtitle: {
      marginTop: 7,
      textAlign: 'center',
      fontSize: 13,
      lineHeight: 19,
      color: '#72889A',
    },

    captureAgainButton: {
      marginTop: 24,
      height: 54,
      paddingHorizontal: 23,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderRadius: 15,
      backgroundColor: '#0868AE',
    },

    captureAgainText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });