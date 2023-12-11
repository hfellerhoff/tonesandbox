<script lang="ts">
  import { Switch } from "radix-svelte";
  export let checked: boolean | undefined = undefined;
  export let required: boolean | undefined = undefined;
  export let disabled: boolean | undefined = undefined;
  export let name: string | undefined = undefined;
  export let value: string | undefined = undefined;
  export let id: string | undefined = undefined;
</script>

<form>
  <div class="flex items-center">
    <Switch.Root
      class="relative h-6 w-11 cursor-default rounded-full
			bg-black/40 dark:bg-black/60 shadow-[0_2px_10px] shadow-black/10 outline-none
			 focus:shadow-[0_0_0_2px] focus:shadow-black data-[state=checked]:bg-black dark:data-[state=checked]:bg-gray-400"
      id={id || undefined}
      bind:checked
      bind:required
      bind:disabled
      bind:name
      bind:value
    >
      <Switch.Thumb
        class="block h-5 w-5 translate-x-0.5 rounded-full bg-white
				shadow-[0_2px_2px] shadow-black/10 transition-transform duration-100
				will-change-transform data-[state=checked]:translate-x-[22px]"
      />
    </Switch.Root>
  </div>
</form>
