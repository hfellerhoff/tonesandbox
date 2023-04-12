import { useStore } from "@nanostores/solid";
import {
  INSTRUMENT_PRESETS,
  InstrumentSlug,
  gainAtom,
  instrumentsAtom,
  resetInstrumentConfig,
  selectedInstrumentAtom,
  selectedInstrumentSlugAtom,
  setInstruments,
  setSelectedInstrument,
  updateSelectedInstrumentConfig,
} from "@modules/instruments";
import { isToneStartedStore } from "@shared/isToneStartedStore";
import { CgPiano } from "solid-icons/cg";
import { VsArrowLeft, VsSettings } from "solid-icons/vs";
import {
  For,
  Match,
  Show,
  Switch,
  createEffect,
  createMemo,
  createSignal,
  onMount,
} from "solid-js";
import FloatingModuleWrapper from "../FloatingModuleWrapper";
import type { BaseModule } from "@modules/index";
import Input from "@components/Input";
import Select from "@components/Select";
import Button from "@components/Button";

export interface InstrumentAudioModule extends BaseModule {
  defaultInstrument: InstrumentSlug;
  presetInstruments: InstrumentSlug[];
}

export function InstrumentManagerContent(props: InstrumentAudioModule) {
  const isToneStarted = useStore(isToneStartedStore);
  const instruments = useStore(instrumentsAtom);
  const selectedInstrumentSlug = useStore(selectedInstrumentSlugAtom);

  onMount(() => {
    setInstruments(props.presetInstruments);
    setSelectedInstrument(props.defaultInstrument);
  });

  const onSelectInstrument = (event: Event) => {
    const instrumentSlug = (event.target as HTMLSelectElement).value;
    setSelectedInstrument(instrumentSlug);
  };

  return (
    <>
      <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">
        Instrument
      </label>
      <Select
        value={selectedInstrumentSlug}
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
      </Select>
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
        <label class="block text-sm font-bold text-gray-600 dark:text-gray-300 capitalize mb-2">
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
      <label class="block text-sm font-medium text-gray-400 dark:text-gray-500 capitalize w-[12rem] truncate">
        {props.name}
      </label>
      <div class="w-[8rem]">
        <Switch>
          <Match when={typeof props.value === "number"}>
            <Input
              type="number"
              value={props.value}
              step={0.1}
              onBlur={(event) => {
                setConfig(parseFloat((event.target as HTMLInputElement).value));
              }}
            />
          </Match>
          <Match when={typeof props.value === "string" && !!options}>
            <Select
              value={props.value}
              onChange={(event) => {
                setConfig((event.target as HTMLSelectElement).value);
              }}
            >
              <For each={options}>
                {(option) => <option value={option}>{option}</option>}
              </For>
            </Select>
          </Match>
          <Match when={typeof props.value === "string"}>
            <Input
              type="text"
              value={props.value}
              onBlur={(event) => {
                setConfig((event.target as HTMLInputElement).value);
              }}
            />
          </Match>
          <Match when={typeof props.value === "boolean"}>
            <Input
              type="checkbox"
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

export default function InstrumentModule(props: InstrumentAudioModule) {
  const selectedInstrument = useStore(selectedInstrumentAtom);
  const selectedInstrumentSlug = useStore(selectedInstrumentSlugAtom);

  const [isCustomizing, setIsCustomizing] = createSignal(false);

  const canCustomize = createMemo(() => {
    return !selectedInstrumentSlug().includes("piano");
  });

  return (
    <FloatingModuleWrapper icon={<CgPiano />} position={props.position}>
      <Show when={!isCustomizing()}>
        <InstrumentManagerContent {...props} />
      </Show>
      <Show when={isCustomizing() && selectedInstrument()?.template.config}>
        <div class="flex flex-col gap-2">
          <div class="bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-25 p-2 rounded text-yellow-800 dark:text-yellow-200 text-sm">
            <p class="font-bold">
              Customizing instruments is a work in progress.
            </p>
            <p class="mt-1">
              If something goes wrong, use the Copy Link button at the bottom of
              the screen to save your progress, then reload using that link.
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
        <Button onClick={() => resetInstrumentConfig()}>
          Reset to Defaults
        </Button>
      </Show>
      <Show when={canCustomize()}>
        <Button onClick={() => setIsCustomizing(!isCustomizing())}>
          {isCustomizing() ? (
            <>
              <VsArrowLeft /> Back
            </>
          ) : (
            <>
              <VsSettings /> Customize
            </>
          )}
        </Button>
      </Show>
    </FloatingModuleWrapper>
  );
}
