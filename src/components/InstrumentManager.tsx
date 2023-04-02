import { useStore } from "@nanostores/solid";
import {
  instrumentsAtom,
  selectedInstrumentSlugAtom,
  setSelectedInstrument,
  setGain,
  gainAtom,
} from "@shared/instruments";
import { isToneStartedStore } from "@shared/isToneStartedStore";
import { For, createEffect } from "solid-js";

export default function InstrumentManager() {
  const isToneStarted = useStore(isToneStartedStore);
  const instruments = useStore(instrumentsAtom);
  const selectedInstrumentSlug = useStore(selectedInstrumentSlugAtom);

  const gain = useStore(gainAtom);

  const onSelectInstrument = (event: Event) => {
    const instrumentSlug = (event.target as HTMLSelectElement).value;
    setSelectedInstrument(instrumentSlug);
  };

  return (
    <div class="absolute bg-white py-2 rounded shadow bottom-4 left-4 px-3">
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
    </div>
  );
}
