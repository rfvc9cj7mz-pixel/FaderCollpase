import { initialize, Track, type ActivationContext } from "@ableton-extensions/sdk";

type LiveTrack = Track<"1.0.0">;

export function activate(activation: ActivationContext) {
  const context = initialize(activation, "1.0.0");
  const deviceName = "Utility";
  const presetName = "TGR.adv";

  context.commands.registerCommand("fadercollapse.trackGainReset", async () => {
    try {
      const tracks = getAllTracks(context);
      if (!tracks.length) {
        console.warn('[fadercollapse] No tracks found in the song.');
        return;
      }

      for (const track of tracks) {
        await insertUtilityDevice(track, deviceName, presetName);
      }
    } catch (error) {
      console.error('[fadercollapse] Failed to add trackGainReset utility to tracks', error);
    }
  });

  context.ui.registerContextMenuAction("AudioTrack", "Collapse Fader to Utility", "fadercollapse.trackGainReset");
  context.ui.registerContextMenuAction("MidiTrack", "Collapse Fader to Utility", "fadercollapse.trackGainReset");
  context.ui.registerContextMenuAction("AudioTrack.ArrangementSelection", "Collapse Fader to Utility", "fadercollapse.trackGainReset");
  context.ui.registerContextMenuAction("MidiTrack.ArrangementSelection", "Collapse Fader to Utility", "fadercollapse.trackGainReset");
}

function getAllTracks(context: ReturnType<typeof initialize>): LiveTrack[] {
  const song = context.application.song;
  return [...song.tracks, ...song.returnTracks];
}

async function insertUtilityDevice(track: LiveTrack, deviceName: string, presetName: string) {
  const sourceParam = track.mixer.volume;
  const sourceValue = await sourceParam.getValue();
  const sourceMin = sourceParam.min;
  const sourceMax = sourceParam.max;
  const sourceDefault = sourceParam.defaultValue;

  let utilityDevice: LiveTrack["devices"][number];
  let isExistingDevice = false;

  // Check if the last device on the track is a Utility device
  if (track.devices.length > 0) {
    const lastDevice = track.devices[track.devices.length - 1];
    if (lastDevice.name === deviceName) {
      utilityDevice = lastDevice;
      isExistingDevice = true;
      console.log(`[fadercollapse] Found existing ${deviceName} as last device on track: ${track.name}`);
    } else {
      // Last device is not Utility, so insert a new one
      const insertIndex = track.devices.length;
      utilityDevice = await track.insertDevice(deviceName, insertIndex);
      console.log(`[fadercollapse] Inserted new ${deviceName} into track: ${track.name}`);
    }
  } else {
    // No devices on track, insert Utility
    utilityDevice = await track.insertDevice(deviceName, 0);
    console.log(`[fadercollapse] Inserted new ${deviceName} into track: ${track.name}`);
  }

  if (presetName) {
    console.warn(
      `[fadercollapse] Requested preset ${deviceName}:${presetName} is not supported by the SDK.`
    );
  }

  await logDeviceParameters(
    `Utility parameters before assignment for track ${track.name} (${utilityDevice.name})`,
    utilityDevice
  );

  const gainParameter = findGainParameter(utilityDevice);

  if (!gainParameter) {
    console.warn(
      `[fadercollapse] Could not find a gain parameter on ${deviceName} for track ${track.name}`
    );
    return;
  }

  const beforeGainValue = await gainParameter.getValue();
  console.log(
    `[fadercollapse] track=${track.name} sourceValue=${sourceValue} sourceMin=${sourceMin} sourceMax=${sourceMax} sourceDefault=${sourceDefault} selectedGainParam=${gainParameter.name} beforeGainValue=${beforeGainValue} isExistingDevice=${isExistingDevice}`
  );

  const targetMin = gainParameter.min;
  const targetMax = gainParameter.max;
  const targetDefault = gainParameter.defaultValue;

  let targetValue: number;
  let sourceDelta: number | undefined;
  const hasValidRange =
    typeof sourceMin === "number" &&
    typeof sourceMax === "number" &&
    sourceMax !== sourceMin &&
    typeof targetMin === "number" &&
    typeof targetMax === "number" &&
    targetMax !== targetMin;

  if (
    typeof sourceDefault === "number" &&
    typeof targetDefault === "number" &&
    sourceDefault !== sourceMin &&
    sourceDefault !== sourceMax
  ) {
    sourceDelta = sourceValue - sourceDefault;
    
    if (isExistingDevice) {
      // For existing device, add the delta to its current value
      targetValue = beforeGainValue + sourceDelta;
    } else {
      // For new device, set from default
      targetValue = targetDefault + sourceDelta;
    }
    
    if (gainParameter.name.toLowerCase() === "output" && typeof sourceDelta === "number") {
      // Utility output is not linear in track-volume raw units;
      // approximate the dB-scaled output curve around unity.
      const outputGainScale = 1.14;
      if (isExistingDevice) {
        targetValue = beforeGainValue + sourceDelta * outputGainScale;
      } else {
        targetValue = targetDefault + sourceDelta * outputGainScale;
      }
    }
  } else if (hasValidRange) {
    const normalized = (sourceValue - sourceMin) / (sourceMax - sourceMin);
    sourceDelta = normalized * (targetMax - targetMin);
    if (isExistingDevice) {
      targetValue = beforeGainValue + sourceDelta;
    } else {
      targetValue = targetMin + sourceDelta;
    }
  } else {
    targetValue = sourceValue;
  }

  targetValue = Math.max(targetMin, Math.min(targetMax, targetValue));

  await gainParameter.setValue(targetValue);
  const afterGainValue = await gainParameter.getValue();
  console.log(
    `[fadercollapse] track=${track.name} sourceDelta=${sourceDelta ?? "n/a"} set ${gainParameter.name} to ${targetValue} actual=${afterGainValue} (default=${targetDefault})`
  );

  await logDeviceParameters(
    `Utility parameters after assignment for track ${track.name}`,
    utilityDevice
  );

  // Reset the track's mixer volume to its default (unity)
  if (typeof sourceDefault === "number") {
    await sourceParam.setValue(sourceDefault);
  }
}

function findGainParameter(device: LiveTrack["devices"][number]) {
  const nameMatcher = (name: string) =>
    name.toLowerCase() === "gain" || name.toLowerCase().includes("gain");
  const outputMatcher = (name: string) =>
    name.toLowerCase() === "output" || name.toLowerCase().includes("output");

  const fallbackParameter = device.parameters.find((parameter) => {
    const name = parameter.name.toLowerCase();
    return (
      !["device on", "mute", "channel mode", "left inv", "right inv", "stereo width", "mono", "bass mono", "bass freq", "balance", "dc filter"].includes(name)
    );
  });

  return (
    device.parameters.find((parameter) => nameMatcher(parameter.name)) ||
    device.parameters.find((parameter) => parameter.name.toLowerCase().includes("volume")) ||
    device.parameters.find((parameter) => outputMatcher(parameter.name)) ||
    fallbackParameter ||
    null
  );
}

function findOnParameter(device: LiveTrack["devices"][number]) {
  const candidates = [
    "device on",
    "on",
    "enable",
    "active",
    "power",
    "bypass"
  ];

  return (
    device.parameters.find((p) => candidates.includes(p.name.toLowerCase())) ||
    device.parameters.find((p) => p.name.toLowerCase().includes("on")) ||
    null
  );
}

async function logDeviceParameters(message: string, device: LiveTrack["devices"][number]) {
  const entries = await Promise.all(
    device.parameters.map(async (parameter) => {
      try {
        return {
          name: parameter.name,
          value: await parameter.getValue(),
          min: parameter.min,
          max: parameter.max,
          defaultValue: parameter.defaultValue,
          isQuantized: parameter.isQuantized,
        };
      } catch (error) {
        return { name: parameter.name, error: String(error) };
      }
    })
  );

  console.log(`[fadercollapse] ${message}: ${JSON.stringify(entries)}`);
}
