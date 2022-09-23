import { h, Fragment } from 'preact';
import { useStore } from '@nanostores/preact';
import { microphoneStore } from '@shared/microphoneStore';
import { useEffect, useRef, useState } from 'preact/hooks';
import * as Tone from 'tone';

export default function FFT() {
  const $microphone = useStore(microphoneStore);
  const [hasStarted, setHasStarted] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!!$microphone.microphone && !hasStarted) {
      const analyzer = new Tone.FFT(256);

      $microphone.microphone.connect(analyzer);

      setHasStarted(true);

      animate(analyzer);
    }
  }, [$microphone, hasStarted]);

  useEffect(() => {
    const canvas = canvasRef.current;

    function onWindowResize() {
      if (!canvas) return;

      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    }

    window.addEventListener('resize', onWindowResize, false);

    return () => {
      window.removeEventListener('resize', onWindowResize);
    };
  }, [canvasRef?.current]);

  const pixelSize = 1;
  const drawCanvas = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    analyzer: Tone.FFT
  ) => {
    const bins = analyzer.getValue();

    bins.forEach((bin, i) => {
      ctx.fillStyle = `hsl(${(bin + 150) * 5}, 100%, 50%)`;
      ctx.fillRect(
        width - pixelSize,
        height - pixelSize - i * pixelSize,
        pixelSize,
        pixelSize
      );
    });
  };

  const shiftCanvas = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    const pixels = 1;

    const imageData = ctx.getImageData(pixels, 0, width - pixels, height);
    ctx.clearRect(0, 0, width, height);

    ctx.putImageData(imageData, 0, 0);
  };

  const animate = (analyzer: Tone.FFT, timeDelta = 0, lastTimeDelta = 0) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    drawCanvas(ctx, width, height, analyzer);
    shiftCanvas(ctx, width, height);

    requestAnimationFrame((newTimeDelta) =>
      animate(analyzer, newTimeDelta, timeDelta)
    );
  };

  return (
    <canvas ref={canvasRef} className='bg-gray-900 h-full w-full'></canvas>
  );
}
