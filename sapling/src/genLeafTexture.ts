import Prando from 'prando';
import { Box2, Color } from 'three';
import { LeafSplineSegment, LeafStamp, TwigStem } from './leaf';

enum GradientDirection {
  Lateral = 0,
  Axial = 1,
}

interface LeafImageProps {
  innerColor: number,
  outerColor: number,
  stemColor: number,
  gradientDirection: number;
  variation: number;
}

const showGrid = false;

export function drawLeafTexture(
  canvas: HTMLCanvasElement,
  leaf: LeafSplineSegment[],
  stamps: LeafStamp[],
  twigStems: TwigStem[],
  bounds: Box2,
  rnd: Prando,
  props: LeafImageProps
) {
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.resetTransform();
    ctx.globalAlpha = 0;
    ctx.clearRect(0, 0, 128, 128);

    if (showGrid) {
      ctx.globalAlpha = 1;
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = 'green';

      for (let x = 0; x <= 128; x += 32) {
        ctx.strokeRect(x, 0, x, 128);
      }
      for (let z = 0; z <= 128; z += 32) {
        ctx.strokeRect(0, z, 128, z);
      }
    }

    let maxWidth = 0;
    let maxLength = 0;
    leaf.forEach(l => {
      maxWidth = Math.max(maxWidth, l.x0, l.x1, l.x2, l.x3);
      maxLength = Math.max(maxLength, l.y0, l.y1, l.y2, l.y3);
    });

    const sx = 128 / (bounds.max.x - bounds.min.x);
    const sy = 128 / (bounds.max.y - bounds.min.y);

    // ctx.strokeStyle = 'yellow';
    // ctx.transform(sx, 0, 0, sy, -(bounds.min.x * sx), -(bounds.min.y * sy));
    // ctx.strokeRect(
    //   bounds.min.x,
    //   bounds.min.y,
    //   bounds.max.x - bounds.min.x,
    //   bounds.max.y - bounds.min.y
    // );

    // Outline styles.
    ctx.strokeStyle = 'black';
    ctx.fillStyle = 'blue';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.globalAlpha = 1;
    ctx.lineWidth = 6.0;

    // Stroke stem
    ctx.resetTransform();
    ctx.transform(sx, 0, 0, sy, -(bounds.min.x * sx), -(bounds.min.y * sy));
    drawTwigPath(ctx, twigStems);
    ctx.lineWidth = 6;
    ctx.stroke();
    // for (const stem of twigStems) {
    //   ctx.lineWidth = stem.width + 4;
    //   // ctx.transform(1, 0, 0, 1, -(bounds.min.x), -(bounds.min.y));
    //   ctx.stroke();
    // }

    // Draw outline around leaves
    for (const stamp of stamps) {
      ctx.resetTransform();
      ctx.transform(sx, 0, 0, sy, -(bounds.min.x * sx), -(bounds.min.y * sy));
      ctx.translate(stamp.translate.x, stamp.translate.y);
      ctx.scale(stamp.scale, stamp.scale);
      ctx.rotate(stamp.angle);
      ctx.lineWidth = 2.0 / stamp.scale;
      drawLeafPath(ctx, leaf);
      ctx.stroke();
    }

    // Fill stem
    ctx.lineWidth = 3.0;
    ctx.strokeStyle = new Color(props.stemColor).getStyle();
    ctx.resetTransform();
    ctx.transform(sx, 0, 0, sy, -(bounds.min.x * sx), -(bounds.min.y * sy));
    drawTwigPath(ctx, twigStems);
    ctx.lineWidth = 4;
    ctx.stroke();
    // for (const stem of twigStems) {
    // }

    for (const stamp of stamps) {
      const innerColor = new Color(props.innerColor).convertLinearToSRGB();
      const outerColor = new Color(props.outerColor).convertLinearToSRGB();

      const hueOffset = props.variation * rnd.next(-1, 1) * 0.4;
      const lightnessOffset = props.variation * rnd.next(-1, 1) * 0.4;
      innerColor.offsetHSL(hueOffset, 0, lightnessOffset);
      outerColor.offsetHSL(hueOffset, 0, lightnessOffset);

      // Fill leafs with gradient colors
      let gradient: CanvasGradient;
      if (props.gradientDirection === GradientDirection.Axial) {
        gradient = ctx.createLinearGradient(0, 0, 0, maxLength);
        gradient.addColorStop(0, innerColor.getStyle());
        gradient.addColorStop(1, outerColor.getStyle());
      } else {
        gradient = ctx.createLinearGradient(-maxWidth * 0.6, 0, maxWidth * 0.6, 0);
        // const gradient1 = ctx.createLinearGradient(0, 0, 0, maxLength);
        gradient.addColorStop(0, outerColor.getStyle());
        gradient.addColorStop(0.5, innerColor.getStyle());
        gradient.addColorStop(0.5, innerColor.getStyle());
        gradient.addColorStop(1, outerColor.getStyle());
      }

      ctx.resetTransform();
      ctx.transform(sx, 0, 0, sy, -(bounds.min.x * sx), -(bounds.min.y * sy));
      ctx.translate(stamp.translate.x, stamp.translate.y);
      ctx.scale(stamp.scale, stamp.scale);
      ctx.rotate(stamp.angle);
      ctx.fillStyle = gradient;
      ctx.strokeStyle = '#00000044';
      ctx.lineWidth = 2.0 / stamp.scale;
      drawLeafPath(ctx, leaf, 'both');
      ctx.stroke();
      ctx.fill();
    }
  }
}

function drawLeafPath(
  ctx: CanvasRenderingContext2D,
  segments: LeafSplineSegment[],
  side: 'left' | 'right' | 'both' = 'both'
) {
  ctx.beginPath();
  ctx.moveTo(segments[0].x0, segments[0].y0);

  if (side === 'left' || side === 'both') {
    segments.forEach(s => {
      ctx.lineTo(s.x0, s.y0);
      ctx.bezierCurveTo(s.x1, s.y1, s.x2, s.y2, s.x3, s.y3);
    });
  } else {
    const lastSegment = segments[segments.length - 1];
    ctx.lineTo(lastSegment.x3, lastSegment.y3);
  }

  if (side === 'right' || side === 'both') {
    const reverse = segments.slice().reverse();
    reverse.forEach(s => {
      ctx.lineTo(-s.x3, s.y3);
      ctx.bezierCurveTo(-s.x2, s.y2, -s.x1, s.y1, -s.x0, s.y0);
    });
  } else {
    const firstSegment = segments[0];
    ctx.lineTo(firstSegment.x0, firstSegment.y0);
  }

  ctx.closePath();
}

function drawTwigPath(
  ctx: CanvasRenderingContext2D,
  stems: TwigStem[],
) {
  ctx.beginPath();
  for (const stem of stems) {
    ctx.moveTo(stem.x0, stem.y0);
    ctx.lineTo(stem.x1, stem.y1);
  }
}
