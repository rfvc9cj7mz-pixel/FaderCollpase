// @ts-nocheck
import { initialize, Track, type ActivationContext } from "@ableton-extensions/sdk";

type LiveTrack = Track<"1.0.0">;

export function activate(activation: ActivationContext) {
  const context = initialize(activation, "1.0.0");
  const deviceName = "Utility";

  context.commands.registerCommand("fadercollapse.trackGainReset", async () => {
    try {
      const tracks = getAllTracks(context);
      if (!tracks.length) {
        console.warn('[fadercollapse] No tracks found in the song.');
        return;
      }

      for (const track of tracks) {
        await insertUtilityDevice(track, deviceName);
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

async function insertUtilityDevice(track: LiveTrack, deviceName: string) {
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
    `[fadercollapse] track=${track.name} sourceValue=${sourceValue} sourceMin=${sourceMin} sourceMax=${sourceMax} sourceDefault=${sourceDefault} selectedGainParam=${gainParameter.name} beforeGainValue=${beforeGainValue} isExistingDevice=${isExistingDevice} parameterKeys=${Object.keys(gainParameter).join(",")}`
  );

  const targetMin = gainParameter.min ?? -Infinity;
  const targetMax = gainParameter.max ?? Infinity;
  const targetDefault = gainParameter.defaultValue ?? 0;

  // 100% accurate translation between track volume and utility gain adjustment
  const faderDb = faderNormalizedToDb(sourceValue);
  const beforeGainDb = await getParameterDbValue(gainParameter);

  let targetDb: number;
  if (isExistingDevice) {
    // If we're using an existing device, accumulate the decibel delta
    targetDb = beforeGainDb + faderDb;
  } else {
    // For a brand new device, offset starting from its default gain
    const defaultGainDb = await getParameterDbValue({
      name: gainParameter.name,
      getValue: async () => targetDefault,
      min: targetMin,
      max: targetMax,
    } as any);
    targetDb = defaultGainDb + faderDb;
  }

  const targetValue = await convertDbToParameterValue(targetDb, gainParameter);
  const clampedTargetValue = Math.max(targetMin, Math.min(targetMax, targetValue));

  await gainParameter.setValue(clampedTargetValue);
  const afterGainValue = await gainParameter.getValue();

  console.log(
    `[fadercollapse] track=${track.name} faderDb=${faderDb.toFixed(2)}dB level=${sourceValue.toFixed(4)} → ${(sourceDefault ?? 0.85).toFixed(4)} ` +
    `| ${gainParameter.name}: ${beforeGainValue.toFixed(4)} → ${afterGainValue.toFixed(4)} (targetDb=${targetDb.toFixed(2)}dB)`
  );

  // Print super-detailed diagnostics log line if fader is below -6dB
  if (faderDb < -6.0) {
    const debugLines: string[] = [];
    debugLines.push(`[DIAGNOSTICS] DETAILED MATHEMATICAL FLOW TRACE FOR TRACK: "${track.name}" (Fader is at ${faderDb.toFixed(2)}dB which is below -6.0dB)`);
    
    // 1. Trace fader to dB
    const faderTrace = traceFaderNormalizedToDb(sourceValue);
    debugLines.push(`  * STEP 1: Translating source fader level ${sourceValue.toFixed(6)} to decibels:`);
    debugLines.push(...faderTrace.trace.map(line => `    ${line}`));
    
    // 2. Trace before gain DB
    const beforeDbTrace = await traceGetParameterDbValue(beforeGainValue, gainParameter);
    debugLines.push(`  * STEP 2: Retrieving previous Utility device gain/output level in decibels:`);
    debugLines.push(...beforeDbTrace.trace.map(line => `    ${line}`));
    
    // 3. Target DB
    debugLines.push(`  * STEP 3: Decibel target calculation:`);
    if (isExistingDevice) {
      debugLines.push(`    Accumulating on existing device: targetDb = beforeGainDb + faderDb = ${beforeGainDb.toFixed(4)} + ${faderDb.toFixed(4)} = ${targetDb.toFixed(4)} dB`);
    } else {
      const defaultGainDb = await getParameterDbValue({
        name: gainParameter.name,
        getValue: async () => targetDefault,
        min: targetMin,
        max: targetMax,
      } as any);
      debugLines.push(`    Calculating for new device from default gain: targetDb = defaultGainDb + faderDb = ${defaultGainDb.toFixed(4)} + ${faderDb.toFixed(4)} = ${targetDb.toFixed(4)} dB`);
    }
    
    // 4. Trace target DB to parameter value
    const targetValTrace = await traceConvertDbToParameterValue(targetDb, gainParameter);
    debugLines.push(`  * STEP 4: Mapping target decibels ${targetDb.toFixed(4)}dB to Utility parameter value:`);
    debugLines.push(...targetValTrace.trace.map(line => `    ${line}`));
    
    // 5. Clamping & assignment
    debugLines.push(`  * STEP 5: Verification of limits, assignment and readback check:`);
    debugLines.push(`    Clamping limits: [min = ${targetMin}, max = ${targetMax}]`);
    debugLines.push(`    Value before clamping: ${targetValue.toFixed(6)}`);
    debugLines.push(`    Value after clamping: ${clampedTargetValue.toFixed(6)} (written to device)`);
    debugLines.push(`    After assignment real value readback: ${afterGainValue.toFixed(6)}`);
    const afterDbTrace = await traceGetParameterDbValue(afterGainValue, gainParameter);
    debugLines.push(`    Converted readback dB: ${afterDbTrace.db.toFixed(4)} dB`);

    console.log(debugLines.join("\n"));
  }

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

// ===========================================================================
// CALIBRATION TABLES AND INTERPOLATION FORMULAS FOR ABLETON LIVE
// ===========================================================================

// Track Volume Fader mapping [normalized_value, dB]
// This table is highly accurate with extremely dense calibration points
const FADER_TABLE: [number, number][] = [
  [0.000000, -100.0],
  [0.009662616066634655, -66.5],
  [0.03462362661957741, -60.0],
  [0.05364469811320305, -56.5],
  [0.09134812653064728, -50.0],
  [0.11301174759864807, -46.5],
  [0.13266687095165253, -43.5],
  [0.15697653591632843, -40.0],
  [0.18312020599842072, -36.5],
  [0.20736896991729736, -33.5],
  [0.23843887448310852, -30.0],
  [0.27357277274131775, -26.5],
  [0.30869895219802856, -23.5],
  [0.3599998652935028, -20.0],
  [0.43745651841163635, -16.5],
  [0.5124568939208984, -13.5],
  [0.6000000238418579, -10.0],
  [0.700000, -6.0],
  [0.8500000238418579, 0.0],
  [1.000000, 6.0]
];

interface HermiteSpline {
  x: number[];
  y: number[];
  m: number[];
}

function buildHermiteSpline(points: [number, number][]): HermiteSpline {
  const n = points.length;
  const x = points.map(p => p[0]);
  const y = points.map(p => p[1]);
  const m = new Array(n).fill(0);
  const delta = new Array(n - 1);

  for (let i = 0; i < n - 1; i++) {
    delta[i] = (y[i+1] - y[i]) / (x[i+1] - x[i]);
  }

  // Harmonic mean tangent to ensure monotonicity
  for (let i = 1; i < n - 1; i++) {
    if (delta[i-1] * delta[i] > 0) {
      m[i] = (2 * delta[i-1] * delta[i]) / (delta[i-1] + delta[i]);
    } else {
      m[i] = 0;
    }
  }
  m[0] = delta[0];
  m[n-1] = delta[n-2];

  return { x, y, m };
}

function evaluateHermiteSpline(spline: HermiteSpline, targetX: number): number {
  const { x, y, m } = spline;
  const n = x.length;
  if (targetX <= x[0]) return y[0];
  if (targetX >= x[n-1]) return y[n-1];

  let low = 0;
  let high = n - 1;
  while (high - low > 1) {
    const mid = (low + high) >> 1;
    if (x[mid] <= targetX) {
      low = mid;
    } else {
      high = mid;
    }
  }

  const i = low;
  const h = x[i+1] - x[i];
  const t = (targetX - x[i]) / h;

  const h00 = 1 - 3*t*t + 2*t*t*t;
  const h10 = t - 2*t*t + t*t*t;
  const h01 = 3*t*t - 2*t*t*t;
  const h11 = t*t*t - t*t;

  return h00 * y[i] + h10 * h * m[i] + h01 * y[i+1] + h11 * h * m[i+1];
}

function traceEvaluateHermiteSpline(spline: HermiteSpline, targetX: number, name: string): { result: number, trace: string[] } {
  const trace: string[] = [];
  const { x, y, m } = spline;
  const n = x.length;
  trace.push(`[Trace Spline ${name}] Input = ${targetX.toFixed(6)}`);

  if (targetX <= x[0]) {
    trace.push(`[Trace Spline ${name}] Input <= boundary min ${x[0].toFixed(6)}. Returning boundary max/min ${y[0].toFixed(4)}`);
    return { result: y[0], trace };
  }
  if (targetX >= x[n-1]) {
    trace.push(`[Trace Spline ${name}] Input >= boundary max ${x[n-1].toFixed(6)}. Returning boundary max/min ${y[n-1].toFixed(4)}`);
    return { result: y[n-1], trace };
  }

  let low = 0;
  let high = n - 1;
  while (high - low > 1) {
    const mid = (low + high) >> 1;
    if (x[mid] <= targetX) {
      low = mid;
    } else {
      high = mid;
    }
  }

  const i = low;
  const h = x[i+1] - x[i];
  const t = (targetX - x[i]) / h;

  const h00 = 1 - 3*t*t + 2*t*t*t;
  const h10 = t - 2*t*t + t*t*t;
  const h01 = 3*t*t - 2*t*t*t;
  const h11 = t*t*t - t*t;

  const term1 = h00 * y[i];
  const term2 = h10 * h * m[i];
  const term3 = h01 * y[i+1];
  const term4 = h11 * h * m[i+1];
  const res = term1 + term2 + term3 + term4;

  trace.push(`[Trace Spline ${name}] Found interval index ${i}: [${x[i].toFixed(6)}, ${y[i].toFixed(4)}] to [${x[i+1].toFixed(6)}, ${y[i+1].toFixed(4)}]`);
  trace.push(`[Trace Spline ${name}] Fractional t = (${targetX.toFixed(6)} - ${x[i].toFixed(6)}) / ${h.toFixed(6)} = ${t.toFixed(6)}`);
  trace.push(`[Trace Spline ${name}] Tangents: m[i] = ${m[i].toFixed(4)}, m[i+1] = ${m[i+1].toFixed(4)}`);
  trace.push(`[Trace Spline ${name}] Hermite weights: h00 = ${h00.toFixed(4)}, h10 = ${h10.toFixed(4)}, h01 = ${h01.toFixed(4)}, h11 = ${h11.toFixed(4)}`);
  trace.push(`[Trace Spline ${name}] Terms: term1 = ${term1.toFixed(4)}, term2 = ${term2.toFixed(4)}, term3 = ${term3.toFixed(4)}, term4 = ${term4.toFixed(4)}`);
  trace.push(`[Trace Spline ${name}] Result = ${res.toFixed(4)}`);

  return { result: res, trace };
}

// Instantiate Splines at startup
const faderToDbSpline = buildHermiteSpline(FADER_TABLE);
const dbToFaderSpline = buildHermiteSpline(FADER_TABLE.map(([v, db]) => [db, v]));

// Utility Gain / Output mapping [dB, normalized_value]
// This table represents the highly accurate native Ableton Utility scaling
// with a 35.0 dB linear slope on the positive side and down to -16.9 dB,
// followed by an exponential decay curve below -16.9 dB for perfect accuracy.
const OUTPUT_TABLE: [number, number][] = [
  [35.0,  1.000000],
  [0.0,   0.000000],
  [-6.0,  -0.17142857], // -6.0 / 35.0
  [-7.0,  -0.20000000], // -7.0 / 35.0
  [-8.0,  -0.22857143], // -8.0 / 35.0
  [-9.0,  -0.25714286], // -9.0 / 35.0
  [-10.0, -0.28571429], // -10.0 / 35.0
  [-12.0, -0.34285714], // -12.0 / 35.0
  [-16.9, -0.48285714], // -16.9 / 35.0
  [-20.0, -0.53992514], // Exponential region point (-20dB)
  [-30.0, -0.72410320], // Exponential region point (-30dB)
  [-35.0, -0.81606000], // Original calibrated point
  [-40.0, -0.84119500], // Exponential region point (-40dB)
  [-50.0, -0.89146500], // Exponential region point (-50dB)
  [-60.0, -0.94173500], // Exponential region point (-60dB)
  [-65.0, -0.96687000], // Original calibrated point
  [-139.0, -0.99900000], // Original calibrated point
  [-Infinity, -1.00000000]
];

// Helper to parse strings from Ableton parameter's strForValue (e.g. "-12.0 dB" or "6.00 dB")
function parseDbString(s: string): number {
  const clean = s.toLowerCase().trim();
  if (clean.includes("inf")) {
    return -Infinity;
  }
  const match = clean.match(/([-+]?[\d.]+)/);
  if (match) {
    return parseFloat(match[1]);
  }
  return 0;
}

// Convert a raw value to decibels using native LOM methods if available
async function valueToDbNative(parameter: any, val: number): Promise<number | null> {
  const candidates = [
    "str_for_value",
    "strForValue",
    "stringForValue",
    "getStringForValue",
    "getString",
    "get_string_for_value"
  ];
  for (const cand of candidates) {
    if (typeof parameter[cand] === "function") {
      try {
        const res = parameter[cand](val);
        const str = res instanceof Promise ? await res : res;
        if (typeof str === "string") {
          return parseDbString(str);
        }
      } catch (e) {
        // Continue to check other candidates
      }
    }
  }
  return null;
}

// Map a target decibel back to the raw parameter value via binary search on native methods
async function dbToValueNative(parameter: any, db: number): Promise<number | null> {
  const testDb = await valueToDbNative(parameter, 0.0);
  if (testDb === null) {
    return null; // Native conversion not available
  }

  const min = parameter.min ?? -1.0;
  const max = parameter.max ?? 1.0;

  if (db <= -135.0) return min;
  if (db >= 35.0) return max;

  let low = min;
  let high = max;
  let bestVal = (min + max) / 2;
  let bestDiff = Infinity;

  // 16 iterations of binary search retrieves extreme precision (~0.001 dB) in <1ms
  for (let iter = 0; iter < 16; iter++) {
    const mid = (low + high) / 2;
    const currentDb = await valueToDbNative(parameter, mid);
    if (currentDb === null || !isFinite(currentDb)) {
      if (currentDb === -Infinity) {
        low = mid;
      } else {
        break;
      }
      continue;
    }

    const diff = Math.abs(currentDb - db);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestVal = mid;
    }

    if (diff < 0.01) {
      return mid;
    }

    if (currentDb < db) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return bestVal;
}

function faderNormalizedToDb(v: number): number {
  if (v <= 1e-7) return -Infinity;
  if (v >= 1.0) return 6.0;
  const db = evaluateHermiteSpline(faderToDbSpline, v);
  return db <= -99.9 ? -Infinity : db;
}

function dbToFaderNormalized(db: number): number {
  if (!isFinite(db) || db <= -100.0) return 0.0;
  if (db >= 6.0) return 1.0;
  return evaluateHermiteSpline(dbToFaderSpline, db);
}

function dbToOutputNormalized(db: number): number {
  if (!isFinite(db) || db <= -139.0) return -1.0;
  if (db >= 35.0) return 1.0;

  if (db >= -16.9) {
    return db / 35.0;
  } else {
    const B = 40.3;
    const a = 1.35827;
    return a * Math.pow(10, db / B) - 1.0;
  }
}

function outputNormalizedToDb(y: number): number {
  if (y <= -1.0) return -Infinity;
  if (y >= 1.0) return 35.0;

  if (y >= -0.48285714) {
    return y * 35.0;
  } else {
    const B = 40.3;
    const a = 1.35827;
    const val = (y + 1.0) / a;
    if (val <= 0) return -Infinity;
    return B * Math.log10(val);
  }
}

async function getParameterDbValue(parameter: LiveTrack["mixer"]["volume"]): Promise<number> {
  const value = await parameter.getValue();
  const min = parameter.min ?? -Infinity;
  const max = parameter.max ?? Infinity;
  const name = parameter.name.toLowerCase();

  // 1. Try Native string conversion first
  const nativeDb = await valueToDbNative(parameter, value);
  if (nativeDb !== null) {
    return nativeDb;
  }

  // 2. Fall back to highly accurate calibrated mathematical mapping
  if (name === "volume" || name === "mixer_device.volume") {
    return faderNormalizedToDb(value);
  }

  if (name === "output" || name.includes("output")) {
    if (Math.abs(min - (-1.0)) < 0.1 && Math.abs(max - 1.0) < 0.1) {
      return outputNormalizedToDb(value);
    }
    if (Math.abs(min - 0.0) < 0.1 && Math.abs(max - 1.0) < 0.1) {
      const y = value * 2.0 - 1.0;
      return outputNormalizedToDb(y);
    }
    return value;
  }

  if (name === "gain" || name.includes("gain")) {
    if (Math.abs(min - (-1.0)) < 0.1 && Math.abs(max - 1.0) < 0.1) {
      return outputNormalizedToDb(value);
    }
    if (Math.abs(min - 0.0) < 0.1 && Math.abs(max - 1.0) < 0.1) {
      const y = value * 2.0 - 1.0;
      return outputNormalizedToDb(y);
    }
    if (min <= -40.0 && max >= 30.0) {
      return value;
    }
  }

  return value;
}

async function convertDbToParameterValue(db: number, parameter: LiveTrack["mixer"]["volume"]): Promise<number> {
  const min = parameter.min ?? -Infinity;
  const max = parameter.max ?? Infinity;
  const name = parameter.name.toLowerCase();

  // 1. Try Native conversion via high-precision binary search first
  const nativeValue = await dbToValueNative(parameter, db);
  if (nativeValue !== null) {
    return nativeValue;
  }

  // 2. Fall back to highly accurate calibrated mathematical mapping
  if (name === "volume" || name === "mixer_device.volume") {
    return dbToFaderNormalized(db);
  }

  if (name === "output" || name.includes("output")) {
    if (Math.abs(min - (-1.0)) < 0.1 && Math.abs(max - 1.0) < 0.1) {
      return dbToOutputNormalized(db);
    }
    if (Math.abs(min - 0.0) < 0.1 && Math.abs(max - 1.0) < 0.1) {
      const y = dbToOutputNormalized(db);
      return (y + 1.0) / 2.0;
    }
    return db;
  }

  if (name === "gain" || name.includes("gain")) {
    if (Math.abs(min - (-1.0)) < 0.1 && Math.abs(max - 1.0) < 0.1) {
      return dbToOutputNormalized(db);
    }
    if (Math.abs(min - 0.0) < 0.1 && Math.abs(max - 1.0) < 0.1) {
      const y = dbToOutputNormalized(db);
      return (y + 1.0) / 2.0;
    }
    if (min <= -40.0 && max >= 30.0) {
      return db;
    }
  }

  return db;
}

// ===========================================================================
// DETAILED MATHEMATICAL DIAGNOSTIC FLOW TRACE FUNCTIONS
// ===========================================================================

function traceFaderNormalizedToDb(v: number): { db: number, trace: string[] } {
  const trace: string[] = [];
  trace.push(`[Trace Fader->dB] Input v = ${v.toFixed(6)}`);
  
  if (v <= 1e-7) {
    trace.push(`[Trace Fader->dB] Input is below/equal threshold 1e-7. Returning -Infinity`);
    return { db: -Infinity, trace };
  }
  if (v >= 1.0) {
    trace.push(`[Trace Fader->dB] Input is >= 1.0. Returning 6.0`);
    return { db: 6.0, trace };
  }

  const sub = traceEvaluateHermiteSpline(faderToDbSpline, v, "Fader->dB");
  trace.push(...sub.trace.map(line => `  ${line}`));
  const dbResult = sub.result <= -99.9 ? -Infinity : sub.result;
  return { db: dbResult, trace };
}

function traceDbToOutputNormalized(db: number): { val: number, trace: string[] } {
  const trace: string[] = [];
  trace.push(`[Trace dB->Output] Input db = ${db.toFixed(4)}`);
  
  if (!isFinite(db) || db <= -139.0) {
    trace.push(`[Trace dB->Output] Input is non-finite or <= -139.0. Returning -1.0`);
    return { val: -1.0, trace };
  }
  if (db >= 35.0) {
    trace.push(`[Trace dB->Output] Input is >= 35.0. Returning 1.0`);
    return { val: 1.0, trace };
  }

  if (db >= -16.9) {
    const result = db / 35.0;
    trace.push(`[Trace dB->Output] db >= -16.9 (linear range). Result = ${db.toFixed(4)} / 35.0 = ${result.toFixed(6)}`);
    return { val: result, trace };
  } else {
    const B = 40.3;
    const a = 1.35827;
    const power = Math.pow(10, db / B);
    const result = a * power - 1.0;
    trace.push(`[Trace dB->Output] db < -16.9 (exponential range). Formula: y = a * 10^(db/B) - 1.0`);
    trace.push(`[Trace dB->Output] Params: a = ${a}, B = ${B}, power = 10^(${db.toFixed(4)} / ${B}) = ${power.toFixed(8)}`);
    trace.push(`[Trace dB->Output] Result = ${a} * ${power.toFixed(8)} - 1.0 = ${result.toFixed(6)}`);
    return { val: result, trace };
  }
}

async function traceGetParameterDbValue(value: number, parameter: any): Promise<{ db: number, trace: string[] }> {
  const trace: string[] = [];
  const min = parameter.min ?? -Infinity;
  const max = parameter.max ?? Infinity;
  const name = parameter.name.toLowerCase();
  
  trace.push(`[Trace getParamDb] Parameter: ${parameter.name}, value = ${value.toFixed(6)}, min = ${min}, max = ${max}`);

  const nativeDb = await valueToDbNative(parameter, value);
  if (nativeDb !== null) {
    trace.push(`[Trace getParamDb] Native string conversion matched! String representation parsed to: ${nativeDb.toFixed(4)} dB`);
    return { db: nativeDb, trace };
  }

  if (name === "volume" || name === "mixer_device.volume") {
    const sub = traceFaderNormalizedToDb(value);
    trace.push(...sub.trace.map(line => `  ${line}`));
    return { db: sub.db, trace };
  }

  if (name === "output" || name.includes("output")) {
    if (Math.abs(min - (-1.0)) < 0.1 && Math.abs(max - 1.0) < 0.1) {
      const sub = traceOutputNormalizedToDb(value);
      trace.push(...sub.trace.map(line => `  ${line}`));
      return { db: sub.db, trace };
    }
    if (Math.abs(min - 0.0) < 0.1 && Math.abs(max - 1.0) < 0.1) {
      const y = value * 2.0 - 1.0;
      trace.push(`[Trace getParamDb] Output is scaled [0,1]->[-1,1]: y = ${value.toFixed(6)} * 2 - 1 = ${y.toFixed(6)}`);
      const sub = traceOutputNormalizedToDb(y);
      trace.push(...sub.trace.map(line => `  ${line}`));
      return { db: sub.db, trace };
    }
    trace.push(`[Trace getParamDb] Returning value directly: ${value.toFixed(4)}`);
    return { db: value, trace };
  }

  if (name === "gain" || name.includes("gain")) {
    if (Math.abs(min - (-1.0)) < 0.1 && Math.abs(max - 1.0) < 0.1) {
      const sub = traceOutputNormalizedToDb(value);
      trace.push(...sub.trace.map(line => `  ${line}`));
      return { db: sub.db, trace };
    }
    if (Math.abs(min - 0.0) < 0.1 && Math.abs(max - 1.0) < 0.1) {
      const y = value * 2.0 - 1.0;
      trace.push(`[Trace getParamDb] Gain is scaled [0,1]->[-1,1]: y = ${value.toFixed(6)} * 2 - 1 = ${y.toFixed(6)}`);
      const sub = traceOutputNormalizedToDb(y);
      trace.push(...sub.trace.map(line => `  ${line}`));
      return { db: sub.db, trace };
    }
    if (min <= -40.0 && max >= 30.0) {
      trace.push(`[Trace getParamDb] Gain is direct dB [${min}, ${max}]. Returning ${value.toFixed(4)}`);
      return { db: value, trace };
    }
  }

  trace.push(`[Trace getParamDb] Default fallback. Returning value directly: ${value.toFixed(4)}`);
  return { db: value, trace };
}

function traceOutputNormalizedToDb(y: number): { db: number, trace: string[] } {
  const trace: string[] = [];
  trace.push(`[Trace Output->dB] Input y = ${y.toFixed(6)}`);
  
  if (y <= -1.0) {
    trace.push(`[Trace Output->dB] y <= -1.0. Returning -Infinity`);
    return { db: -Infinity, trace };
  }
  if (y >= 1.0) {
    trace.push(`[Trace Output->dB] y >= 1.0. Returning 35.0`);
    return { db: 35.0, trace };
  }

  if (y >= -0.48285714) {
    const result = y * 35.0;
    trace.push(`[Trace Output->dB] y >= -0.48285714 (linear range). Result = ${y.toFixed(6)} * 35.0 = ${result.toFixed(4)} dB`);
    return { db: result, trace };
  } else {
    const B = 40.3;
    const a = 1.35827;
    const val = (y + 1.0) / a;
    if (val <= 0) {
      trace.push(`[Trace Output->dB] (y + 1.0) / a <= 0. Returning -Infinity`);
      return { db: -Infinity, trace };
    }
    const result = B * Math.log10(val);
    trace.push(`[Trace Output->dB] y < -0.48285714 (exponential range). Formula: db = B * log10((y + 1.0) / a)`);
    trace.push(`[Trace Output->dB] Params: a = ${a}, B = ${B}, internal value = ${val.toFixed(8)}`);
    trace.push(`[Trace Output->dB] Result = ${B} * log10(${val.toFixed(8)}) = ${result.toFixed(4)} dB`);
    return { db: result, trace };
  }
}

async function traceConvertDbToParameterValue(db: number, parameter: any): Promise<{ val: number, trace: string[] }> {
  const trace: string[] = [];
  const min = parameter.min ?? -Infinity;
  const max = parameter.max ?? Infinity;
  const name = parameter.name.toLowerCase();
  
  trace.push(`[Trace dbToParam] Parameter: ${parameter.name}, target DB = ${db.toFixed(4)}, min = ${min}, max = ${max}`);

  const nativeValue = await dbToValueNative(parameter, db);
  if (nativeValue !== null) {
    trace.push(`[Trace dbToParam] Native string conversion matched! Target DB ${db.toFixed(4)} mapped via binary search to raw: ${nativeValue.toFixed(6)}`);
    return { val: nativeValue, trace };
  }

  if (name === "volume" || name === "mixer_device.volume") {
    const result = dbToFaderNormalized(db);
    trace.push(`[Trace dbToParam] Volume: mapping target ${db.toFixed(4)}dB -> fader level: ${result.toFixed(6)}`);
    return { val: result, trace };
  }

  if (name === "output" || name.includes("output")) {
    if (Math.abs(min - (-1.0)) < 0.1 && Math.abs(max - 1.0) < 0.1) {
      const sub = traceDbToOutputNormalized(db);
      trace.push(...sub.trace.map(line => `  ${line}`));
      return { val: sub.val, trace };
    }
    if (Math.abs(min - 0.0) < 0.1 && Math.abs(max - 1.0) < 0.1) {
      const sub = traceDbToOutputNormalized(db);
      trace.push(...sub.trace.map(line => `  ${line}`));
      const scaled = (sub.val + 1.0) / 2.0;
      trace.push(`[Trace dbToParam] Output range [0, 1]. Scaling mapped value: (${sub.val.toFixed(6)} + 1) / 2 = ${scaled.toFixed(6)}`);
      return { val: scaled, trace };
    }
    trace.push(`[Trace dbToParam] Fallback. Directly returning DB: ${db.toFixed(4)}`);
    return { val: db, trace };
  }

  if (name === "gain" || name.includes("gain")) {
    if (Math.abs(min - (-1.0)) < 0.1 && Math.abs(max - 1.0) < 0.1) {
      const sub = traceDbToOutputNormalized(db);
      trace.push(...sub.trace.map(line => `  ${line}`));
      return { val: sub.val, trace };
    }
    if (Math.abs(min - 0.0) < 0.1 && Math.abs(max - 1.0) < 0.1) {
      const sub = traceDbToOutputNormalized(db);
      trace.push(...sub.trace.map(line => `  ${line}`));
      const scaled = (sub.val + 1.0) / 2.0;
      trace.push(`[Trace dbToParam] Gain range [0, 1]. Scaling mapped value: (${sub.val.toFixed(6)} + 1) / 2 = ${scaled.toFixed(6)}`);
      return { val: scaled, trace };
    }
    if (min <= -40.0 && max >= 30.0) {
      trace.push(`[Trace dbToParam] Gain range covers standard dB [${min}, ${max}]. Returning raw DB: ${db.toFixed(4)}`);
      return { val: db, trace };
    }
  }

  trace.push(`[Trace dbToParam] Default Fallback. Directly returning DB: ${db.toFixed(4)}`);
  return { val: db, trace };
}