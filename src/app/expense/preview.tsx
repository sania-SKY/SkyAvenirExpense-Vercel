import { useState } from 'react';

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { useReceipt } from '../../context/ReceiptContext';

export default function ReceiptPreviewScreen() {
  const {
    receipt,
    setReceipt,
    updateReceiptUri,
    clearReceipt,
  } = useReceipt();

  const [imageLoaded, setImageLoaded] =
    useState(false);

  const [imageError, setImageError] =
    useState(false);

  const [isProcessing, setIsProcessing] =
    useState(false);

  const receiptUri = receipt?.uri ?? '';

  async function rotateReceipt(degrees: number) {
    if (!receiptUri || isProcessing) {
      return;
    }

    try {
      setIsProcessing(true);

      const saved =
  await ImageManipulator.manipulateAsync(
    receiptUri,
    [
      {
        rotate: degrees,
      },
    ],
    {
      compress: 0.92,
      format:
        ImageManipulator.SaveFormat
          .JPEG,
    },
  );

updateReceiptUri(saved.uri);

      setImageLoaded(false);
      setImageError(false);

      updateReceiptUri(saved.uri);
    } catch (error) {
      console.error('Rotate error:', error);

      Alert.alert(
        'Unable to rotate receipt',
        'Please try again.',
      );
    } finally {
      setIsProcessing(false);
    }
  }

  async function replaceReceipt() {
    try {
      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 0.92,
        });

      if (result.canceled) {
        return;
      }

      const selected =
        result.assets?.[0];

      if (!selected?.uri) {
        return;
      }

      setImageLoaded(false);
      setImageError(false);

      setReceipt({
        uri: selected.uri,
        source: 'gallery',
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

  function openCropInfo() {
    Alert.alert(
      'Crop',
      'The dedicated crop editor is the next step. For now, use Retake or Replace if the receipt is not framed correctly.',
    );
  }

  function deleteReceipt() {
    Alert.alert(
      'Remove receipt?',
      'This receipt will be discarded.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            clearReceipt();
            router.replace('/expense/capture');
          },
        },
      ],
    );
  }

  function retakeReceipt() {
    clearReceipt();
    router.replace('/expense/capture');
  }

  function continueToDetails() {
    if (
      !receiptUri ||
      !imageLoaded ||
      imageError ||
      isProcessing
    ) {
      return;
    }

    router.push('/expense/submit');
  }

  if (!receiptUri) {
    return (
      <View style={styles.errorScreen}>
        <Ionicons
          name="image-outline"
          size={54}
          color="#8CA3B5"
        />

        <Text style={styles.errorTitle}>
          Receipt not available
        </Text>

        <Text style={styles.errorSubtitle}>
          Capture a receipt or choose one from
          your gallery to continue.
        </Text>

        <Pressable
          onPress={() =>
            router.replace('/expense/capture')
          }
          style={styles.captureAgainButton}
        >
          <Ionicons
            name="camera-outline"
            size={20}
            color="#FFFFFF"
          />

          <Text style={styles.captureAgainText}>
            Capture Receipt
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        style="dark"
        backgroundColor="#F5F9FC"
      />

      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Ionicons
            name="chevron-back"
            size={25}
            color="#082F56"
          />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            Review Receipt
          </Text>

          <Text style={styles.headerSubtitle}>
            Check your receipt before continuing
          </Text>
        </View>

        <Pressable
          onPress={deleteReceipt}
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

      <View style={styles.previewArea}>
        <View style={styles.receiptCard}>
          <Image
            key={receiptUri}
            source={{ uri: receiptUri }}
            style={styles.receiptImage}
            resizeMode="contain"
            onLoadStart={() => {
              setImageLoaded(false);
              setImageError(false);
            }}
            onLoad={() => {
              setImageLoaded(true);
              setImageError(false);
            }}
            onError={(event) => {
              console.error(
                'Receipt image failed:',
                event.nativeEvent.error,
              );

              console.log(
                'Failed receipt URI:',
                receiptUri,
              );

              setImageLoaded(false);
              setImageError(true);
            }}
          />

          {!imageLoaded && !imageError && (
            <View style={styles.stateOverlay}>
              <ActivityIndicator
                size="large"
                color="#0868AE"
              />
              <Text style={styles.loadingText}>
                Loading receipt...
              </Text>
            </View>
          )}

          {imageError && (
            <View style={styles.stateOverlay}>
              <Ionicons
                name="image-outline"
                size={48}
                color="#8CA3B5"
              />

              <Text style={styles.imageErrorTitle}>
                Receipt preview unavailable
              </Text>

              <Text style={styles.imageErrorText}>
                Retake the photo or choose it
                again from Gallery.
              </Text>
            </View>
          )}

          {isProcessing && (
            <View
              style={styles.processingOverlay}
            >
              <ActivityIndicator
                size="large"
                color="#FFFFFF"
              />

              <Text style={styles.processingText}>
                Updating receipt...
              </Text>
            </View>
          )}
        </View>

        <View style={styles.reviewNotice}>
          <Ionicons
            name="eye-outline"
            size={17}
            color="#075A98"
          />

          <Text style={styles.reviewNoticeText}>
            Make sure all receipt details are
            clearly visible
          </Text>
        </View>
      </View>

      <View style={styles.toolsCard}>
        <Text style={styles.toolsHeading}>
          Adjust Receipt
        </Text>

        <View style={styles.toolsRow}>
          <ToolButton
            icon="arrow-undo-outline"
            label="Rotate Left"
            onPress={() => rotateReceipt(-90)}
          />

          <ToolButton
            icon="arrow-redo-outline"
            label="Rotate Right"
            onPress={() => rotateReceipt(90)}
          />

          <ToolButton
            icon="crop-outline"
            label="Crop"
            onPress={openCropInfo}
          />

          <ToolButton
            icon="images-outline"
            label="Replace"
            onPress={replaceReceipt}
          />
        </View>
      </View>

      <View style={styles.bottomBar}>
        <Pressable
          onPress={retakeReceipt}
          style={styles.secondaryButton}
        >
          <Ionicons
            name="camera-outline"
            size={20}
            color="#075A98"
          />

          <Text
            style={styles.secondaryButtonText}
          >
            Retake
          </Text>
        </Pressable>

        <Pressable
          onPress={continueToDetails}
          disabled={
            !imageLoaded ||
            imageError ||
            isProcessing
          }
          style={[
            styles.primaryButton,
            (!imageLoaded ||
              imageError ||
              isProcessing) &&
              styles.primaryButtonDisabled,
          ]}
        >
          <Text
            style={styles.primaryButtonText}
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
    </View>
  );
}

type ToolButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
};

function ToolButton({
  icon,
  label,
  onPress,
}: ToolButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.toolButton,
        pressed &&
          styles.toolButtonPressed,
      ]}
    >
      <View style={styles.toolIconCircle}>
        <Ionicons
          name={icon}
          size={22}
          color="#075A98"
        />
      </View>

      <Text style={styles.toolLabel}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
    ...StyleSheet.absoluteFillObject,
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
    ...StyleSheet.absoluteFillObject,
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
