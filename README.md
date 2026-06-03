# fadercollapse

For use during the inital broad stroke track and group gain adjustments when mixing. Run the script to add a utility device as the last device on each track which matches the track volume before it then resets the track volume back to unity where fader adjustments are more subtle. 

Useful when mixing using a hardware controller. 

# Installation

Download fadercollapse-1.0.0.ablx from this page
Open Ableton Live → Preferences → Extensions
Drag and drop the .ablx file onto the Extensions page
Requires the Ableton Live beta build that supports Extensions.

## Usage
Just click on any audio clip in your arrangement view and choose fadercollapse from the available extensions.
For subsequent passes the track volume changes will be applied to the existing Utility device added during the first pass.

Known issues: mapping track volume to the gain on a utility device is not a 1:1 map. There is a slight difference between what the track volume was and the gain that will be applied to the Utility device.


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

