import { useStore } from "@nanostores/solid";
import {
  gainAtom,
  instrumentsAtom,
  resetInstrumentConfig,
  selectedInstrumentAtom,
  selectedInstrumentSlugAtom,
  setSelectedInstrument,
  updateSelectedInstrumentConfig,
} from "@shared/instruments";
import { isToneStartedStore } from "@shared/isToneStartedStore";
import { CgPiano } from "solid-icons/cg";
import { For, Match, Show, Switch, createSignal } from "solid-js";
import { VsSettings, VsArrowLeft } from "solid-icons/vs";

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

const getOptions = (parentName: string, name: string) => {
  if (parentName === "oscillator") {
    if (name === "type") {
      return [
        "sine",
        "square",
        "triangle",
        "sawtooth",
        "fatsawtooth",
        "fatsquare",
        "fattriangle",
        "pulse",
      ];
    }
  }

  return null;
};

function RenderConfigNode(props: {
  parentName: string;
  name: string;
  value: any;
}) {
  const selectedInstrument = useStore(selectedInstrumentAtom);

  if (typeof props.value === "object") {
    return (
      <div class="mb-2">
        <label class="block text-sm font-bold text-gray-600 capitalize mb-2">
          {props.name}
        </label>
        <div class="flex flex-col gap-2">
          {Object.entries(props.value).map((config) => {
            return (
              <RenderConfigNode
                parentName={props.name}
                name={config[0]}
                value={config[1]}
              />
            );
          })}
        </div>
      </div>
    );
  }

  const setConfig = (newValue: any) => {
    const instrument = selectedInstrument();
    if (!instrument) return;

    const rootInstrument = instrumentsAtom
      .get()
      .find((presetInstrument) => presetInstrument.slug === instrument.slug);

    if (!rootInstrument) return;

    console.log(rootInstrument.config);

    if (!props.parentName) {
      rootInstrument.config[props.name] = newValue;
    } else {
      rootInstrument.config[props.parentName][props.name] = newValue;
    }

    updateSelectedInstrumentConfig();
  };

  const options = getOptions(props.parentName, props.name);

  return (
    <div class="flex items-center justify-between max-w-sm">
      <label class="block text-sm font-medium text-gray-400 capitalize w-[12rem] truncate">
        {props.name}
      </label>
      <div class="w-[8rem]">
        <Switch>
          <Match when={typeof props.value === "number"}>
            <input
              type="number"
              class="w-full py-1 px-2 bg-gray-100 rounded box-border"
              value={props.value}
              step={0.1}
              onBlur={(event) => {
                setConfig(parseFloat((event.target as HTMLInputElement).value));
              }}
            />
          </Match>
          <Match when={typeof props.value === "string" && !!options}>
            <select
              class="w-full py-1 px-2 bg-gray-100 rounded box-border"
              value={props.value}
              onChange={(event) => {
                setConfig((event.target as HTMLSelectElement).value);
              }}
            >
              <For each={options}>
                {(option) => <option value={option}>{option}</option>}
              </For>
            </select>
          </Match>
          <Match when={typeof props.value === "string"}>
            <input
              type="text"
              class="w-full py-1 px-2 bg-gray-100 rounded box-border"
              value={props.value}
              onBlur={(event) => {
                setConfig((event.target as HTMLInputElement).value);
              }}
            />
          </Match>
          <Match when={typeof props.value === "boolean"}>
            <input
              type="checkbox"
              class="w-full py-1 px-2 bg-gray-100 rounded box-border"
              checked={props.value}
              onChange={(event) => {
                setConfig((event.target as HTMLInputElement).checked);
              }}
            />
          </Match>
        </Switch>
      </div>
    </div>
  );
}

export default function FloatingInstrumentManager() {
  const [isExpanded, setIsExpanded] = createSignal(false);
  const [isCustomizing, setIsCustomizing] = createSignal(false);

  const selectedInstrument = useStore(selectedInstrumentAtom);
  const selectedInstrumentSlug = useStore(selectedInstrumentSlugAtom);

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
      <div class="flex flex-col gap-2 absolute bg-white py-4 px-4 rounded shadow bottom-4 left-4 w-80 z-20 max-h-[90vh] overflow-y-auto">
        <Show when={!isCustomizing()}>
          <InstrumentManagerContent />
        </Show>
        <Show when={isCustomizing() && selectedInstrument()?.template.config}>
          <div class="flex flex-col gap-2">
            <div class="bg-yellow-50 p-2 rounded text-yellow-800 text-sm">
              <p class="font-bold">
                Customizing instruments is a work in progress.
              </p>
              <p class="mt-1">
                If something goes wrong, use the Copy Link button at the bottom
                of the screen to save your progress, then reload using that
                link.
              </p>
            </div>
            {Object.entries(selectedInstrument()?.template.config).map(
              (config) => {
                return (
                  <RenderConfigNode
                    parentName=""
                    name={config[0]}
                    value={config[1]}
                  />
                );
              }
            )}
          </div>
          <button
            class="py-1 px-2 bg-gray-100 rounded flex items-center justify-center gap-2"
            onClick={() => resetInstrumentConfig()}
          >
            Reset to Defaults
          </button>
        </Show>
        <Show when={selectedInstrumentSlug() !== "piano"}>
          <button
            class="py-1 px-2 bg-gray-100 rounded flex items-center justify-center gap-2"
            onClick={() => setIsCustomizing(!isCustomizing())}
          >
            {isCustomizing() ? (
              <>
                <VsArrowLeft /> Back
              </>
            ) : (
              <>
                <VsSettings /> Customize
              </>
            )}
          </button>
        </Show>
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
