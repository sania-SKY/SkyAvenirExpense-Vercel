import {
  Platform,
} from 'react-native';

/*
 * ------------------------------------------------
 * BLURRY RECEIPT MARKER
 * ------------------------------------------------
 *
 * Stored on the expense as external_error when a
 * receipt fails the blur check so detail screens
 * can show a clear retake message.
 * ------------------------------------------------
 */
export const BLURRY_RECEIPT_MESSAGE =
  'This image is blurry. Please retake a clear photo of this receipt.';

/*
 * Center-crop Laplacian variance below this is
 * treated as soft. Receipts keep text contrast
 * even when soft, so the old full-frame 110 cut
 * often missed blurry tickets while flagging
 * beds / keyboards.
 */
const CENTER_LAPLACIAN_THRESHOLD =
  260;

/*
 * If a light re-blur barely changes the score,
 * the photo was already soft (ratio near 1).
 * Clear text drops more after re-blur.
 */
const REBLUR_RATIO_THRESHOLD =
  0.75;

/*
 * The re-blur check also runs on photos that
 * look only "okay", not just those below the
 * main cut.
 */
const REBLUR_SCORE_CAP =
  380;

export type BlurAssessment = {
  isBlurry:
    boolean;

  score:
    number;
};

/*
 * ------------------------------------------------
 * ASSESS RECEIPT BLUR
 * ------------------------------------------------
 *
 * Web-only: loads the image into a canvas and
 * measures center-region sharpness (higher =
 * sharper). On native we skip detection and
 * treat the image as sharp so capture is never
 * blocked offline.
 * ------------------------------------------------
 */
export async function assessReceiptBlur(
  imageUri:
    string,
): Promise<BlurAssessment> {
  if (
    Platform.OS !==
    'web'
  ) {
    return {
      isBlurry:
        false,

      score:
        Number.POSITIVE_INFINITY,
    };
  }

  if (
    typeof document ===
    'undefined'
  ) {
    return {
      isBlurry:
        false,

      score:
        Number.POSITIVE_INFINITY,
    };
  }

  try {
    const image =
      await loadHtmlImage(
        imageUri,
      );

    const assessment =
      measureReceiptSharpness(
        image,
      );

    return assessment;
  } catch (error) {
    console.error(
      'Receipt blur assessment failed:',
      error,
    );

    return {
      isBlurry:
        false,

      score:
        Number.POSITIVE_INFINITY,
    };
  }
}

function loadHtmlImage(
  uri:
    string,
): Promise<HTMLImageElement> {
  return new Promise(
    (
      resolve,
      reject,
    ) => {
      const image =
        document.createElement(
          'img',
        );

      image.crossOrigin =
        'anonymous';

      image.onload =
        () => {
          resolve(
            image,
          );
        };

      image.onerror =
        () => {
          reject(
            new Error(
              'Unable to load receipt for blur check.',
            ),
          );
        };

      image.src =
        uri;
    },
  );
}

function measureReceiptSharpness(
  image:
    HTMLImageElement,
): BlurAssessment {
  const maxEdge =
    360;

  const scale =
    Math.min(
      1,
      maxEdge /
        Math.max(
          image.width,
          image.height,
        ),
    );

  const width =
    Math.max(
      1,
      Math.round(
        image.width *
          scale,
      ),
    );

  const height =
    Math.max(
      1,
      Math.round(
        image.height *
          scale,
      ),
    );

  const canvas =
    document.createElement(
      'canvas',
    );

  canvas.width =
    width;

  canvas.height =
    height;

  const context =
    canvas.getContext(
      '2d',
      {
        willReadFrequently:
          true,
      },
    );

  if (!context) {
    return {
      isBlurry:
        false,

      score:
        Number.POSITIVE_INFINITY,
    };
  }

  context.drawImage(
    image,
    0,
    0,
    width,
    height,
  );

  const {
    data,
  } =
    context.getImageData(
      0,
      0,
      width,
      height,
    );

  const gray =
    toGrayscale(
      data,
      width,
      height,
    );

  /*
   * Focus on the middle of the frame where
   * receipt text usually sits. Outer edges
   * (hands, table, paper border) inflate
   * sharpness and hide soft text.
   */
  const insetX =
    Math.floor(
      width * 0.18,
    );

  const insetY =
    Math.floor(
      height * 0.16,
    );

  const centerScore =
    laplacianVariance(
      gray,
      width,
      height,
      insetX,
      insetY,
      width -
        insetX,
      height -
        insetY,
    );

  const blurredGray =
    boxBlur3x3(
      gray,
      width,
      height,
    );

  const reblurScore =
    laplacianVariance(
      blurredGray,
      width,
      height,
      insetX,
      insetY,
      width -
        insetX,
      height -
        insetY,
    );

  const reblurRatio =
    centerScore <=
    0
      ? 1
      : reblurScore /
        centerScore;

  /*
   * Soft receipts often still clear the old
   * full-frame cut because text contrast stays
   * high. Flag when:
   * - center text region is soft, or
   * - score is only "okay" but a re-blur barely
   *   changes it (already soft).
   */
  const isBlurry =
    centerScore <
      CENTER_LAPLACIAN_THRESHOLD ||
    (centerScore <
      REBLUR_SCORE_CAP &&
      reblurRatio >
        REBLUR_RATIO_THRESHOLD);

  return {
    isBlurry,

    score:
      centerScore,
  };
}

function toGrayscale(
  data:
    Uint8ClampedArray,
  width:
    number,
  height:
    number,
): Float32Array {
  const gray =
    new Float32Array(
      width *
        height,
    );

  for (
    let i =
      0;
    i <
    gray.length;
    i +=
      1
  ) {
    const offset =
      i *
      4;

    gray[i] =
      0.299 *
        data[
          offset
        ] +
      0.587 *
        data[
          offset +
            1
        ] +
      0.114 *
        data[
          offset +
            2
        ];
  }

  return gray;
}

function boxBlur3x3(
  source:
    Float32Array,
  width:
    number,
  height:
    number,
): Float32Array {
  const output =
    new Float32Array(
      source.length,
    );

  for (
    let y =
      0;
    y <
    height;
    y +=
      1
  ) {
    for (
      let x =
        0;
      x <
      width;
      x +=
        1
    ) {
      let sum =
        0;

      let count =
        0;

      for (
        let dy =
          -1;
        dy <=
        1;
        dy +=
          1
      ) {
        const yy =
          y +
          dy;

        if (
          yy <
            0 ||
          yy >=
            height
        ) {
          continue;
        }

        for (
          let dx =
            -1;
          dx <=
          1;
          dx +=
            1
        ) {
          const xx =
            x +
            dx;

          if (
            xx <
              0 ||
            xx >=
              width
          ) {
            continue;
          }

          sum +=
            source[
              yy *
                width +
                xx
            ];

          count +=
            1;
        }
      }

      output[
        y *
          width +
          x
      ] =
        sum /
        count;
    }
  }

  return output;
}

function laplacianVariance(
  gray:
    Float32Array,
  width:
    number,
  height:
    number,
  left:
    number,
  top:
    number,
  right:
    number,
  bottom:
    number,
): number {
  const startX =
    Math.max(
      1,
      left,
    );

  const startY =
    Math.max(
      1,
      top,
    );

  const endX =
    Math.min(
      width -
        1,
      right,
    );

  const endY =
    Math.min(
      height -
        1,
      bottom,
    );

  let sum =
    0;

  let sumSquares =
    0;

  let count =
    0;

  for (
    let y =
      startY;
    y <
    endY;
    y +=
      1
  ) {
    for (
      let x =
        startX;
      x <
      endX;
      x +=
        1
    ) {
      const index =
        y *
          width +
        x;

      const lap =
        gray[
          index -
            width
        ] +
        gray[
          index +
            width
        ] +
        gray[
          index -
            1
        ] +
        gray[
          index +
            1
        ] -
        4 *
          gray[
            index
          ];

      sum +=
        lap;

      sumSquares +=
        lap *
        lap;

      count +=
        1;
    }
  }

  if (
    count ===
    0
  ) {
    return 0;
  }

  const mean =
    sum /
    count;

  return (
    sumSquares /
      count -
    mean *
      mean
  );
}

export function isBlurryReceiptError(
  message:
    string | null | undefined,
): boolean {
  if (!message) {
    return false;
  }

  const lower =
    message.toLowerCase();

  return (
    lower.includes(
      'blurry',
    ) ||
    lower.includes(
      'blur',
    )
  );
}
