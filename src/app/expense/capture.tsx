import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  CameraType,
  CameraView,
  FlashMode,
  useCameraPermissions,
} from 'expo-camera';

import * as ImagePicker from 'expo-image-picker';

import { Ionicons } from '@expo/vector-icons';
import {
  router,
  useFocusEffect,
} from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useReceipt } from '../../context/ReceiptContext';

const isWeb =
  Platform.OS ===
  'web';

/*
 * ------------------------------------------------
 * RELEASE WEB CAMERA
 * ------------------------------------------------
 *
 * On iOS Safari / Home Screen web apps, the green
 * privacy dot and Dynamic Island camera icon stay
 * on until every MediaStreamTrack is stopped.
 * Unmounting CameraView usually does this, but we
 * also stop any leftover video streams explicitly
 * so the indicator clears as soon as we leave
 * capture.
 * ------------------------------------------------
 */
function releaseWebCameraStreams() {
  if (!isWeb) {
    return;
  }

  if (
    typeof document ===
    'undefined'
  ) {
    return;
  }

  const videos =
    document.querySelectorAll(
      'video',
    );

  videos.forEach(
    (
      video,
    ) => {
      const stream =
        (
          video as HTMLVideoElement
        )
          .srcObject;

      if (
        stream instanceof
        MediaStream
      ) {
        stream
          .getTracks()
          .forEach(
            (
              track,
            ) => {
              track.stop();
            },
          );

        (
          video as HTMLVideoElement
        ).srcObject =
          null;
      }
    },
  );
}

export default function CaptureReceiptScreen() {
  const cameraRef = useRef<CameraView | null>(null);
  const { setReceipt } = useReceipt();

  const [permission, requestPermission] =
    useCameraPermissions();

  const [facing, setFacing] =
    useState<CameraType>('back');

  const [flash, setFlash] =
    useState<FlashMode>('off');

  const [isCapturing, setIsCapturing] =
    useState(false);

  const [cameraReady, setCameraReady] =
    useState(false);

  /*
   * When false, CameraView is not rendered, which
   * triggers expo-camera's web cleanup and turns
   * off the device camera light / privacy indicator.
   */
  const [cameraActive, setCameraActive] =
    useState(true);

  /*
   * On web (esp. Android Chrome), brief focus/blur
   * flickers remount CameraView and restart
   * getUserMedia — that looks like blinking.
   * Keep the preview mounted until we leave on
   * purpose; only native uses focus teardown.
   */
  useFocusEffect(
    useCallback(
      () => {
        setCameraActive(
          true,
        );

        return () => {
          if (
            isWeb
          ) {
            return;
          }

          setCameraActive(
            false,
          );

          setCameraReady(
            false,
          );
        };
      },
      [],
    ),
  );

  useEffect(
    () => {
      return () => {
        releaseWebCameraStreams();
      };
    },
    [],
  );

  async function stopCameraAndLeave(
    next: () => void,
  ) {
    setCameraActive(
      false,
    );

    setCameraReady(
      false,
    );

    releaseWebCameraStreams();

    /*
     * Let React unmount CameraView before we
     * navigate, so the stream stops immediately.
     * Web needs a short beat so Chrome finishes
     * tearing down getUserMedia without a flash
     * loop on the next screen.
     */
    await new Promise<void>(
      (
        resolve,
      ) => {
        setTimeout(
          resolve,
          isWeb
            ? 80
            : 0,
        );
      },
    );

    next();
  }

  async function leaveCaptureForPreview() {
    await stopCameraAndLeave(
      () => {
        router.replace(
          '/expense/preview',
        );
      },
    );
  }

  if (!permission) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator
          size="large"
          color="#0A5F9E"
        />
        <Text style={styles.loadingText}>
          Preparing camera...
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionScreen}>
        <View style={styles.permissionIcon}>
          <Ionicons
            name="camera-outline"
            size={42}
            color="#0B568F"
          />
        </View>

        <Text style={styles.permissionTitle}>
          Camera Access
        </Text>

        <Text style={styles.permissionText}>
          Sky Avenir Expense needs camera access
          so you can capture your receipt.
        </Text>

        <Pressable
          onPress={requestPermission}
          style={styles.permissionButton}
        >
          <Text style={styles.permissionButtonText}>
            Allow Camera
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          style={styles.cancelPermission}
        >
          <Text style={styles.cancelPermissionText}>
            Go Back
          </Text>
        </Pressable>
      </View>
    );
  }

  async function captureReceipt() {
    if (
      !cameraRef.current ||
      !cameraReady ||
      isCapturing
    ) {
      return;
    }

    try {
      setIsCapturing(true);

      const photo =
        await cameraRef.current.takePictureAsync({
          quality: 0.9,
          skipProcessing: false,
          /*
           * Web defaults to PNG, which turns a
           * camera frame into a huge data URL.
           * Android Chrome then stalls decoding
           * it on the review screen.
           */
          ...(isWeb
            ? {
                imageType:
                  'jpg' as const,
              }
            : {}),
        });

      if (!photo?.uri) {
        throw new Error(
          'No receipt image was captured.',
        );
      }

      setReceipt({
        uri: photo.uri,
        source: 'camera',
      });

      await leaveCaptureForPreview();
    } catch (error) {
      console.error(
        'Receipt capture error:',
        error,
      );

      Alert.alert(
        'Unable to capture receipt',
        'Please try taking the photo again.',
      );
    } finally {
      setIsCapturing(false);
    }
  }

  async function chooseFromGallery() {
    try {
      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 0.9,
        });

      if (result.canceled) {
        return;
      }

      const selectedImage =
        result.assets?.[0];

      if (!selectedImage?.uri) {
        return;
      }

      setReceipt({
        uri: selectedImage.uri,
        source: 'gallery',
      });

      await leaveCaptureForPreview();
    } catch (error) {
      console.error(
        'Gallery selection error:',
        error,
      );

      Alert.alert(
        'Unable to open gallery',
        'Please try again.',
      );
    }
  }

  function toggleFlash() {
    if (isWeb) {
      return;
    }

    setFlash((current) =>
      current === 'off'
        ? 'on'
        : 'off',
    );
  }

  function flipCamera() {
    if (isWeb) {
      return;
    }

    setFacing((current) =>
      current === 'back'
        ? 'front'
        : 'back',
    );

    setCameraReady(
      false,
    );
  }

  return (
    <View style={styles.container}>
     <StatusBar
  style="light"
/>

      {cameraActive ? (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
          flash={
            isWeb
              ? 'off'
              : flash
          }
          animateShutter={
            !isWeb
          }
          onCameraReady={() =>
            setCameraReady(true)
          }
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            styles.cameraOff,
          ]}
        />
      )}

      <View style={styles.darkOverlayTop} />
      <View style={styles.darkOverlayBottom} />

      <View style={styles.header}>
        <Pressable
          onPress={() => {
            void stopCameraAndLeave(
              () => {
                router.back();
              },
            );
          }}
          style={styles.headerButton}
        >
          <Ionicons
            name="close"
            size={27}
            color="#FFFFFF"
          />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            Capture Receipt
          </Text>

          <Text style={styles.headerSubtitle}>
            Position the receipt inside the frame
          </Text>
        </View>

        {isWeb ? (
          <View
            style={
              styles.headerSpacer
            }
          />
        ) : (
          <Pressable
            onPress={toggleFlash}
            style={[
              styles.headerButton,
              flash === 'on' &&
                styles.headerButtonActive,
            ]}
          >
            <Ionicons
              name={
                flash === 'on'
                  ? 'flash'
                  : 'flash-off'
              }
              size={23}
              color="#FFFFFF"
            />
          </Pressable>
        )}
      </View>

      <View
        pointerEvents="none"
        style={styles.guideArea}
      >
        <View style={styles.receiptFrame}>
          <View style={[styles.corner, styles.cornerTopLeft]} />
          <View style={[styles.corner, styles.cornerTopRight]} />
          <View style={[styles.corner, styles.cornerBottomLeft]} />
          <View style={[styles.corner, styles.cornerBottomRight]} />

          <View style={styles.guideBadge}>
            <Ionicons
              name="receipt-outline"
              size={15}
              color="#FFFFFF"
            />
            <Text style={styles.guideBadgeText}>
              RECEIPT
            </Text>
          </View>
        </View>

        <View style={styles.tip}>
          <Ionicons
            name="sparkles-outline"
            size={16}
            color="#FFFFFF"
          />
          <Text style={styles.tipText}>
            Keep the receipt flat and well lit
          </Text>
        </View>
      </View>

      <View style={styles.bottomControls}>
        <Pressable
          onPress={chooseFromGallery}
          style={styles.sideControl}
        >
          <View style={styles.sideControlCircle}>
            <Ionicons
              name="images-outline"
              size={25}
              color="#FFFFFF"
            />
          </View>
          <Text style={styles.sideControlLabel}>
            Gallery
          </Text>
        </Pressable>

        <Pressable
          onPress={captureReceipt}
          disabled={!cameraReady || isCapturing}
          style={[
            styles.captureOuter,
            (!cameraReady || isCapturing) &&
              styles.captureDisabled,
          ]}
        >
          <View style={styles.captureMiddle}>
            {isCapturing ? (
              <ActivityIndicator
                color="#0A4E81"
                size="small"
              />
            ) : (
              <View style={styles.captureInner} />
            )}
          </View>
        </Pressable>

        <Pressable
          onPress={flipCamera}
          disabled={isWeb}
          style={[
            styles.sideControl,
            isWeb &&
              styles.sideControlHidden,
          ]}
        >
          <View style={styles.sideControlCircle}>
            <Ionicons
              name="camera-reverse-outline"
              size={27}
              color="#FFFFFF"
            />
          </View>
          <Text style={styles.sideControlLabel}>
            Flip
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cameraOff: {
    backgroundColor: '#000000',
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F9FC',
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    color: '#526D84',
  },
  permissionScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#F5F9FC',
  },
  permissionIcon: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E4F0F8',
  },
  permissionTitle: {
    marginTop: 22,
    fontSize: 27,
    fontWeight: '700',
    color: '#062E56',
  },
  permissionText: {
    marginTop: 11,
    maxWidth: 320,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 23,
    color: '#607B92',
  },
  permissionButton: {
    marginTop: 27,
    minWidth: 210,
    height: 54,
    paddingHorizontal: 28,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0769AF',
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelPermission: {
    marginTop: 18,
    padding: 10,
  },
  cancelPermissionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#58748A',
  },
  darkOverlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
    backgroundColor: 'rgba(3, 19, 32, 0.42)',
  },
  darkOverlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 210,
    backgroundColor: 'rgba(3, 19, 32, 0.60)',
  },
  header: {
    position: 'absolute',
    top: 49,
    left: 18,
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 45,
    height: 45,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  headerSpacer: {
    width: 45,
    height: 45,
  },
  headerButtonActive: {
    backgroundColor: 'rgba(211, 164, 61, 0.82)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    marginTop: 3,
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.76)',
  },
  guideArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 31,
    paddingTop: 40,
    paddingBottom: 150,
  },
  receiptFrame: {
    width: '100%',
    maxWidth: 360,
    aspectRatio: 0.73,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  corner: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderColor: '#FFFFFF',
  },
  cornerTopLeft: {
    top: -1,
    left: -1,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 18,
  },
  cornerTopRight: {
    top: -1,
    right: -1,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 18,
  },
  cornerBottomLeft: {
    bottom: -1,
    left: -1,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 18,
  },
  cornerBottomRight: {
    bottom: -1,
    right: -1,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 18,
  },
  guideBadge: {
    position: 'absolute',
    top: 15,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  guideBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: '#FFFFFF',
  },
  tip: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.30)',
  },
  tipText: {
    fontSize: 12.5,
    color: '#FFFFFF',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 34,
    left: 26,
    right: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sideControl: {
    width: 72,
    alignItems: 'center',
  },
  sideControlHidden: {
    opacity: 0,
  },
  sideControlCircle: {
    width: 49,
    height: 49,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  sideControlLabel: {
    marginTop: 7,
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.88)',
  },
  captureOuter: {
    width: 83,
    height: 83,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  captureMiddle: {
    width: 67,
    height: 67,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  captureInner: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D5E1E9',
  },
  captureDisabled: {
    opacity: 0.6,
  },
});
