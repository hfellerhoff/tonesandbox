<script lang="ts">
  import { onMount } from "svelte";
  import Oscillator from "./Oscillator.svelte";

  type ComponentType = "oscillator";
  type Component = {
    id: string;
    type: ComponentType;
    enabled: boolean;
  };

  type OscillatorComponent = Component & {
    type: "oscillator";
    wave: "sine" | "square" | "sawtooth" | "triangle";
    frequency: number;
    volume: number;
  };

  const DEFAULT_OSCILLATOR: Omit<OscillatorComponent, "id"> = {
    type: "oscillator",
    enabled: false,
    wave: "sine",
    frequency: 440,
    volume: -24,
  };

  const components: Record<string, Component> = {
    initial: {
      ...DEFAULT_OSCILLATOR,
      id: "initial",
    } as OscillatorComponent,
  };

  let oscillators: OscillatorComponent[] = [];
  $: oscillators = Object.values(components).filter(
    (component) => component.type === "oscillator"
  ) as OscillatorComponent[];

  function addOscillator() {
    const id = Math.random().toString(36).substr(2, 9);
    components[id] = {
      ...DEFAULT_OSCILLATOR,
      id,
    } as OscillatorComponent;
  }
</script>

{#each oscillators as oscillator}
  <Oscillator wave={oscillator.wave} />
{/each}

<button
  class="fixed bottom-4 left-[50%] translate-x-[-50%] py-2 px-2 font-medium rounded active:translate-y-0.5 flex items-center justify-center gap-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
  on:click={addOscillator}>Add Oscillator</button
>
