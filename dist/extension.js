"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate
});
module.exports = __toCommonJS(extension_exports);

// node_modules/@ableton-extensions/sdk/dist/index.mjs
var DataModelObject = class DataModelObject2 {
  /** @internal */
  constructor(handle, dataModel, objectRegistry) {
    this.handle = handle;
    this.dataModel = dataModel;
    this.objectRegistry = objectRegistry;
  }
  /** The canonical parent of this object in Live's object hierarchy, or `null` if it has none. */
  get parent() {
    const handle = this.dataModel.getObjectCanonicalParent(this.handle);
    return handle ? this.objectRegistry.getObjectFromHandle(handle, DataModelObject2) : null;
  }
};
var invokeAsync = (dataModel, fn, ...args) => new Promise((resolve, reject) => {
  dataModel.withinTransaction(() => fn(...args, resolve, reject));
});
var createAsync = (dataModel, registry, type, fn, ...args) => new Promise((resolve, reject) => {
  dataModel.withinTransaction(() => fn(...args, (handle) => resolve(registry.getObjectFromHandle(handle, type)), reject));
});
var Clip = class extends DataModelObject {
  static className = "Clip";
  get name() {
    return this.dataModel.clipGetName(this.handle);
  }
  set name(name) {
    this.dataModel.withinTransaction(() => {
      this.dataModel.clipSetName(this.handle, name);
    });
  }
  get startTime() {
    return this.dataModel.clipGetStartTime(this.handle);
  }
  get endTime() {
    return this.dataModel.clipGetEndTime(this.handle);
  }
  get duration() {
    return this.dataModel.clipGetEndTime(this.handle) - this.dataModel.clipGetStartTime(this.handle);
  }
  get startMarker() {
    return this.dataModel.clipGetStartMarker(this.handle);
  }
  get endMarker() {
    return this.dataModel.clipGetEndMarker(this.handle);
  }
  /**
  * Whether the clip is looped. Enabling looping on an unwarped audio clip
  * automatically enables warping.
  */
  get looping() {
    return this.dataModel.clipGetLooping(this.handle);
  }
  set looping(value) {
    this.dataModel.withinTransaction(() => {
      this.dataModel.clipSetLooping(this.handle, value);
    });
  }
  get loopStart() {
    return this.dataModel.clipGetLoopStart(this.handle);
  }
  get loopEnd() {
    return this.dataModel.clipGetLoopEnd(this.handle);
  }
  get color() {
    return this.dataModel.clipGetColor(this.handle);
  }
  set color(value) {
    this.dataModel.withinTransaction(() => {
      this.dataModel.clipSetColor(this.handle, value);
    });
  }
  get muted() {
    return this.dataModel.clipGetMuted(this.handle);
  }
  set muted(value) {
    this.dataModel.withinTransaction(() => {
      this.dataModel.clipSetMuted(this.handle, value);
    });
  }
};
var AudioClip = class extends Clip {
  static className = "AudioClip";
  get filePath() {
    return this.dataModel.audioclipGetFilePath(this.handle);
  }
  get warping() {
    return this.dataModel.audioclipGetWarping(this.handle);
  }
  set warping(value) {
    this.dataModel.withinTransaction(() => {
      this.dataModel.audioclipSetWarping(this.handle, value);
    });
  }
  get warpMode() {
    return this.dataModel.audioclipGetWarpMode(this.handle);
  }
  set warpMode(warpMode) {
    this.dataModel.withinTransaction(() => {
      this.dataModel.audioclipSetWarpMode(this.handle, warpMode);
    });
  }
  get warpMarkers() {
    return this.dataModel.audioclipGetWarpMarkers(this.handle);
  }
};
var MidiClip = class extends Clip {
  static className = "MidiClip";
  get notes() {
    return this.dataModel.midiclipGetNotes(this.handle);
  }
  set notes(notes) {
    this.dataModel.withinTransaction(() => {
      this.dataModel.midiclipSetNotes(this.handle, notes);
    });
  }
};
var ClipSlot = class extends DataModelObject {
  static className = "ClipSlot";
  get clip() {
    const handle = this.dataModel.clipslotGetClip(this.handle);
    return handle ? this.objectRegistry.getObjectFromHandle(handle, Clip) : null;
  }
  /**
  * Deletes the clip in this slot. Await the returned promise to ensure the
  * deletion has been fully processed.
  */
  deleteClip() {
    return invokeAsync(this.dataModel, this.dataModel.clipslotDeleteClip, this.handle);
  }
  /** @param length - Length of the clip in beats. */
  createMidiClip(length) {
    return createAsync(this.dataModel, this.objectRegistry, MidiClip, this.dataModel.clipslotCreateMidiClip, this.handle, length);
  }
  /**
  * Creates an audio clip in this session slot.
  *
  * @param args.filePath - Absolute path to the audio file.
  * @param args.isWarped - See {@link AudioTrack.createAudioClip}.
  * @param args.loopSettings - See {@link AudioTrack.createAudioClip}.
  */
  createAudioClip(args) {
    return createAsync(this.dataModel, this.objectRegistry, AudioClip, this.dataModel.clipslotCreateAudioClip, this.handle, {
      filePath: args.filePath,
      isWarped: args.isWarped,
      loopSettings: args.loopSettings
    });
  }
};
var DeviceParameter = class extends DataModelObject {
  static className = "DeviceParameter";
  get name() {
    return this.dataModel.deviceParameterGetName(this.handle);
  }
  get min() {
    return this.dataModel.deviceParameterGetInternalMin(this.handle);
  }
  get max() {
    return this.dataModel.deviceParameterGetInternalMax(this.handle);
  }
  get isQuantized() {
    return this.dataModel.deviceParameterGetIsQuantized(this.handle);
  }
  get defaultValue() {
    return this.dataModel.deviceParameterGetDefaultValue(this.handle);
  }
  get valueItems() {
    return this.dataModel.deviceParameterGetValueItems(this.handle);
  }
  getValue() {
    return new Promise((resolve) => {
      this.dataModel.deviceParameterGetInternalValue(this.handle, resolve);
    });
  }
  setValue(value) {
    return new Promise((resolve, reject) => {
      this.dataModel.withinTransaction(() => {
        this.dataModel.deviceParameterSetInternalValue(this.handle, value, resolve, (error) => reject(new Error(error)));
      });
    });
  }
};
var Device = class extends DataModelObject {
  static className = "Device";
  get name() {
    return this.dataModel.deviceGetName(this.handle);
  }
  get parameters() {
    return this.dataModel.deviceGetParameters(this.handle).map((handle) => this.objectRegistry.getObjectFromHandle(handle, DeviceParameter));
  }
};
var TakeLane = class extends DataModelObject {
  static className = "TakeLane";
  get clips() {
    return this.dataModel.takelaneGetClips(this.handle).map((handle) => this.objectRegistry.getObjectFromHandle(handle, Clip));
  }
  get name() {
    return this.dataModel.takelaneGetName(this.handle);
  }
  set name(value) {
    this.dataModel.withinTransaction(() => {
      this.dataModel.takelaneSetName(this.handle, value);
    });
  }
  /**
  * @param startTime - Position in the arrangement in beats.
  * @param duration - Length of the clip in beats.
  */
  createMidiClip(startTime, duration) {
    return createAsync(this.dataModel, this.objectRegistry, MidiClip, this.dataModel.takelaneCreateMidiClip, this.handle, startTime, duration);
  }
  /**
  * Creates an audio clip on this take lane. See {@link AudioTrack.createAudioClip}
  * for argument semantics.
  */
  createAudioClip(args) {
    return createAsync(this.dataModel, this.objectRegistry, AudioClip, this.dataModel.takelaneCreateAudioClip, this.handle, {
      duration: args.duration,
      filePath: args.filePath,
      isWarped: args.isWarped,
      loopSettings: args.loopSettings,
      startTime: args.startTime
    });
  }
};
var TrackMixer = class extends DataModelObject {
  static className = "MixerDevice";
  get volume() {
    return this.objectRegistry.getObjectFromHandle(this.dataModel.mixerdeviceGetVolume(this.handle), DeviceParameter);
  }
  get panning() {
    return this.objectRegistry.getObjectFromHandle(this.dataModel.mixerdeviceGetPanning(this.handle), DeviceParameter);
  }
  get sends() {
    return this.dataModel.mixerdeviceGetSends(this.handle).map((handle) => this.objectRegistry.getObjectFromHandle(handle, DeviceParameter));
  }
};
var Track = class Track2 extends DataModelObject {
  static className = "Track";
  get name() {
    return this.dataModel.trackGetName(this.handle);
  }
  set name(value) {
    this.dataModel.withinTransaction(() => {
      this.dataModel.trackSetName(this.handle, value);
    });
  }
  get mute() {
    return this.dataModel.trackGetMute(this.handle);
  }
  set mute(value) {
    this.dataModel.withinTransaction(() => {
      this.dataModel.trackSetMute(this.handle, value);
    });
  }
  get solo() {
    return this.dataModel.trackGetSolo(this.handle);
  }
  set solo(value) {
    this.dataModel.withinTransaction(() => {
      this.dataModel.trackSetSolo(this.handle, value);
    });
  }
  get mutedViaSolo() {
    return this.dataModel.trackGetMutedViaSolo(this.handle);
  }
  get arm() {
    return this.dataModel.trackGetArm(this.handle);
  }
  set arm(value) {
    this.dataModel.withinTransaction(() => {
      this.dataModel.trackSetArm(this.handle, value);
    });
  }
  get clipSlots() {
    return this.dataModel.trackGetClipSlots(this.handle).map((handle) => this.objectRegistry.getObjectFromHandle(handle, ClipSlot));
  }
  get takeLanes() {
    return this.dataModel.trackGetTakeLanes(this.handle).map((handle) => this.objectRegistry.getObjectFromHandle(handle, TakeLane));
  }
  get arrangementClips() {
    return this.dataModel.trackGetArrangementClips(this.handle).map((handle) => this.objectRegistry.getObjectFromHandle(handle, Clip));
  }
  get groupTrack() {
    const handle = this.dataModel.trackGetGroupTrack(this.handle);
    return handle ? this.objectRegistry.getObjectFromHandle(handle, Track2) : null;
  }
  get devices() {
    return this.dataModel.trackGetDevices(this.handle).map((handle) => this.objectRegistry.getObjectFromHandle(handle, Device));
  }
  get mixer() {
    return this.objectRegistry.getObjectFromHandle(this.dataModel.trackGetMixerDevice(this.handle), TrackMixer);
  }
  /** Appended to the end of {@link takeLanes}. */
  createTakeLane() {
    return createAsync(this.dataModel, this.objectRegistry, TakeLane, this.dataModel.trackCreateTakeLane, this.handle);
  }
  /**
  * Inserts a built-in Live device with its default preset into the track's device chain.
  * Only devices native to Live are supported — third-party plug-ins cannot be loaded this way.
  *
  * @param deviceName - The name of the built-in Live device (e.g. `"Reverb"`, `"Auto Filter"`).
  * @param index - Zero-based position in the device chain at which to insert.
  */
  insertDevice(deviceName, index) {
    return createAsync(this.dataModel, this.objectRegistry, Device, this.dataModel.trackInsertDevice, this.handle, deviceName, BigInt(index));
  }
  /**
  * Deletes a device from this track's device chain. Await the returned
  * promise to ensure the deletion has been fully processed.
  */
  deleteDevice(device) {
    return invokeAsync(this.dataModel, this.dataModel.trackDeleteDevice, this.handle, device.handle);
  }
  /** The duplicate is inserted directly after the original in the device chain. */
  duplicateDevice(device) {
    return createAsync(this.dataModel, this.objectRegistry, Device, this.dataModel.trackDuplicateDevice, this.handle, device.handle);
  }
  /**
  * Deletes an arrangement clip. For session clips, use {@link ClipSlot.deleteClip}.
  * Await the returned promise to ensure the deletion has been fully processed.
  */
  deleteClip(clip) {
    return invokeAsync(this.dataModel, this.dataModel.trackDeleteClip, this.handle, clip.handle);
  }
  /**
  * Deletes clips within the range. Clips that overlap a boundary are truncated
  * to the range edge rather than fully deleted.
  *
  * @param startTime - Start of the range in beats.
  * @param endTime - End of the range in beats.
  */
  clearClipsInRange(startTime, endTime) {
    return invokeAsync(this.dataModel, this.dataModel.trackClearClipsInRange, this.handle, startTime, endTime);
  }
};
var AudioTrack = class extends Track {
  static className = "AudioTrack";
  /**
  * Creates an audio clip from a file in the track's arrangement timeline.
  *
  * @param args.filePath - Absolute path to the audio file.
  * @param args.startTime - Position in the arrangement timeline in beats.
  * @param args.duration - Length of the clip on the arrangement timeline,
  *   in beats. Capped at the sample's natural length for non-looping clips;
  *   looping clips repeat to fill the full length. Defaults to the sample's
  *   natural length at the current tempo when omitted.
  * @param args.isWarped - Whether warping is enabled. Defaults to the clip's
  *   saved `.asd` settings if present, otherwise Live's "Auto-Warp" preference.
  *   Must be provided when `loopSettings` is provided.
  * @param args.loopSettings - Initial loop settings. Requires `isWarped` to be
  *   defined. If `isWarped` is `false`, `loopSettings.looping` must be `false`.
  *
  * @example
  * const clip = await track.createAudioClip({ filePath: '/samples/kick.wav', startTime: 0 });
  *
  * @example
  * const clip = await track.createAudioClip({
  *   filePath: '/samples/ambient.wav',
  *   startTime: 16,
  *   isWarped: false,
  * });
  *
  * @example
  * // Clip view: Start=beat 0, End=beat 2, Loop position=beat 0, Loop length=1 beat.
  * const clip = await track.createAudioClip({
  *   filePath: '/samples/loop.wav',
  *   startTime: 0,
  *   isWarped: true,
  *   loopSettings: { looping: true, startMarker: 0, endMarker: 2, loopStart: 0, loopEnd: 1 },
  * });
  *
  * @example
  * const clip = await track.createAudioClip({
  *   filePath: '/samples/loop.wav',
  *   startTime: 0,
  *   isWarped: true,
  *   duration: 8,
  *   loopSettings: { looping: true, startMarker: 0, endMarker: 2, loopStart: 0, loopEnd: 2 },
  * });
  */
  createAudioClip(args) {
    return createAsync(this.dataModel, this.objectRegistry, AudioClip, this.dataModel.trackCreateAudioClip, this.handle, {
      duration: args.duration,
      filePath: args.filePath,
      isWarped: args.isWarped,
      loopSettings: args.loopSettings,
      startTime: args.startTime
    });
  }
};
var CuePoint = class extends DataModelObject {
  static className = "CuePoint";
  get time() {
    return this.dataModel.cuePointGetTime(this.handle);
  }
  get name() {
    return this.dataModel.cuePointGetName(this.handle);
  }
  set name(value) {
    this.dataModel.withinTransaction(() => {
      this.dataModel.cuePointSetName(this.handle, value);
    });
  }
};
var MidiTrack = class extends Track {
  static className = "MidiTrack";
  /**
  * @param startTime - Position in the arrangement in beats.
  * @param duration - Length of the clip in beats.
  */
  createMidiClip(startTime, duration) {
    return createAsync(this.dataModel, this.objectRegistry, MidiClip, this.dataModel.trackCreateMidiClip, this.handle, startTime, duration);
  }
};
var Scene = class extends DataModelObject {
  static className = "Scene";
  get name() {
    return this.dataModel.sceneGetName(this.handle);
  }
  set name(value) {
    this.dataModel.withinTransaction(() => {
      this.dataModel.sceneSetName(this.handle, value);
    });
  }
  get tempo() {
    return this.dataModel.sceneGetTempo(this.handle);
  }
  get signatureNumerator() {
    return this.dataModel.sceneGetSignatureNumerator(this.handle);
  }
  get signatureDenominator() {
    return this.dataModel.sceneGetSignatureDenominator(this.handle);
  }
};
var Song = class extends DataModelObject {
  static className = "Song";
  /** Regular tracks only — excludes return tracks and the main track. */
  get tracks() {
    return this.dataModel.songGetTracks(this.handle).map((handle) => this.objectRegistry.getObjectFromHandle(handle, Track));
  }
  get returnTracks() {
    return this.dataModel.songGetReturnTracks(this.handle).map((handle) => this.objectRegistry.getObjectFromHandle(handle, Track));
  }
  get mainTrack() {
    return this.objectRegistry.getObjectFromHandle(this.dataModel.songGetMainTrack(this.handle), Track);
  }
  get scenes() {
    return this.dataModel.songGetScenes(this.handle).map((handle) => this.objectRegistry.getObjectFromHandle(handle, Scene));
  }
  get cuePoints() {
    return this.dataModel.songGetCuePoints(this.handle).map((handle) => this.objectRegistry.getObjectFromHandle(handle, CuePoint));
  }
  get tempo() {
    return this.dataModel.songGetTempo(this.handle);
  }
  set tempo(value) {
    this.dataModel.withinTransaction(() => {
      this.dataModel.songSetTempo(this.handle, value);
    });
  }
  /**
  * The current arrangement grid quantization. Use with {@link gridIsTriplet} to
  * determine the full grid setting.
  */
  get gridQuantization() {
    return this.dataModel.songGetGridQuantization(this.handle);
  }
  /**
  * Whether the arrangement grid uses triplet subdivisions of the current
  * {@link gridQuantization} value.
  */
  get gridIsTriplet() {
    return this.dataModel.songGetGridIsTriplet(this.handle);
  }
  /**
  * The root note of the scale currently selected in Live, as a MIDI note number
  * from 0 (C) to 11 (B).
  */
  get rootNote() {
    return Number(this.dataModel.songGetRootNote(this.handle));
  }
  /** The name of the scale selected in Live, as shown in the Current Scale Name chooser. */
  get scaleName() {
    return this.dataModel.songGetScaleName(this.handle);
  }
  /** Whether Live's Scale Mode is enabled. */
  get scaleMode() {
    return this.dataModel.songGetScaleMode(this.handle);
  }
  /** The intervals of the current scale as semitone offsets from the root note. */
  get scaleIntervals() {
    return this.dataModel.songGetScaleIntervals(this.handle).map(Number);
  }
  /** Inserted after the last selected track, or appended if no track is selected. */
  createAudioTrack() {
    return createAsync(this.dataModel, this.objectRegistry, AudioTrack, this.dataModel.songCreateAudioTrack, this.handle);
  }
  /** Inserted after the last selected track, or appended if no track is selected. */
  createMidiTrack() {
    return createAsync(this.dataModel, this.objectRegistry, MidiTrack, this.dataModel.songCreateMidiTrack, this.handle);
  }
  /**
  * @param index - 0-based insert position in the range `[0, song.scenes.length]`.
  * Pass `-1` to append at the end.
  */
  createScene(index) {
    return createAsync(this.dataModel, this.objectRegistry, Scene, this.dataModel.songCreateScene, this.handle, BigInt(index));
  }
  /**
  * Deletes a track from the song. Await the returned promise to ensure the
  * deletion has been fully processed.
  */
  deleteTrack(track) {
    return invokeAsync(this.dataModel, this.dataModel.songDeleteTrack, this.handle, track.handle);
  }
  /**
  * Deletes a scene from the song. Await the returned promise to ensure the
  * deletion has been fully processed.
  */
  deleteScene(scene) {
    return invokeAsync(this.dataModel, this.dataModel.songDeleteScene, this.handle, scene.handle);
  }
  /** Duplicates the track. The duplicate is inserted immediately after the original. */
  duplicateTrack(track) {
    return createAsync(this.dataModel, this.objectRegistry, Track, this.dataModel.songDuplicateTrack, this.handle, track.handle);
  }
  /** Duplicates the scene. The duplicate is inserted immediately after the original. */
  duplicateScene(scene) {
    return createAsync(this.dataModel, this.objectRegistry, Scene, this.dataModel.songDuplicateScene, this.handle, scene.handle);
  }
  /** @param time - Position in the arrangement in beats. */
  createCuePoint(time) {
    return createAsync(this.dataModel, this.objectRegistry, CuePoint, this.dataModel.songCreateCuePoint, this.handle, time);
  }
  /**
  * Deletes a cue point from the song. Await the returned promise to ensure
  * the deletion has been fully processed.
  */
  deleteCuePoint(cuePoint) {
    return invokeAsync(this.dataModel, this.dataModel.songDeleteCuePoint, this.handle, cuePoint.handle);
  }
};
var Application = class extends DataModelObject {
  static className = "Application";
  get song() {
    return this.objectRegistry.getObjectFromHandle(this.dataModel.rootGetSong(this.handle), Song);
  }
};
var Commands = class {
  module;
  /** @internal */
  constructor(module2) {
    this.module = module2;
  }
  /**
  * Registers a command that can be invoked by Live or via {@link Commands.executeCommand}.
  *
  * @param commandId - A unique string identifier for this command.
  * @param callback - Called when the command is invoked. May receive arguments passed by the invoker.
  */
  registerCommand(commandId, callback) {
    this.module.registerCommand(commandId, callback);
  }
  /**
  * Programmatically invokes a registered command.
  *
  * @param commandId - The ID of the command to invoke.
  * @param args - Arguments to pass to the command's callback.
  */
  executeCommand(commandId, ...args) {
    this.module.executeCommand(commandId, ...args);
  }
};
var ChainMixer = class extends DataModelObject {
  static className = "ChainMixerDevice";
  get volume() {
    return this.objectRegistry.getObjectFromHandle(this.dataModel.chainmixerdeviceGetVolume(this.handle), DeviceParameter);
  }
  get panning() {
    return this.objectRegistry.getObjectFromHandle(this.dataModel.chainmixerdeviceGetPanning(this.handle), DeviceParameter);
  }
  get sends() {
    return this.dataModel.chainmixerdeviceGetSends(this.handle).map((handle) => this.objectRegistry.getObjectFromHandle(handle, DeviceParameter));
  }
};
var Chain = class extends DataModelObject {
  static className = "Chain";
  get devices() {
    return this.dataModel.chainGetDevices(this.handle).map((handle) => this.objectRegistry.getObjectFromHandle(handle, Device));
  }
  get mixer() {
    return this.objectRegistry.getObjectFromHandle(this.dataModel.chainGetMixerDevice(this.handle), ChainMixer);
  }
  /**
  * Inserts a built-in Live device with its default preset into the chain.
  * Only devices native to Live are supported — third-party plug-ins cannot be loaded this way.
  *
  * @param deviceName - The name of the built-in Live device (e.g. `"Reverb"`, `"Auto Filter"`).
  * @param index - Zero-based position in the device chain at which to insert.
  */
  insertDevice(deviceName, index) {
    return createAsync(this.dataModel, this.objectRegistry, Device, this.dataModel.chainInsertDevice, this.handle, deviceName, BigInt(index));
  }
  /**
  * Deletes a device from this chain. Await the returned promise to ensure
  * the deletion has been fully processed.
  */
  deleteDevice(device) {
    return invokeAsync(this.dataModel, this.dataModel.chainDeleteDevice, this.handle, device.handle);
  }
  /** The duplicate is inserted directly after the original in the device chain. */
  duplicateDevice(device) {
    return createAsync(this.dataModel, this.objectRegistry, Device, this.dataModel.chainDuplicateDevice, this.handle, device.handle);
  }
};
var DrumChain = class extends Chain {
  static className = "DrumChain";
  get receivingNote() {
    return Number(this.dataModel.drumchainGetReceivingNote(this.handle));
  }
  set receivingNote(value) {
    this.dataModel.withinTransaction(() => {
      this.dataModel.drumchainSetReceivingNote(this.handle, BigInt(value));
    });
  }
};
var RackDevice = class extends Device {
  static className = "RackDevice";
  get chains() {
    return this.dataModel.rackdeviceGetChains(this.handle).map((handle) => this.objectRegistry.getObjectFromHandle(handle, Chain));
  }
  /** @param index - 0-based insert position in the range `[0, rack.chains.length]`. */
  insertChain(index) {
    return createAsync(this.dataModel, this.objectRegistry, Chain, this.dataModel.rackdeviceInsertChain, this.handle, BigInt(index));
  }
};
var DrumRack = class extends RackDevice {
  static className = "DrumRackDevice";
  get chains() {
    return this.dataModel.rackdeviceGetChains(this.handle).map((handle) => this.objectRegistry.getObjectFromHandle(handle, DrumChain));
  }
};
var Sample = class extends DataModelObject {
  static className = "Sample";
  get filePath() {
    return this.dataModel.sampleGetFilePath(this.handle);
  }
};
var Simpler = class extends Device {
  static className = "Simpler";
  get sample() {
    const handle = this.dataModel.simplerGetSample(this.handle);
    return handle ? this.objectRegistry.getObjectFromHandle(handle, Sample) : null;
  }
  /** Replaces the loaded sample with the audio file at the given absolute path. */
  replaceSample(filePath) {
    return createAsync(this.dataModel, this.objectRegistry, Sample, this.dataModel.simplerReplaceSample, this.handle, filePath);
  }
};
var dataModelClasses = [
  Application,
  Song,
  AudioTrack,
  MidiTrack,
  Track,
  AudioClip,
  MidiClip,
  Clip,
  ClipSlot,
  TakeLane,
  Simpler,
  DrumRack,
  RackDevice,
  Device,
  Sample,
  DrumChain,
  Chain,
  Scene,
  CuePoint,
  DeviceParameter,
  TrackMixer,
  ChainMixer
];
var DataModelObjectRegistry = class {
  cache = /* @__PURE__ */ new Map();
  dataModel;
  /** @internal */
  constructor(dataModel) {
    this.dataModel = dataModel;
  }
  getOrCreateObjectFromHandle(handle) {
    const cached = this.cache.get(handle.id);
    if (cached) return cached;
    const ModelClass = dataModelClasses.find((cls) => this.dataModel.getObjectIsOfClass(handle, cls.className));
    if (!ModelClass) throw new Error("Unknown object type");
    const obj = new ModelClass(handle, this.dataModel, this);
    this.cache.set(handle.id, obj);
    return obj;
  }
  /**
  * Resolves a {@link Handle} into a typed SDK object.
  *
  * Pass {@link DataModelObject} as `type` when the exact type of the handle is not known
  * in advance, then use `instanceof` to branch on the actual type:
  *
  * ```ts
  * const obj = objects.getObjectFromHandle(handle, DataModelObject);
  * if (obj instanceof ClipSlot) {
  *   // ...
  * }
  * ```
  *
  * Throws if the underlying object has been deleted, if it is of a different
  * type than `type`, or if its type is not recognised.
  *
  * @param handle - The handle to resolve.
  * @param type - The expected SDK class (e.g. `ClipSlot`).
  */
  getObjectFromHandle(handle, type) {
    const obj = this.getOrCreateObjectFromHandle(handle);
    if (!(obj instanceof type)) throw new Error("Object of incorrect type");
    return obj;
  }
};
var Environment = class {
  module;
  /** @internal */
  constructor(module2) {
    this.module = module2;
  }
  /**
  * Per-extension directory for persistent storage. Use it for configuration, credentials,
  * and cached state — anything that should survive across Live sessions.
  */
  get storageDirectory() {
    return this.module.storageDirectory;
  }
  /**
  * Per-extension directory for temporary files, such as intermediate audio or analysis
  * results. May be cleaned up between sessions.
  */
  get tempDirectory() {
    return this.module.tempDirectory;
  }
  /** Live's current UI language as an uppercase ISO 639-1 code (e.g. `"EN"`, `"DE"`, `"JA"`). */
  get language() {
    return this.module.language;
  }
};
var Resources = class {
  module;
  /** @internal */
  constructor(module2) {
    this.module = module2;
  }
  /**
  * Renders the pre-effects audio of a track in the arrangement between two beat
  * positions. Returns a path to a WAV file written to the extension's temp directory.
  */
  renderPreFxAudio(track, startTime, endTime) {
    return new Promise((resolve, reject) => {
      this.module.renderPreFxAudio(track.handle, {
        endTime,
        startTime
      }, resolve, reject);
    });
  }
  /**
  * Copies a file into the Live project folder so that Live manages it.
  * Returns the path to the imported copy. Use the returned path in subsequent API
  * calls, not the original.
  */
  importIntoProject(filePath) {
    return new Promise((resolve, reject) => {
      this.module.importIntoProject(filePath, resolve, reject);
    });
  }
};
var toProgressOptions = (text, progress) => typeof progress === "number" ? {
  progress,
  text
} : { text };
var Ui = class {
  module;
  /** @internal */
  constructor(module2) {
    this.module = module2;
  }
  /**
  * Registers a context menu action in the given {@link ContextMenuScope}.
  *
  * When the user triggers the action, Live invokes the command identified by
  * `commandId`. Depending on the scope, the command receives either the triggered
  * object's {@link Handle}, an {@link ArrangementSelection}, or a
  * {@link ClipSlotSelection} as its first argument.
  *
  * Returns a function that unregisters the action when called.
  */
  registerContextMenuAction(scope, title, commandId) {
    return new Promise((resolve) => {
      this.module.registerContextMenuAction(scope, title, commandId, (unregister) => {
        resolve(() => new Promise((done) => {
          unregister(done);
        }));
      });
    });
  }
  /**
  * Opens a modal dialog that loads the given URL. Supported URL schemes are
  * `file:`, `data:`, `https:`, and `http://localhost`.
  *
  * To return a result and close the dialog, the dialog's HTML must post the message
  * `{ method: "close_and_send", params: [resultString] }` to the host's message
  * handler — `window.webkit.messageHandlers.live.postMessage` on macOS or
  * `window.chrome.webview.postMessage` on Windows. The returned promise resolves
  * with that string.
  *
  * Rejects if `url` is malformed or an unexpected error occurred.
  */
  showModalDialog(url, width, height) {
    return new Promise((resolve, reject) => {
      this.module.showModalDialog(url, width, height, resolve, reject);
    });
  }
  /**
  * Shows a progress dialog while `callback` runs.
  * The callback receives an `update` function to change the text/progress
  * (progress is a percentage, 0–100), and an `AbortSignal` that fires if
  * the user cancels the dialog.
  * The dialog closes automatically when the callback resolves or rejects.
  *
  * @example
  * ```ts
  * const wavPath = await ui.withinProgressDialog(
  *   "Rendering audio…",
  *   { progress: 0 },
  *   async (update, signal) => {
  *     await update("Analysing…", 30);
  *     if (signal.aborted) return;
  *     await update("Rendering…", 70);
  *     return await resources.renderPreFxAudio(track, startBeat, endBeat);
  *   },
  * );
  * ```
  */
  withinProgressDialog(text, options, callback) {
    const ac = new AbortController();
    return new Promise((resolve, reject) => {
      this.module.showProgressDialog(toProgressOptions(text, options.progress), ({ update, close }) => {
        const asyncUpdate = (updateText, progress) => new Promise((resolveUpdate) => {
          update(toProgressOptions(updateText, progress), resolveUpdate);
        });
        const asyncClose = () => new Promise((done) => {
          close(done);
        });
        callback(asyncUpdate, ac.signal).finally(asyncClose).then(resolve).catch(reject);
      }, () => {
        ac.abort();
      });
    });
  }
};
var initialize = (context, apiVersion) => {
  const { commands, dataModel, environment, resources, ui } = context.initializeExtensionHost({ apiVersion });
  const objectRegistry = new DataModelObjectRegistry(dataModel);
  return {
    application: objectRegistry.getObjectFromHandle(dataModel.getRoot(), Application),
    commands: new Commands(commands),
    environment: new Environment(environment),
    getObjectFromHandle: objectRegistry.getObjectFromHandle.bind(objectRegistry),
    resources: new Resources(resources),
    ui: new Ui(ui),
    withinTransaction: dataModel.withinTransaction.bind(dataModel)
  };
};

// src/extension.ts
function activate(activation) {
  const context = initialize(activation, "1.0.0");
  const deviceName = "Utility";
  context.commands.registerCommand("fadercollapse.trackGainReset", async () => {
    try {
      const tracks = getAllTracks(context);
      if (!tracks.length) {
        console.warn("[fadercollapse] No tracks found in the song.");
        return;
      }
      for (const track of tracks) {
        await insertUtilityDevice(track, deviceName);
      }
    } catch (error) {
      console.error("[fadercollapse] Failed to add trackGainReset utility to tracks", error);
    }
  });
  context.ui.registerContextMenuAction("AudioTrack", "Collapse Fader to Utility", "fadercollapse.trackGainReset");
  context.ui.registerContextMenuAction("MidiTrack", "Collapse Fader to Utility", "fadercollapse.trackGainReset");
  context.ui.registerContextMenuAction("AudioTrack.ArrangementSelection", "Collapse Fader to Utility", "fadercollapse.trackGainReset");
  context.ui.registerContextMenuAction("MidiTrack.ArrangementSelection", "Collapse Fader to Utility", "fadercollapse.trackGainReset");
}
function getAllTracks(context) {
  const song = context.application.song;
  return [...song.tracks, ...song.returnTracks];
}
async function insertUtilityDevice(track, deviceName) {
  const sourceParam = track.mixer.volume;
  const sourceValue = await sourceParam.getValue();
  const sourceMin = sourceParam.min;
  const sourceMax = sourceParam.max;
  const sourceDefault = sourceParam.defaultValue;
  let utilityDevice;
  let isExistingDevice = false;
  if (track.devices.length > 0) {
    const lastDevice = track.devices[track.devices.length - 1];
    if (lastDevice.name === deviceName) {
      utilityDevice = lastDevice;
      isExistingDevice = true;
      console.log(`[fadercollapse] Found existing ${deviceName} as last device on track: ${track.name}`);
    } else {
      const insertIndex = track.devices.length;
      utilityDevice = await track.insertDevice(deviceName, insertIndex);
      console.log(`[fadercollapse] Inserted new ${deviceName} into track: ${track.name}`);
    }
  } else {
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
  const faderDb = faderNormalizedToDb(sourceValue);
  const beforeGainDb = await getParameterDbValue(gainParameter);
  let targetDb;
  if (isExistingDevice) {
    targetDb = beforeGainDb + faderDb;
  } else {
    const defaultGainDb = await getParameterDbValue({
      name: gainParameter.name,
      getValue: async () => targetDefault,
      min: targetMin,
      max: targetMax
    });
    targetDb = defaultGainDb + faderDb;
  }
  const targetValue = await convertDbToParameterValue(targetDb, gainParameter);
  const clampedTargetValue = Math.max(targetMin, Math.min(targetMax, targetValue));
  await gainParameter.setValue(clampedTargetValue);
  const afterGainValue = await gainParameter.getValue();
  console.log(
    `[fadercollapse] track=${track.name} faderDb=${faderDb.toFixed(2)}dB level=${sourceValue.toFixed(4)} \u2192 ${(sourceDefault ?? 0.85).toFixed(4)} | ${gainParameter.name}: ${beforeGainValue.toFixed(4)} \u2192 ${afterGainValue.toFixed(4)} (targetDb=${targetDb.toFixed(2)}dB)`
  );
  if (faderDb < -6) {
    const debugLines = [];
    debugLines.push(`[DIAGNOSTICS] DETAILED MATHEMATICAL FLOW TRACE FOR TRACK: "${track.name}" (Fader is at ${faderDb.toFixed(2)}dB which is below -6.0dB)`);
    const faderTrace = traceFaderNormalizedToDb(sourceValue);
    debugLines.push(`  * STEP 1: Translating source fader level ${sourceValue.toFixed(6)} to decibels:`);
    debugLines.push(...faderTrace.trace.map((line) => `    ${line}`));
    const beforeDbTrace = await traceGetParameterDbValue(beforeGainValue, gainParameter);
    debugLines.push(`  * STEP 2: Retrieving previous Utility device gain/output level in decibels:`);
    debugLines.push(...beforeDbTrace.trace.map((line) => `    ${line}`));
    debugLines.push(`  * STEP 3: Decibel target calculation:`);
    if (isExistingDevice) {
      debugLines.push(`    Accumulating on existing device: targetDb = beforeGainDb + faderDb = ${beforeGainDb.toFixed(4)} + ${faderDb.toFixed(4)} = ${targetDb.toFixed(4)} dB`);
    } else {
      const defaultGainDb = await getParameterDbValue({
        name: gainParameter.name,
        getValue: async () => targetDefault,
        min: targetMin,
        max: targetMax
      });
      debugLines.push(`    Calculating for new device from default gain: targetDb = defaultGainDb + faderDb = ${defaultGainDb.toFixed(4)} + ${faderDb.toFixed(4)} = ${targetDb.toFixed(4)} dB`);
    }
    const targetValTrace = await traceConvertDbToParameterValue(targetDb, gainParameter);
    debugLines.push(`  * STEP 4: Mapping target decibels ${targetDb.toFixed(4)}dB to Utility parameter value:`);
    debugLines.push(...targetValTrace.trace.map((line) => `    ${line}`));
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
  if (typeof sourceDefault === "number") {
    await sourceParam.setValue(sourceDefault);
  }
}
function findGainParameter(device) {
  const nameMatcher = (name) => name.toLowerCase() === "gain" || name.toLowerCase().includes("gain");
  const outputMatcher = (name) => name.toLowerCase() === "output" || name.toLowerCase().includes("output");
  const fallbackParameter = device.parameters.find((parameter) => {
    const name = parameter.name.toLowerCase();
    return !["device on", "mute", "channel mode", "left inv", "right inv", "stereo width", "mono", "bass mono", "bass freq", "balance", "dc filter"].includes(name);
  });
  return device.parameters.find((parameter) => nameMatcher(parameter.name)) || device.parameters.find((parameter) => parameter.name.toLowerCase().includes("volume")) || device.parameters.find((parameter) => outputMatcher(parameter.name)) || fallbackParameter || null;
}
async function logDeviceParameters(message, device) {
  const entries = await Promise.all(
    device.parameters.map(async (parameter) => {
      try {
        return {
          name: parameter.name,
          value: await parameter.getValue(),
          min: parameter.min,
          max: parameter.max,
          defaultValue: parameter.defaultValue,
          isQuantized: parameter.isQuantized
        };
      } catch (error) {
        return { name: parameter.name, error: String(error) };
      }
    })
  );
  console.log(`[fadercollapse] ${message}: ${JSON.stringify(entries)}`);
}
var FADER_TABLE = [
  [0, -100],
  [0.009662616066634655, -66.5],
  [0.03462362661957741, -60],
  [0.05364469811320305, -56.5],
  [0.09134812653064728, -50],
  [0.11301174759864807, -46.5],
  [0.13266687095165253, -43.5],
  [0.15697653591632843, -40],
  [0.18312020599842072, -36.5],
  [0.20736896991729736, -33.5],
  [0.23843887448310852, -30],
  [0.27357277274131775, -26.5],
  [0.30869895219802856, -23.5],
  [0.3599998652935028, -20],
  [0.43745651841163635, -16.5],
  [0.5124568939208984, -13.5],
  [0.6000000238418579, -10],
  [0.7, -6],
  [0.8500000238418579, 0],
  [1, 6]
];
function buildHermiteSpline(points) {
  const n = points.length;
  const x = points.map((p) => p[0]);
  const y = points.map((p) => p[1]);
  const m = new Array(n).fill(0);
  const delta = new Array(n - 1);
  for (let i = 0; i < n - 1; i++) {
    delta[i] = (y[i + 1] - y[i]) / (x[i + 1] - x[i]);
  }
  for (let i = 1; i < n - 1; i++) {
    if (delta[i - 1] * delta[i] > 0) {
      m[i] = 2 * delta[i - 1] * delta[i] / (delta[i - 1] + delta[i]);
    } else {
      m[i] = 0;
    }
  }
  m[0] = delta[0];
  m[n - 1] = delta[n - 2];
  return { x, y, m };
}
function evaluateHermiteSpline(spline, targetX) {
  const { x, y, m } = spline;
  const n = x.length;
  if (targetX <= x[0]) return y[0];
  if (targetX >= x[n - 1]) return y[n - 1];
  let low = 0;
  let high = n - 1;
  while (high - low > 1) {
    const mid = low + high >> 1;
    if (x[mid] <= targetX) {
      low = mid;
    } else {
      high = mid;
    }
  }
  const i = low;
  const h = x[i + 1] - x[i];
  const t = (targetX - x[i]) / h;
  const h00 = 1 - 3 * t * t + 2 * t * t * t;
  const h10 = t - 2 * t * t + t * t * t;
  const h01 = 3 * t * t - 2 * t * t * t;
  const h11 = t * t * t - t * t;
  return h00 * y[i] + h10 * h * m[i] + h01 * y[i + 1] + h11 * h * m[i + 1];
}
function traceEvaluateHermiteSpline(spline, targetX, name) {
  const trace = [];
  const { x, y, m } = spline;
  const n = x.length;
  trace.push(`[Trace Spline ${name}] Input = ${targetX.toFixed(6)}`);
  if (targetX <= x[0]) {
    trace.push(`[Trace Spline ${name}] Input <= boundary min ${x[0].toFixed(6)}. Returning boundary max/min ${y[0].toFixed(4)}`);
    return { result: y[0], trace };
  }
  if (targetX >= x[n - 1]) {
    trace.push(`[Trace Spline ${name}] Input >= boundary max ${x[n - 1].toFixed(6)}. Returning boundary max/min ${y[n - 1].toFixed(4)}`);
    return { result: y[n - 1], trace };
  }
  let low = 0;
  let high = n - 1;
  while (high - low > 1) {
    const mid = low + high >> 1;
    if (x[mid] <= targetX) {
      low = mid;
    } else {
      high = mid;
    }
  }
  const i = low;
  const h = x[i + 1] - x[i];
  const t = (targetX - x[i]) / h;
  const h00 = 1 - 3 * t * t + 2 * t * t * t;
  const h10 = t - 2 * t * t + t * t * t;
  const h01 = 3 * t * t - 2 * t * t * t;
  const h11 = t * t * t - t * t;
  const term1 = h00 * y[i];
  const term2 = h10 * h * m[i];
  const term3 = h01 * y[i + 1];
  const term4 = h11 * h * m[i + 1];
  const res = term1 + term2 + term3 + term4;
  trace.push(`[Trace Spline ${name}] Found interval index ${i}: [${x[i].toFixed(6)}, ${y[i].toFixed(4)}] to [${x[i + 1].toFixed(6)}, ${y[i + 1].toFixed(4)}]`);
  trace.push(`[Trace Spline ${name}] Fractional t = (${targetX.toFixed(6)} - ${x[i].toFixed(6)}) / ${h.toFixed(6)} = ${t.toFixed(6)}`);
  trace.push(`[Trace Spline ${name}] Tangents: m[i] = ${m[i].toFixed(4)}, m[i+1] = ${m[i + 1].toFixed(4)}`);
  trace.push(`[Trace Spline ${name}] Hermite weights: h00 = ${h00.toFixed(4)}, h10 = ${h10.toFixed(4)}, h01 = ${h01.toFixed(4)}, h11 = ${h11.toFixed(4)}`);
  trace.push(`[Trace Spline ${name}] Terms: term1 = ${term1.toFixed(4)}, term2 = ${term2.toFixed(4)}, term3 = ${term3.toFixed(4)}, term4 = ${term4.toFixed(4)}`);
  trace.push(`[Trace Spline ${name}] Result = ${res.toFixed(4)}`);
  return { result: res, trace };
}
var faderToDbSpline = buildHermiteSpline(FADER_TABLE);
var dbToFaderSpline = buildHermiteSpline(FADER_TABLE.map(([v, db]) => [db, v]));
function parseDbString(s) {
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
async function valueToDbNative(parameter, val) {
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
      }
    }
  }
  return null;
}
async function dbToValueNative(parameter, db) {
  const testDb = await valueToDbNative(parameter, 0);
  if (testDb === null) {
    return null;
  }
  const min = parameter.min ?? -1;
  const max = parameter.max ?? 1;
  if (db <= -135) return min;
  if (db >= 35) return max;
  let low = min;
  let high = max;
  let bestVal = (min + max) / 2;
  let bestDiff = Infinity;
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
function faderNormalizedToDb(v) {
  if (v <= 1e-7) return -Infinity;
  if (v >= 1) return 6;
  const db = evaluateHermiteSpline(faderToDbSpline, v);
  return db <= -99.9 ? -Infinity : db;
}
function dbToFaderNormalized(db) {
  if (!isFinite(db) || db <= -100) return 0;
  if (db >= 6) return 1;
  return evaluateHermiteSpline(dbToFaderSpline, db);
}
function dbToOutputNormalized(db) {
  if (!isFinite(db) || db <= -139) return -1;
  if (db >= 35) return 1;
  if (db >= -16.9) {
    return db / 35;
  } else {
    const B = 40.3;
    const a = 1.35827;
    return a * Math.pow(10, db / B) - 1;
  }
}
function outputNormalizedToDb(y) {
  if (y <= -1) return -Infinity;
  if (y >= 1) return 35;
  if (y >= -0.48285714) {
    return y * 35;
  } else {
    const B = 40.3;
    const a = 1.35827;
    const val = (y + 1) / a;
    if (val <= 0) return -Infinity;
    return B * Math.log10(val);
  }
}
async function getParameterDbValue(parameter) {
  const value = await parameter.getValue();
  const min = parameter.min ?? -Infinity;
  const max = parameter.max ?? Infinity;
  const name = parameter.name.toLowerCase();
  const nativeDb = await valueToDbNative(parameter, value);
  if (nativeDb !== null) {
    return nativeDb;
  }
  if (name === "volume" || name === "mixer_device.volume") {
    return faderNormalizedToDb(value);
  }
  if (name === "output" || name.includes("output")) {
    if (Math.abs(min - -1) < 0.1 && Math.abs(max - 1) < 0.1) {
      return outputNormalizedToDb(value);
    }
    if (Math.abs(min - 0) < 0.1 && Math.abs(max - 1) < 0.1) {
      const y = value * 2 - 1;
      return outputNormalizedToDb(y);
    }
    return value;
  }
  if (name === "gain" || name.includes("gain")) {
    if (Math.abs(min - -1) < 0.1 && Math.abs(max - 1) < 0.1) {
      return outputNormalizedToDb(value);
    }
    if (Math.abs(min - 0) < 0.1 && Math.abs(max - 1) < 0.1) {
      const y = value * 2 - 1;
      return outputNormalizedToDb(y);
    }
    if (min <= -40 && max >= 30) {
      return value;
    }
  }
  return value;
}
async function convertDbToParameterValue(db, parameter) {
  const min = parameter.min ?? -Infinity;
  const max = parameter.max ?? Infinity;
  const name = parameter.name.toLowerCase();
  const nativeValue = await dbToValueNative(parameter, db);
  if (nativeValue !== null) {
    return nativeValue;
  }
  if (name === "volume" || name === "mixer_device.volume") {
    return dbToFaderNormalized(db);
  }
  if (name === "output" || name.includes("output")) {
    if (Math.abs(min - -1) < 0.1 && Math.abs(max - 1) < 0.1) {
      return dbToOutputNormalized(db);
    }
    if (Math.abs(min - 0) < 0.1 && Math.abs(max - 1) < 0.1) {
      const y = dbToOutputNormalized(db);
      return (y + 1) / 2;
    }
    return db;
  }
  if (name === "gain" || name.includes("gain")) {
    if (Math.abs(min - -1) < 0.1 && Math.abs(max - 1) < 0.1) {
      return dbToOutputNormalized(db);
    }
    if (Math.abs(min - 0) < 0.1 && Math.abs(max - 1) < 0.1) {
      const y = dbToOutputNormalized(db);
      return (y + 1) / 2;
    }
    if (min <= -40 && max >= 30) {
      return db;
    }
  }
  return db;
}
function traceFaderNormalizedToDb(v) {
  const trace = [];
  trace.push(`[Trace Fader->dB] Input v = ${v.toFixed(6)}`);
  if (v <= 1e-7) {
    trace.push(`[Trace Fader->dB] Input is below/equal threshold 1e-7. Returning -Infinity`);
    return { db: -Infinity, trace };
  }
  if (v >= 1) {
    trace.push(`[Trace Fader->dB] Input is >= 1.0. Returning 6.0`);
    return { db: 6, trace };
  }
  const sub = traceEvaluateHermiteSpline(faderToDbSpline, v, "Fader->dB");
  trace.push(...sub.trace.map((line) => `  ${line}`));
  const dbResult = sub.result <= -99.9 ? -Infinity : sub.result;
  return { db: dbResult, trace };
}
function traceDbToOutputNormalized(db) {
  const trace = [];
  trace.push(`[Trace dB->Output] Input db = ${db.toFixed(4)}`);
  if (!isFinite(db) || db <= -139) {
    trace.push(`[Trace dB->Output] Input is non-finite or <= -139.0. Returning -1.0`);
    return { val: -1, trace };
  }
  if (db >= 35) {
    trace.push(`[Trace dB->Output] Input is >= 35.0. Returning 1.0`);
    return { val: 1, trace };
  }
  if (db >= -16.9) {
    const result = db / 35;
    trace.push(`[Trace dB->Output] db >= -16.9 (linear range). Result = ${db.toFixed(4)} / 35.0 = ${result.toFixed(6)}`);
    return { val: result, trace };
  } else {
    const B = 40.3;
    const a = 1.35827;
    const power = Math.pow(10, db / B);
    const result = a * power - 1;
    trace.push(`[Trace dB->Output] db < -16.9 (exponential range). Formula: y = a * 10^(db/B) - 1.0`);
    trace.push(`[Trace dB->Output] Params: a = ${a}, B = ${B}, power = 10^(${db.toFixed(4)} / ${B}) = ${power.toFixed(8)}`);
    trace.push(`[Trace dB->Output] Result = ${a} * ${power.toFixed(8)} - 1.0 = ${result.toFixed(6)}`);
    return { val: result, trace };
  }
}
async function traceGetParameterDbValue(value, parameter) {
  const trace = [];
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
    trace.push(...sub.trace.map((line) => `  ${line}`));
    return { db: sub.db, trace };
  }
  if (name === "output" || name.includes("output")) {
    if (Math.abs(min - -1) < 0.1 && Math.abs(max - 1) < 0.1) {
      const sub = traceOutputNormalizedToDb(value);
      trace.push(...sub.trace.map((line) => `  ${line}`));
      return { db: sub.db, trace };
    }
    if (Math.abs(min - 0) < 0.1 && Math.abs(max - 1) < 0.1) {
      const y = value * 2 - 1;
      trace.push(`[Trace getParamDb] Output is scaled [0,1]->[-1,1]: y = ${value.toFixed(6)} * 2 - 1 = ${y.toFixed(6)}`);
      const sub = traceOutputNormalizedToDb(y);
      trace.push(...sub.trace.map((line) => `  ${line}`));
      return { db: sub.db, trace };
    }
    trace.push(`[Trace getParamDb] Returning value directly: ${value.toFixed(4)}`);
    return { db: value, trace };
  }
  if (name === "gain" || name.includes("gain")) {
    if (Math.abs(min - -1) < 0.1 && Math.abs(max - 1) < 0.1) {
      const sub = traceOutputNormalizedToDb(value);
      trace.push(...sub.trace.map((line) => `  ${line}`));
      return { db: sub.db, trace };
    }
    if (Math.abs(min - 0) < 0.1 && Math.abs(max - 1) < 0.1) {
      const y = value * 2 - 1;
      trace.push(`[Trace getParamDb] Gain is scaled [0,1]->[-1,1]: y = ${value.toFixed(6)} * 2 - 1 = ${y.toFixed(6)}`);
      const sub = traceOutputNormalizedToDb(y);
      trace.push(...sub.trace.map((line) => `  ${line}`));
      return { db: sub.db, trace };
    }
    if (min <= -40 && max >= 30) {
      trace.push(`[Trace getParamDb] Gain is direct dB [${min}, ${max}]. Returning ${value.toFixed(4)}`);
      return { db: value, trace };
    }
  }
  trace.push(`[Trace getParamDb] Default fallback. Returning value directly: ${value.toFixed(4)}`);
  return { db: value, trace };
}
function traceOutputNormalizedToDb(y) {
  const trace = [];
  trace.push(`[Trace Output->dB] Input y = ${y.toFixed(6)}`);
  if (y <= -1) {
    trace.push(`[Trace Output->dB] y <= -1.0. Returning -Infinity`);
    return { db: -Infinity, trace };
  }
  if (y >= 1) {
    trace.push(`[Trace Output->dB] y >= 1.0. Returning 35.0`);
    return { db: 35, trace };
  }
  if (y >= -0.48285714) {
    const result = y * 35;
    trace.push(`[Trace Output->dB] y >= -0.48285714 (linear range). Result = ${y.toFixed(6)} * 35.0 = ${result.toFixed(4)} dB`);
    return { db: result, trace };
  } else {
    const B = 40.3;
    const a = 1.35827;
    const val = (y + 1) / a;
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
async function traceConvertDbToParameterValue(db, parameter) {
  const trace = [];
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
    if (Math.abs(min - -1) < 0.1 && Math.abs(max - 1) < 0.1) {
      const sub = traceDbToOutputNormalized(db);
      trace.push(...sub.trace.map((line) => `  ${line}`));
      return { val: sub.val, trace };
    }
    if (Math.abs(min - 0) < 0.1 && Math.abs(max - 1) < 0.1) {
      const sub = traceDbToOutputNormalized(db);
      trace.push(...sub.trace.map((line) => `  ${line}`));
      const scaled = (sub.val + 1) / 2;
      trace.push(`[Trace dbToParam] Output range [0, 1]. Scaling mapped value: (${sub.val.toFixed(6)} + 1) / 2 = ${scaled.toFixed(6)}`);
      return { val: scaled, trace };
    }
    trace.push(`[Trace dbToParam] Fallback. Directly returning DB: ${db.toFixed(4)}`);
    return { val: db, trace };
  }
  if (name === "gain" || name.includes("gain")) {
    if (Math.abs(min - -1) < 0.1 && Math.abs(max - 1) < 0.1) {
      const sub = traceDbToOutputNormalized(db);
      trace.push(...sub.trace.map((line) => `  ${line}`));
      return { val: sub.val, trace };
    }
    if (Math.abs(min - 0) < 0.1 && Math.abs(max - 1) < 0.1) {
      const sub = traceDbToOutputNormalized(db);
      trace.push(...sub.trace.map((line) => `  ${line}`));
      const scaled = (sub.val + 1) / 2;
      trace.push(`[Trace dbToParam] Gain range [0, 1]. Scaling mapped value: (${sub.val.toFixed(6)} + 1) / 2 = ${scaled.toFixed(6)}`);
      return { val: scaled, trace };
    }
    if (min <= -40 && max >= 30) {
      trace.push(`[Trace dbToParam] Gain range covers standard dB [${min}, ${max}]. Returning raw DB: ${db.toFixed(4)}`);
      return { val: db, trace };
    }
  }
  trace.push(`[Trace dbToParam] Default Fallback. Directly returning DB: ${db.toFixed(4)}`);
  return { val: db, trace };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate
});
//# sourceMappingURL=extension.js.map
