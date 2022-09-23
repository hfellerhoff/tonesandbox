import { h, Fragment } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import * as Tone from 'tone';
import { Icon } from 'astro-icon';
import clsx from 'clsx';
import { useStore } from '@nanostores/preact';
import { microphoneStore, setMicrophoneStatus } from '@shared/microphoneStore';

type Props = {};

function MicrophoneManager({}: Props) {
  const $microphone = useStore(microphoneStore);

  useEffect(() => {
    const connectMicrophone = async () => {
      const microphoneToOpen = new Tone.UserMedia();

      const microphone = await microphoneToOpen.open().catch((e) => {
        setMicrophoneStatus('disconnected');
      });

      if (!microphone) {
        setMicrophoneStatus('disconnected');
        return;
      }

      const meter = new Tone.Meter();

      //   microphone.connect(meter).toDestination();

      microphoneStore.set({
        status: 'connected',
        microphone,
        meter,
      });
    };

    if ($microphone.status !== 'connected') {
      connectMicrophone();
    }
  }, []);

  return (
    <div className='flex items-center justify-between'>
      <div>
        {$microphone.status === 'loading'
          ? 'Connecting microphone...'
          : $microphone.status === 'connected'
          ? 'Microphone connected'
          : 'Microphone not connected'}
      </div>
      <div
        className={clsx('ml-2 w-3 h-3 rounded-full', {
          'bg-green-600': $microphone.status === 'connected',
          'bg-yellow-500': $microphone.status === 'loading',
          'bg-red-600': $microphone.status === 'disconnected',
        })}
      />
    </div>
  );
}

export default MicrophoneManager;
