import { useStore } from "@nanostores/solid";
import {
  instrumentsAtom,
  selectedInstrumentSlugAtom,
  setSelectedInstrument,
  setGain,
  gainAtom,
} from "@shared/instruments";
import { isToneStartedStore } from "@shared/isToneStartedStore";
import { For, Show, createEffect, createSignal } from "solid-js";
import { CgPiano } from "solid-icons/cg";

export function InstrumentManagerContent() {
  const isToneStarted = useStore(isToneStartedStore);
  const instruments = useStore(instrumentsAtom);
  const selectedInstrumentSlug = useStore(selectedInstrumentSlugAtom);

  const gain = useStore(gainAtom);

  const onSelectInstrument = (event: Event) => {
    const instrumentSlug = (event.target as HTMLSelectElement).value;
    setSelectedInstrument(instrumentSlug);
  };

  return (
    <>
      <label class="block text-sm font-medium text-gray-500 px-1">
        Instrument
      </label>
      <select
        value={selectedInstrumentSlug()}
        onChange={onSelectInstrument}
        disabled={!isToneStarted()}
      >
        <option value="">None</option>
        <For each={instruments()}>
          {(instrument) => (
            <option id={instrument.slug} value={instrument.slug}>
              {instrument.name}
            </option>
          )}
        </For>
      </select>
      {/* <label
        class="block text-sm font-medium text-gray-500 px-1 mt-2"
        for="gain"
      >
        Gain
      </label>
      <input
        id="gain"
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={gain()}
        onChange={(event) => {
          setGain(parseFloat((event.target as HTMLInputElement).value));
        }}
      /> */}
    </>
  );
}

export default function FloatingInstrumentManager() {
  const [isExpanded, setIsExpanded] = createSignal(false);

  return (
    <Show
      when={isExpanded()}
      fallback={
        <button
          class="p-4 absolute bg-white rounded shadow bottom-4 left-4"
          onClick={() => setIsExpanded(true)}
        >
          <CgPiano />
        </button>
      }
    >
      <div class="flex flex-col gap-2 absolute bg-white py-4 px-4 rounded shadow bottom-4 left-4 w-56 z-20">
        <InstrumentManagerContent />
        <button
          class="py-1 px-2 bg-gray-100 rounded"
          onClick={() => setIsExpanded(false)}
        >
          Close
        </button>
      </div>
    </Show>
  );
}
