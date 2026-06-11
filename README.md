# fadercollapse

For use during the inital broad stroke track and group gain adjustments when mixing multitracks. Run the script to add a utility device as the last device on each track which matches the track volume before it then resets the track volume back to unity where fader adjustments are more subtle. 

Useful when mixing using a hardware controller. 

Subsequent running of the script will adjust the gain on the existing utility device and reset track volume to unity.

# Installation

Download fadercollapse-1.0.2.ablx from the releases
Open Ableton Live → Preferences → Extensions
Drag and drop the .ablx file onto the Extensions page
Requires the Ableton Live beta build that supports Extensions.

## Usage
Just click on any audio clip in your arrangement view and choose fadercollapse from the available extensions.
For subsequent passes the track volume changes will be applied to the existing Utility device added during the first pass.


## Current Known Issues

There may be small gain errors on subsequent runs of the extension if there are large changes in gain due to difficulties mapping the track volume curve to the utility gain curve. These errors have been reduced to a minimum and contact me if you can model the conversion between the two more accurately. Thanks


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

