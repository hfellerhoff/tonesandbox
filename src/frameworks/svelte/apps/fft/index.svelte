<script lang="ts">
  import { onMount } from "svelte";

  let width = 512;
  let height = 256;

  let isActive = true;

  let context: AudioContext;
  let analyser: AnalyserNode;
  let mediaSource;
  let imageData;
  let timeData: Uint8Array;
  let ctx: CanvasRenderingContext2D;
  let fftSize = 8192;
  let displayScale = "logarithmic (smaller)";
  let hasSmallerRange = true;

  let frequencyMarkers: number[] = [];
  const frequencyMarkerDistance = 25;

  const interpolate = (
    value: number,
    { inputMin = 0, inputMax = 1, outputMin = 0, outputMax = 1 }
  ) => {
    const adjustedValue = value - inputMin;
    const adjustedMax = inputMax - inputMin;
    const ratio = adjustedValue / adjustedMax;

    const output = ratio * (outputMax - outputMin) + outputMin;

    return output;
  };

  // 0 to 255 in
  // 0 to 255 out
  const sigmoid = (x: number) => {
    const a = 9;
    const b = -0.05;

    const numerator = 255;

    const power = a + b * x;
    const denominator = 1 + Math.pow(Math.E, power);

    return numerator / denominator;
  };

  function animate() {
    if (!isActive) return;

    // updateFFT();
    getFrequencyBins();
    requestAnimationFrame(animate);
  }

  const getLogarithmicPixelStart = (
    maxHz: number,
    pixelCount: number,
    pixelNumber: number
  ) => {
    return (pixelCount / maxHz) * Math.pow(pixelNumber, 2);
  };

  const getLogarithmicPixelSize = (
    maxHz: number,
    pixelCount: number,
    pixelNumber: number
  ) => {
    const curr = getLogarithmicPixelStart(maxHz, pixelCount, pixelNumber);
    const next = getLogarithmicPixelStart(maxHz, pixelCount, pixelNumber + 1);
    return next - curr;
  };

  const getFrequencyBins = () => {
    if (!ctx) return;
    timeData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(timeData);

    imageData = ctx.getImageData(1, 0, width - 1, height);
    ctx.putImageData(imageData, 0, 0);

    const maxHz = displayScale.includes("small")
      ? context.sampleRate
      : context.sampleRate / 2; // nyquist frequency
    const binCount = analyser.frequencyBinCount;
    const binSize = maxHz / analyser.frequencyBinCount;

    const pixelCount = height;
    const visualizationPixels = Array(pixelCount).fill(0);
    const binToPixelRatio = binCount / visualizationPixels.length;

    frequencyMarkers = [];

    const isLogarithmic = displayScale.includes("logarithmic");

    visualizationPixels.forEach((_, i) => {
      const linearPixelSize = binToPixelRatio * binSize;
      const logarithmicPixelSize = getLogarithmicPixelSize(
        maxHz,
        pixelCount,
        i
      );
      const pixelSize = isLogarithmic ? logarithmicPixelSize : linearPixelSize;

      const linearPixelStart = i * pixelSize;
      const logarithmicPixelStart = getLogarithmicPixelStart(
        maxHz,
        pixelCount,
        i
      );
      const pixelStartFrequency = isLogarithmic
        ? logarithmicPixelStart
        : linearPixelStart;

      const pixelFrequencyMidpoint = pixelStartFrequency + pixelSize / 2;

      let j = 0;
      let previousDistance = 100000000;

      while (
        previousDistance > Math.abs(pixelFrequencyMidpoint - j * binSize)
      ) {
        previousDistance = Math.abs(pixelFrequencyMidpoint - j * binSize);
        j++;
      }

      // average the close bins to get the most accurate frequency value
      const lowerBinDistance = Math.abs(
        pixelFrequencyMidpoint - (j - 1) * binSize
      );
      const upperBinDistance = Math.abs(pixelFrequencyMidpoint - j * binSize);

      const ratio = lowerBinDistance / upperBinDistance;

      if (j + 1 <= timeData.length) {
        const lowerBinValue = timeData[j - 1] / 1 + ratio;
        const upperBinValue = timeData[j] / 1 - ratio;
        const value = (lowerBinValue + upperBinValue) / 2;

        visualizationPixels[i] = value;
      } else {
        visualizationPixels[i] = 0;
      }
    });

    const [hzDict, _] = visualizationPixels.reduce(
      ([dict, i], pixel) => {
        const linearPixelSize = binToPixelRatio * binSize;
        const logarithmicPixelSize = getLogarithmicPixelSize(
          maxHz,
          pixelCount,
          i
        );
        const pixelSize = isLogarithmic
          ? logarithmicPixelSize
          : linearPixelSize;

        const linearPixelStart = i * pixelSize;
        const logarithmicPixelStart = getLogarithmicPixelStart(
          maxHz,
          pixelCount,
          i
        );
        const pixelStart = isLogarithmic
          ? logarithmicPixelStart
          : linearPixelStart;

        dict[pixelStart] = pixel;
        return [dict, i + 1];
      },
      [{}, 0] as [Record<string, number>, number]
    );

    const hzDataArray = Object.entries(hzDict as Record<string, number>);

    for (let i = 0; i < pixelCount; i++) {
      const [startHz, value] = hzDataArray[i];

      const colorMax = 255;
      const constainedValue = interpolate(value, {
        inputMin: 0,
        inputMax: 255,
        outputMin: 0,
        outputMax: 1,
      });

      const colorValue = interpolate(constainedValue, {
        inputMin: 0,
        inputMax: 1,
        outputMin: 0,
        outputMax: 255,
      });

      if (i % frequencyMarkerDistance === 0)
        frequencyMarkers.push(Math.round(parseFloat(startHz)));

      const adjustedColorValue = sigmoid(colorValue);
      let color = colorMax - adjustedColorValue;

      const l = `${Math.round(10 * Math.log(adjustedColorValue))}%`; // max l = ~55% with x=255

      ctx.fillStyle = `hsl(${color}, 100%, ${l})`;

      ctx.fillRect(width - 1, height - i, 1, 1);
    }
  };

  onMount(() => {
    const canvas = document.getElementById("fft") as HTMLCanvasElement;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

    ctx.fillStyle = `rgba(0,0,0)`;
    ctx.fillRect(0, 0, width, height);

    window.addEventListener("resize", onWindowResize, false);
    function onWindowResize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      animate();
    }

    function connectAudioAPI() {
      try {
        context = new AudioContext();
        analyser = context.createAnalyser();
        analyser.fftSize = fftSize;

        navigator.mediaDevices
          .getUserMedia({ audio: true, video: false })
          .then(function (stream) {
            mediaSource = context.createMediaStreamSource(stream);
            mediaSource.connect(analyser);
            animate();
          })
          .catch(function (err) {
            alert(err);
          });
      } catch (e) {
        alert(e);
      }
    }

    connectAudioAPI();

    window.addEventListener("keydown", (e) => {
      if (e.key === " ") toggleActive();
    });
  });

  const toggleActive = () => {
    isActive = !isActive;
    animate();
  };

  const updateFFTSize = () => {
    analyser.fftSize = fftSize;
  };

  const sampleCounts = [
    32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768,
  ];
  const displayScales = ["linear", "logarithmic", "logarithmic (smaller)"];
</script>

<canvas id="fft" class="bg-gray-900 overflow-hidden" />

<div
  class="bg-white dark:bg-gray-800 absolute left-4 bottom-4 rounded shadow text-gray-900 dark:text-gray-2 grid grid-cols-2 place-items-center p-4 gap-2"
>
  <label for="fft-playback" class="dark:text-gray-200">Playback</label>
  <button id="fft-playback" on:click={toggleActive}>
    {#if isActive}
      Stop
    {:else}
      Start
    {/if}
  </button>
  <label for="fft-samplesize" class="dark:text-gray-200">Sample Size</label>
  <select id="fft-samplesize" bind:value={fftSize} on:change={updateFFTSize}>
    {#each sampleCounts as count}
      <option value={count}>{count}</option>
    {/each}
  </select>
  <label for="fft-displayscale" class="dark:text-gray-200">Display Scale</label>
  <select id="fft-displayscale" bind:value={displayScale}>
    {#each displayScales as scale}
      <option value={scale}
        >{scale.substring(0, 1).toUpperCase() + scale.substring(1)}</option
      >
    {/each}
  </select>
</div>
<!-- span content size = 12px -->
<div id="markers" style={`gap: ${frequencyMarkerDistance - 12}px;`}>
  {#each frequencyMarkers as marker}
    <span>{marker}hz</span>
  {/each}
</div>

<style>
  canvas {
    padding: 0;
    margin: 0;

    width: 100vw;
    height: 100vh;

    overflow: hidden;

    background: black;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  }

  label {
    width: 100%;
    font-size: 0.9rem;
  }

  button,
  select {
    @apply bg-gray-200 rounded w-32 h-8 border-none text-inherit p-1;
  }

  :global(.dark) button,
  :global(.dark) select {
    @apply bg-gray-700 text-gray-200;
  }

  #markers {
    position: absolute;
    right: 0;
    bottom: -6px; /* half of label size for more accurate labels */
    display: flex;
    flex-direction: column-reverse;
    background: transparent;
    padding: 0;
    color: whitesmoke;
    text-align: right;
    font-size: 10px;
    font-family: monospace;
    user-select: none;
  }

  #markers span {
    height: 12px;
  }
</style>
