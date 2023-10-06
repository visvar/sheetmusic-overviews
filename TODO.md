# TODO

1. [TODO](#todo)
   1. [Parsing](#parsing)
   2. [Distance Metrics](#distance-metrics)
   3. [Color Mapping](#color-mapping)
   4. [UI](#ui)
   5. [Note Rendering](#note-rendering)
   6. [Views](#views)
   7. [Future work](#future-work)

## Parsing

- [feature] parse .gp files with alphatab into a ~~MusicPiece~~ new data structure
  - [x] basic parsing
  - [ ] note timing
  - [ ] fix duplicate notes
  - [ ] handle repetitions by copying bars
  - [ ] make sure tempi such as 6/8 work

## Distance Metrics

- metric that takes rhythm into account, levenshtein of both pitch and start, maybe also duration, differently weighted

## Color Mapping

- [feature] color each bar by metrics
  - note density
  - note count
  - variance of pitch, duration, ...
  - ratio of pauses to notes
  - ...
- [feature] color each bar/chord by scale
  - key detection: https://tonaljs.github.io/tonal/module-Detect.html#~scale
- [performance] make clustering more performant by not reclustering on threshold change
  - or at least debounce
- [performance] only remap colors when changing scale, do not recompute DR etc!
- [feature] allow coloring compressed by sections
- [feature] clustering with brightness for within-cluster similarity
  - colors for each cluster
  - for bars within each cluster, assign brightness by leaf ordering

## UI

- show note color legend in tree when notes are shown
- player
  - [bug] seems one bar ahead for some pieces
- make showTrailingRests global
- show meter and tempo changes in tracks view
    - also draw ticks for bars numbers
    - Add tempo curve to tracks view
    - And time signature labels
- metronome, mute player (or just gain slider)
  - easy with alphatab

- tuning pitches parsed incorrectly when showing staff and tab
- expand repetitions in XML for consistent display over all views

- [feature] PDF export of colored sheet music (lib/pdf.js)
  - [bug] export currently sometimes only exports part of the score, cutting of at some width and height
  - allow paged mode (currently messes up coloring)
  - fix tab notes not being exported correctly, see https://github.com/opensheetmusicdisplay/opensheetmusicdisplay/issues/1371

- [cleanup] remove smui
  - view menu
  - player
  - keep for modals

## Note Rendering

- detect instrument and select note rendering automatically? or suggest and let user apply/cancel
- [feature] drum note encoding

## Views

- [readability] make borders around highlighted things thicker, eg in tree view

- score
  - [bug] avoid colored rects overlapping the ones in the next bar row by finding the next larger y and taking the min(yBottomCurrentRow, yTopNextRow-10)
  - bounding boxes are wrong sometimes
  - does not work for some musicxml files
  - [feature] animate scrolling a bit, maybe ease-in

- compressed
  - should scroll to show current bar in center or left

- compact
  - [bug] compact view does not work when another than the first track selected
    - leading rests causes it, probably wrong measure times
  - [readability] repeated notes should also work for repeated chords
  - colored line above section/motif, to better see when the same color comes twice in a row, where the new part starts

- tab view
  - [feature] render guitar tabs with alphatab
    - [x] integrate alphatab and render an example
    - [ ] render musicxml or .gp
    - [ ] colorize bars
    - [ ] highlighting and interaction
    - [x] allow to toggle notes (to only show tab)
    - [ ] allow to make bars same width https://github.com/CoderLine/alphaTab/discussions/1183#discussioncomment-6206027

## Future work

- [concept] two-dimensional color map for two metrics at once, e.g., rhythmic and melodic similarity
- [feature] allow playing only current selection/loop it
- [feature] allow to select multiple consecutive bars
   - selection of two consecutive sequences of bars, comparison of two selections
- allow to see multiple instruments at the same time and compare them
- allow to manually assign colors to selections to overwrite coloring, apply to other occurrences automatically
- include metrics as a coloring source
- try to add section labels to compressed as well
- get colors from compressed blocks: each block that is repeated or in between reps gets its own color
- new note encoding
  - drums
  - staff
- support 7-string guitar, 4-string bass, etc
  - check tuning pitches to get the number of strings, then compute bbox of measures from that?
  - sheet
  - score
- drum playback
  - fix drum sound map
  - allow to use custom map from pitch to sound
- allow printing colored sheet music
- [feature] segment into motifs, riffs
   - most common ngrams, largest first
