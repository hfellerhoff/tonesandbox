<script lang="ts">
  import { Slider } from "radix-svelte";
  import type { ResolvedProps } from "radix-svelte/internal/helpers";

  export let value: undefined | number = 50;
  export let min: undefined | number = undefined;
  export let max: undefined | number = 100;
  export let step: undefined | number = 1;
  export let orientation = "horizontal";
  export let dir = "ltr";
  export let disabled: undefined | boolean = undefined;
  export let inverted: undefined | boolean = undefined;
  export let minStepsbetweenthumbs: undefined | number = undefined;
  export let name: undefined | string = undefined;
</script>

<form>
  <Slider.Root
    class="relative flex h-5
		w-full touch-none select-none items-center 
		data-[orientation=vertical]:h-full 
		data-[orientation=vertical]:w-5
		data-[orientation=vertical]:flex-col
		"
    bind:value
    {min}
    {max}
    {step}
    {orientation}
    {name}
    {inverted}
    {dir}
    {disabled}
    {minStepsbetweenthumbs}
    aria-label="Volume"
  >
    <Slider.Track
      class="relative grow rounded-full bg-black/30 dark:bg-black/50 
					data-[orientation=horizontal]:h-[3px] 
					data-[orientation=vertical]:w-[3px]"
    >
      <Slider.Range
        class="absolute rounded-full bg-gray-900 dark:bg-white 
				data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full"
      />
    </Slider.Track>
    <Slider.Thumb
      class="block h-5 w-5 rounded-[10px] bg-gray-900 dark:bg-white shadow-[0_2px_10px] shadow-black/10 
					hover:bg-vermilion-100 focus:shadow-[0_0_0_5px] focus:shadow-black/30 focus:outline-none"
    />
  </Slider.Root>
</form>
