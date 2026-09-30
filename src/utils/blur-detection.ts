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
 * Laplacian variance below this is treated as
 * blurry. Tuned for typical phone receipt photos
 * after downscaling to ~320px on the long edge.
 */
const BLUR_VARIANCE_THRESHOLD =
  110;

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
 * measures Laplacian variance (higher = sharper).
 * On native we skip detection and treat the image
 * as sharp so capture is never blocked offline.
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

    const score =
      computeLaplacianVariance(
        image,
      );

    return {
      isBlurry:
        score <
        BLUR_VARIANCE_THRESHOLD,

      score,
    };
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

function computeLaplacianVariance(
  image:
    HTMLImageElement,
): number {
  const maxEdge =
    320;

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
    return Number.POSITIVE_INFINITY;
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

  let sum =
    0;

  let sumSquares =
    0;

  let count =
    0;

  for (
    let y =
      1;
    y <
    height -
      1;
    y +=
      1
  ) {
    for (
      let x =
        1;
      x <
      width -
        1;
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
