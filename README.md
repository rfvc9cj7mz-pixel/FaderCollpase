# fadercollapse

Created for use when mixing and running broad stoke gain ajustments on tracks and groups using the track volume. Running the extension collapses all faders to unity by inserting a utility device as the last device on each track which mirrors that track's volume. It then resets the track's volume to unity, an area where fader adjustments are more subtle. Useful when mixing with a hardware controller.

# Installation

Download fadercollapse-1.0.0.ablx from this page
Open Ableton Live → Preferences → Extensions
Drag and drop the .ablx file onto the Extensions page
Requires the Ableton Live beta build that supports Extensions.

## Usage
Just click on any audio clip in your arrangement session and choose fadercollapse from the available extensions.
For subsequent passes the track volume changes will be applied to the existing Utility device added during the first pass.


## Scripts

```sh
npm start                  # build + run in Live's Extension Host
npm run build              # production bundle of src/extension.ts
npm run build:dev          # dev bundle (sourcemaps, not minified)
npm run package            # build for production + create a .ablx archive
```

## Created using:
..vibecoded with `@ableton-extensions/sdk` and Visual Studio Code.

## License
Creative Commons Univseral

