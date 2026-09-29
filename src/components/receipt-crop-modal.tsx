/* eslint-disable react-hooks/refs -- this component uses the standard,
   safe React Native "ref-backed PanResponder" gesture pattern throughout
   (refs written during render to stay current for long-lived, once-created
   gesture handlers; PanResponders read those refs only inside their own
   grant/move callbacks, never during render). See the comment above
   `rectRef` below for details. */
import { useRef, useState } from 'react';

import { Ionicons } from '@expo/vector-icons';

import {
  Dimensions,
  Image,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { GestureResponderEvent, ImageStyle, PanResponderGestureState } from 'react-native';

/*
 * ------------------------------------------------
 * REGION (in ORIGINAL image pixels)
 * ------------------------------------------------
 */
export type CropRegion = {
  originX: number;
  originY: number;
  width: number;
  height: number;
};

type DisplayRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Corner = 'tl' | 'tr' | 'bl' | 'br';

type ReceiptCropModalProps = {
  visible: boolean;
  imageUri: string;
  imageWidth: number;
  imageHeight: number;
  onCancel: () => void;
  onApply: (region: CropRegion) => void;
};

const HANDLE_HIT_SIZE = 40;
const HANDLE_VISUAL_SIZE = 20;
const MIN_CROP_SIZE = 48;
const STAGE_PADDING = 24;

function clamp(
  value: number,
  min: number,
  max: number,
): number {
  return Math.min(
    Math.max(
      value,
      min,
    ),
    max,
  );
}

/*
 * ------------------------------------------------
 * INTERACTIVE CROP MODAL
 * ------------------------------------------------
 *
 * A free-form drag-to-resize / drag-to-move crop
 * rectangle over the receipt image, similar to a
 * normal photo editor. Replaces the old fixed
 * "Light Crop / Tight Crop" percentage choice.
 * ------------------------------------------------
 */
export function ReceiptCropModal({
  visible,
  imageUri,
  imageWidth,
  imageHeight,
  onCancel,
  onApply,
}: ReceiptCropModalProps) {
  const window = Dimensions.get('window');

  const stageWidth =
    window.width - STAGE_PADDING * 2;

  const stageHeight =
    window.height * 0.54;

  const safeImageWidth =
    imageWidth > 0 ? imageWidth : 1;

  const safeImageHeight =
    imageHeight > 0 ? imageHeight : 1;

  const imageAspect =
    safeImageWidth / safeImageHeight;

  let displayWidth = stageWidth;
  let displayHeight = displayWidth / imageAspect;

  if (displayHeight > stageHeight) {
    displayHeight = stageHeight;
    displayWidth = displayHeight * imageAspect;
  }

  const [rect, setRect] = useState<DisplayRect>(
    () => {
      const inset = 0.08;

      return {
        x: displayWidth * inset,
        y: displayHeight * inset,
        width: displayWidth * (1 - inset * 2),
        height: displayHeight * (1 - inset * 2),
      };
    },
  );

  const gestureStartRect =
    useRef<DisplayRect>(rect);

  /*
   * Always-current values for use inside the
   * PanResponder callbacks below. The responders
   * are created ONCE (see useRef(...).current
   * pattern further down) so they must read fresh
   * state via refs rather than via render-time
   * closures, otherwise drags would use stale
   * dimensions/positions and recreating a brand
   * new PanResponder on every touch-move (as this
   * previously did) caused visible stutter/glitching.
   *
   * NOTE: this whole component relies on the
   * standard React Native "ref-backed PanResponder"
   * pattern, which the newer `react-hooks/refs`
   * (React Compiler) lint rule flags aggressively
   * (writing to a ref during render, and reading
   * `.current` at all, even for long-lived gesture
   * handlers created exactly once via `useRef`). This
   * is a well-established, safe pattern for gesture
   * handling in React Native, so the rule is disabled
   * for this file rather than sprinkling dozens of
   * per-line suppressions across it.
   */
  const rectRef =
    useRef<DisplayRect>(rect);

  rectRef.current = rect;

  const stageSizeRef =
    useRef({
      displayWidth,
      displayHeight,
    });

  stageSizeRef.current = {
    displayWidth,
    displayHeight,
  };

  function resetRect() {
    const inset = 0.08;

    setRect({
      x: displayWidth * inset,
      y: displayHeight * inset,
      width: displayWidth * (1 - inset * 2),
      height: displayHeight * (1 - inset * 2),
    });
  }

  /*
   * ------------------------------------------------
   * BODY DRAG (move the whole rectangle)
   * ------------------------------------------------
   */
  const bodyPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        gestureStartRect.current =
          rectRef.current;
      },

      onPanResponderMove: (
        _event: GestureResponderEvent,
        gesture: PanResponderGestureState,
      ) => {
        const start =
          gestureStartRect.current;

        const {
          displayWidth:
            stageWidthNow,
          displayHeight:
            stageHeightNow,
        } = stageSizeRef.current;

        const nextX = clamp(
          start.x + gesture.dx,
          0,
          stageWidthNow - start.width,
        );

        const nextY = clamp(
          start.y + gesture.dy,
          0,
          stageHeightNow - start.height,
        );

        setRect({
          x: nextX,
          y: nextY,
          width: start.width,
          height: start.height,
        });
      },
    }),
  ).current;

  /*
   * ------------------------------------------------
   * CORNER HANDLES (resize)
   * ------------------------------------------------
   */
  function createCornerResponder(
    corner: Corner,
  ) {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        gestureStartRect.current =
          rectRef.current;
      },

      onPanResponderMove: (
        _event: GestureResponderEvent,
        gesture: PanResponderGestureState,
      ) => {
        const start =
          gestureStartRect.current;

        const {
          displayWidth:
            stageWidthNow,
          displayHeight:
            stageHeightNow,
        } = stageSizeRef.current;

        let left = start.x;
        let top = start.y;
        let right =
          start.x + start.width;
        let bottom =
          start.y + start.height;

        if (
          corner === 'tl' ||
          corner === 'bl'
        ) {
          left = clamp(
            start.x + gesture.dx,
            0,
            right - MIN_CROP_SIZE,
          );
        }

        if (
          corner === 'tr' ||
          corner === 'br'
        ) {
          right = clamp(
            right + gesture.dx,
            left + MIN_CROP_SIZE,
            stageWidthNow,
          );
        }

        if (
          corner === 'tl' ||
          corner === 'tr'
        ) {
          top = clamp(
            start.y + gesture.dy,
            0,
            bottom - MIN_CROP_SIZE,
          );
        }

        if (
          corner === 'bl' ||
          corner === 'br'
        ) {
          bottom = clamp(
            bottom + gesture.dy,
            top + MIN_CROP_SIZE,
            stageHeightNow,
          );
        }

        setRect({
          x: left,
          y: top,
          width: right - left,
          height: bottom - top,
        });
      },
    });
  }

  const cornerResponders = useRef({
    tl: createCornerResponder('tl'),
    tr: createCornerResponder('tr'),
    bl: createCornerResponder('bl'),
    br: createCornerResponder('br'),
  }).current;

  /*
   * ------------------------------------------------
   * APPLY (display space -> original pixels)
   * ------------------------------------------------
   */
  function handleApply() {
    const scaleX =
      safeImageWidth / displayWidth;

    const scaleY =
      safeImageHeight / displayHeight;

    const originX = Math.max(
      0,
      Math.round(rect.x * scaleX),
    );

    const originY = Math.max(
      0,
      Math.round(rect.y * scaleY),
    );

    const width = Math.min(
      Math.round(rect.width * scaleX),
      safeImageWidth - originX,
    );

    const height = Math.min(
      Math.round(rect.height * scaleY),
      safeImageHeight - originY,
    );

    if (
      width <= 0 ||
      height <= 0
    ) {
      return;
    }

    onApply({
      originX,
      originY,
      width,
      height,
    });
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.header}>
          <Text style={styles.title}>
            Adjust Crop
          </Text>

          <Text style={styles.subtitle}>
            Drag the corners or move the box
            over the area you want to keep
          </Text>
        </View>

        <View
          style={[
            styles.stage,
            {
              width: displayWidth,
              height: displayHeight,
            },
          ]}
        >
          <Image
            source={{ uri: imageUri }}
            resizeMode="contain"
            style={[
              {
                width: displayWidth,
                height: displayHeight,
              },
              // Web only: stop the browser's native
              // image drag-ghost from hijacking touches
              // meant for the custom crop gesture. Not
              // part of RN's ImageStyle typings, so cast
              // through `unknown` for web-only CSS passthrough.
              Platform.OS === 'web'
                ? ({
                    userSelect: 'none',
                    WebkitUserDrag: 'none',
                    WebkitTouchCallout: 'none',
                  } as unknown as ImageStyle)
                : null,
            ]}
          />

          {/* DIM MASK OUTSIDE THE CROP RECT */}

          <View
            pointerEvents="none"
            style={[
              styles.mask,
              {
                left: 0,
                top: 0,
                width: displayWidth,
                height: rect.y,
              },
            ]}
          />

          <View
            pointerEvents="none"
            style={[
              styles.mask,
              {
                left: 0,
                top: rect.y + rect.height,
                width: displayWidth,
                height:
                  displayHeight -
                  (rect.y + rect.height),
              },
            ]}
          />

          <View
            pointerEvents="none"
            style={[
              styles.mask,
              {
                left: 0,
                top: rect.y,
                width: rect.x,
                height: rect.height,
              },
            ]}
          />

          <View
            pointerEvents="none"
            style={[
              styles.mask,
              {
                left: rect.x + rect.width,
                top: rect.y,
                width:
                  displayWidth -
                  (rect.x + rect.width),
                height: rect.height,
              },
            ]}
          />

          {/* CROP RECT (drag to move) */}

          <View
            {...bodyPanResponder.panHandlers}
            style={[
              styles.cropRect,
              {
                left: rect.x,
                top: rect.y,
                width: rect.width,
                height: rect.height,
              },
            ]}
          >
            <View style={styles.gridLineVertical1} />
            <View style={styles.gridLineVertical2} />
            <View style={styles.gridLineHorizontal1} />
            <View style={styles.gridLineHorizontal2} />
          </View>

          {/* CORNER HANDLES (drag to resize) */}

          <View
            {...cornerResponders.tl.panHandlers}
            style={[
              styles.handleHit,
              {
                left:
                  rect.x -
                  HANDLE_HIT_SIZE / 2,
                top:
                  rect.y -
                  HANDLE_HIT_SIZE / 2,
              },
            ]}
          >
            <View
              style={[
                styles.handleVisual,
                styles.handleTopLeft,
              ]}
            />
          </View>

          <View
            {...cornerResponders.tr.panHandlers}
            style={[
              styles.handleHit,
              {
                left:
                  rect.x +
                  rect.width -
                  HANDLE_HIT_SIZE / 2,
                top:
                  rect.y -
                  HANDLE_HIT_SIZE / 2,
              },
            ]}
          >
            <View
              style={[
                styles.handleVisual,
                styles.handleTopRight,
              ]}
            />
          </View>

          <View
            {...cornerResponders.bl.panHandlers}
            style={[
              styles.handleHit,
              {
                left:
                  rect.x -
                  HANDLE_HIT_SIZE / 2,
                top:
                  rect.y +
                  rect.height -
                  HANDLE_HIT_SIZE / 2,
              },
            ]}
          >
            <View
              style={[
                styles.handleVisual,
                styles.handleBottomLeft,
              ]}
            />
          </View>

          <View
            {...cornerResponders.br.panHandlers}
            style={[
              styles.handleHit,
              {
                left:
                  rect.x +
                  rect.width -
                  HANDLE_HIT_SIZE / 2,
                top:
                  rect.y +
                  rect.height -
                  HANDLE_HIT_SIZE / 2,
              },
            ]}
          >
            <View
              style={[
                styles.handleVisual,
                styles.handleBottomRight,
              ]}
            />
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={onCancel}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>
              Cancel
            </Text>
          </Pressable>

          <Pressable
            onPress={resetRect}
            style={styles.secondaryButton}
          >
            <Ionicons
              name="refresh-outline"
              size={16}
              color="#0B3558"
            />

            <Text style={styles.secondaryButtonText}>
              Reset
            </Text>
          </Pressable>

          <Pressable
            onPress={handleApply}
            style={styles.primaryButton}
          >
            <Ionicons
              name="checkmark"
              size={18}
              color="#FFFFFF"
            />

            <Text style={styles.primaryButtonText}>
              Apply Crop
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(3, 14, 26, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: STAGE_PADDING,
  },
  header: {
    marginBottom: 18,
    alignItems: 'center',
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitle: {
    marginTop: 6,
    maxWidth: 300,
    textAlign: 'center',
    fontSize: 12.5,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.7)',
  },
  stage: {
    position: 'relative',
    backgroundColor: '#000000',
    // Web only: prevent the browser's native long-press image
    // menu / text-selection / drag-ghost from hijacking touches
    // that are meant to drive the custom crop gesture.
    ...(Platform.OS === 'web'
      ? {
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
        }
      : null),
  },
  mask: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  cropRect: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  gridLineVertical1: {
    position: 'absolute',
    left: '33.33%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  gridLineVertical2: {
    position: 'absolute',
    left: '66.66%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  gridLineHorizontal1: {
    position: 'absolute',
    top: '33.33%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  gridLineHorizontal2: {
    position: 'absolute',
    top: '66.66%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  handleHit: {
    position: 'absolute',
    width: HANDLE_HIT_SIZE,
    height: HANDLE_HIT_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleVisual: {
    width: HANDLE_VISUAL_SIZE,
    height: HANDLE_VISUAL_SIZE,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#0868AE',
  },
  handleTopLeft: {},
  handleTopRight: {},
  handleBottomLeft: {},
  handleBottomRight: {},
  actions: {
    marginTop: 22,
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0B3558',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#0868AE',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
