import * as Tone from 'tone'
import { createSignal, lazy, onMount } from 'solid-js';

const defaultParams = {
    flipHorizontal: false,
    outputStride: 16,
    imageScaleFactor: 1,
    maxNumBoxes: 20,
    iouThreshold: 0.2,
    scoreThreshold: 0.6,
    modelType: "ssd320fpnlite",
    modelSize: "large",
    bboxLineWidth: "2",
    fontSize: 17,
};

type ActiveNote = {
    pitch: number,
    volume: number,
    gain: Tone.Gain
    oscillator: Tone.Oscillator
    signal: Tone.Signal<"frequency">
}

const MAX_PITCH = 1260
const MIN_PITCH = 40

type Prediction = {
    label: string,
    x: number,
    y: number,
    width: number,
    height: number
}

const frequencies = new Array(120).fill(0).map((_, i) => 40 + i).map(noteNumber => {
    return 440 * 2 ** ((noteNumber - 69) / 12)
})

const autotune = (frequency: number) => {
    return frequencies.reduce((prev, curr) => {
        return (Math.abs(curr - frequency) < Math.abs(prev - frequency) ? curr : prev);
    });
}

function getPitchFromPrediction(prediction: Prediction) {
    let pitchFrequency = (prediction.x + (prediction.width / 2)) / window.innerWidth
    let pitchVolume = (600 - (prediction.y + prediction.width / 2)) / 600

    if (pitchFrequency < 0) pitchFrequency = 0
    if (pitchFrequency > 1066) pitchFrequency = 1066

    const interpolatedFrequency = pitchFrequency * MAX_PITCH
    return autotune(interpolatedFrequency)
}

function getVolumeFromPrediction(prediction: Prediction) {
    let pitchVolume = (600 - (prediction.y + prediction.width / 2)) / 600

    if (pitchVolume < 0) pitchVolume = 0
    if (pitchVolume > 1) pitchVolume = 1

    return pitchVolume
}

const createActiveNote = (pitch: number, volume: number): ActiveNote => {
    const gain = new Tone.Gain(0).toDestination()
    const osc = new Tone.Oscillator().connect(gain).start();
    // a scheduleable signal which can be connected to control an AudioParam or another Signal
    const signal = new Tone.Signal({
        units: "frequency"
    }).connect(osc.frequency);

    return {
        pitch,
        volume,
        gain,
        oscillator: osc,
        signal
    }
}

export default function TheraminApp() {
    const [activeNotes, setActiveNotes] = createSignal<ActiveNote[]>([])
    const [videoWidth, setVideoWidth] = createSignal(window.innerWidth)
    const [videoHeight, setVideoHeight] = createSignal(window.innerHeight)

    const start = async () => {
        const videoElement = document.querySelector('video');

        // @ts-ignore
        if (!window.handTrack?.load) {
            setTimeout(start, 100);
            return;
        }

        // @ts-ignore
        const model = await window.handTrack?.load(defaultParams)
        // @ts-ignore
        window.handTrack.startVideo(videoElement)

        videoElement?.setAttribute("style", "height: 100vh;")
        // open
        // closed
        // pinch
        // point
        // face
        // pointtip
        // pinchtip

        Tone.Transport.scheduleRepeat(async () => {
            const rawPredictions = await model.detect(videoElement) as {
                label: string,
                bbox: [number, number, number, number]
            }[];

            const updatedPredictions: {
                label: string,
                x: number,
                y: number,
                width: number,
                height: number
            }[] = rawPredictions.map(p => ({
                label: p.label,
                x: p.bbox[0],
                y: p.bbox[1],
                width: p.bbox[2],
                height: p.bbox[3]
            })).filter(p => p.label === 'closed')

            const closestPredictionToActiveNote = activeNotes().map(activeNote => {
                return {
                    activeNote,
                    closestPrediction: updatedPredictions.reduce((prev, curr) => {
                        const prevDistance = Math.sqrt((activeNote.pitch - prev.x) ** 2 + (activeNote.volume - prev.y) ** 2)
                        const currDistance = Math.sqrt((activeNote.pitch - curr.x) ** 2 + (activeNote.volume - curr.y) ** 2)
    
                        return prevDistance < currDistance ? prev : curr
                    })
                }
            })

            if (updatedPredictions.length < activeNotes().length) {
                const closestActiveNotesToPredictions = updatedPredictions.map(updatedPrediction => {
                    return {
                        updatedPrediction,
                        closestActiveNote: activeNotes().reduce((prev, curr) => {
                            const prevDistance = Math.sqrt((updatedPrediction.x - prev.pitch) ** 2 + (updatedPrediction.y - prev.volume) ** 2)
                            const currDistance = Math.sqrt((updatedPrediction.x - curr.pitch) ** 2 + (updatedPrediction.y - curr.volume) ** 2)

                            return prevDistance < currDistance ? prev : curr
                        })
                    }
                })

                // for each active note not associated with a prediction, remove the active note
                const activeNotesWithoutPredictions = activeNotes().filter(activeNote => {
                    return !closestActiveNotesToPredictions.some(closestActiveNoteToPrediction => {
                        return closestActiveNoteToPrediction.closestActiveNote === activeNote
                    })
                })

                activeNotesWithoutPredictions.forEach(activeNote => {
                    activeNote.oscillator.stop()
                    activeNote.gain.gain.rampTo(0, 0.1)

                    activeNote.signal.dispose()
                    activeNote.gain.dispose()
                    activeNote.oscillator.dispose()
                })

                setActiveNotes(activeNotes().filter(activeNote => {
                    return !activeNotesWithoutPredictions.some(activeNoteWithoutPrediction => {
                        return activeNoteWithoutPrediction === activeNote
                    })
                }))
            } else if (updatedPredictions.length > activeNotes().length) {
                // find closest prediction for each active note
                const closestPredictionsToActiveNotes = activeNotes().map(activeNote => {
                    return {
                        activeNote,
                        closestPrediction: updatedPredictions.reduce((prev, curr) => {
                            const prevDistance = Math.sqrt((activeNote.pitch - prev.x) ** 2 + (activeNote.volume - prev.y) ** 2)
                            const currDistance = Math.sqrt((activeNote.pitch - curr.x) ** 2 + (activeNote.volume - curr.y) ** 2)
        
                            return prevDistance < currDistance ? prev : curr
                        })
                    }
                })

                // for each prediction not associated with an active note, create a new active note
                const predictionsWithoutActiveNotes = updatedPredictions.filter(updatedPrediction => {
                    return !closestPredictionsToActiveNotes.some(closestPredictionToActiveNote => {
                        return closestPredictionToActiveNote.closestPrediction === updatedPrediction
                    })
                })

                predictionsWithoutActiveNotes.forEach(predictionWithoutActiveNote => {
                    const frequency = getPitchFromPrediction(predictionWithoutActiveNote)
                    const volume = getVolumeFromPrediction(predictionWithoutActiveNote)

                    setActiveNotes([...activeNotes(), createActiveNote(frequency, volume)])
                })
            }

            activeNotes().forEach(activeNote => {
                const closestPrediction = closestPredictionToActiveNote.find(closestPredictionToActiveNote => {
                    return closestPredictionToActiveNote.activeNote === activeNote
                })?.closestPrediction

                if (closestPrediction) {
                    const frequency = getPitchFromPrediction(closestPrediction)
                    const volume = getVolumeFromPrediction(closestPrediction)

                    activeNote.pitch = frequency
                    activeNote.volume = volume

                    activeNote.signal.rampTo(frequency, 0.1, Tone.now())
                    activeNote.gain.gain.rampTo(volume, 0.1, Tone.now())
                }
            })

            // console.log(activeNotes().map(activeNote => `${activeNote.pitch.toFixed(2)}Hz, ${activeNote.volume.toFixed(2)}`).join('\n'))

            setActiveNotes(activeNotes() || [])
        }, 0.05)    
        Tone.Transport.start() 
    }

    onMount(async () => {
           start()

           window.addEventListener('resize', () => {
                setVideoWidth(window.innerWidth)
                setVideoHeight(window.innerHeight)
           })
    })

    return (
        <video width={videoWidth()} height={videoHeight()} class="bg-gray-900 object-cover scale-x-[-1]"  />
    )
}