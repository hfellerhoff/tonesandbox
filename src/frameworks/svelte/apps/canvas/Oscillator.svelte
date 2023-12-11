<script lang="ts">
  import { draggable } from "@neodrag/svelte";
  import Slider from "@svelte/components/Slider.svelte";
  import Switch from "@svelte/components/Switch.svelte";
  import { onMount } from "svelte";
  import * as Tone from "tone";

  const FADE_TIME = 0.05;

  let oscillator: Tone.Oscillator | null = null;
  onMount(() => {
    oscillator = new Tone.Oscillator().toDestination();
  });

  export let wave: Tone.ToneOscillatorType = "sine";
  $: if (oscillator) {
    oscillator.type = wave;
  }

  export let frequency = 440;
  $: oscillator?.frequency.setValueAtTime(frequency, Tone.now());

  export let volume = -24;
  $: if (oscillator) {
    oscillator.volume.value = volume;
  }

  export let enabled = false;
  $: if (oscillator) {
    if (enabled) {
      oscillator?.start();
      oscillator.volume.rampTo(volume, FADE_TIME);
    } else {
      oscillator.volume.rampTo(-Infinity, FADE_TIME);
      setTimeout(() => {
        oscillator?.stop();
      }, FADE_TIME * 150);
    }
  }
</script>

<div
  use:draggable={{
    handle: ".handle",
  }}
  class="absolute bg-gray-100 dark:bg-gray-800 rounded shadow"
>
  <div
    class="handle w-full bg-white dark:bg-gray-700 rounded-t flex items-center justify-between gap-1 px-4 py-3"
  >
    <p
      class="text-gray-700 dark:text-gray-300 uppercase font-bold w-48 text-sm"
    >
      Oscillator
    </p>
    <Switch bind:checked={enabled} />
  </div>
  <div class="w-full flex flex-col gap-4 p-4">
    <div class="w-full flex items-center gap-2">
      <div class="flex gap-2 max-w-[250px]">
        <div class="w-full flex-1">
          <legend
            class="text-gray-700 dark:text-gray-300 uppercase font-bold text-xs"
          >
            Wave
          </legend>
          <select
            class="border-gray-300 dark:border-gray-700 dark:text-gray-100 border border-solid w-full rounded bg-gray-100 dark:bg-gray-800 p-2 h-10"
            bind:value={wave}
          >
            <option value="sine">Sine</option>
            <option value="square">Square</option>
            <option value="triangle">Triangle</option>
            <option value="sawtooth">Sawtooth</option>
          </select>
        </div>
        <div class="w-full flex-1">
          <legend
            class="text-gray-700 dark:text-gray-300 uppercase font-bold text-xs"
          >
            Hz
          </legend>
          <input
            type="number"
            bind:value={frequency}
            class="border-gray-300 dark:border-gray-700 dark:text-gray-100 border border-solid w-full rounded bg-gray-100 dark:bg-gray-800 p-2 h-10"
          />
        </div>
      </div>
    </div>
    <div class="w-full flex-1">
      <legend
        class="text-gray-700 dark:text-gray-300 uppercase font-bold text-xs"
      >
        Volume
      </legend>
      <Slider bind:value={volume} min={-48} max={0} step={0.1} />
    </div>
  </div>
</div>
