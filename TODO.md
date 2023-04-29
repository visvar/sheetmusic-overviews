# TODO

1. [TODO](#todo)
   1. [Distance Metrics](#distance-metrics)
   2. [Color Mapping](#color-mapping)
   3. [UI](#ui)
   4. [Views](#views)
   5. [Publication](#publication)
   6. [Future work](#future-work)


## Distance Metrics

- metric that takes rhythm into account, maybe like simeon's ie levenshtein of both pitch and start, maybe also duration, differently weighted
- levenshtein on only rhythm, not pitch


## Color Mapping

- [performance] make clustering more performant by not reclustering on threshold change
  - or at least debounce
- [performance] only remap colors when changing scale, do not recompute DR etc!
- [feature] allow coloring compressed by sections
- [feature] clustering with brightness for within-cluster similarity
  - colors for each cluster
  - for bars within each cluster, assign brightness by leaf ordering
- [feature] segment into motifs, riffs
   - most common ngrams, largest first


## UI

- show note color legend in tree when notes are shown
- player
  - [bug] seems one bar ahead for muse - hysteria
- make showTrailingRests global
- show meter and tempo changes in tracks view
    - also draw ticks for bars numbers
    - Add tempo curve to tracks view
    - And time signature labels
- metronome, mute player (or just gain slider)
  - easy with alphatab

- [usability] allow to jump between sections when pressing pgup pgdown
- [style] replace inputs with custom ones

- tuning pitches parsed incorrectly when showing staff and tab
- keyboard left and right arrows allow to select non-existent bars when there are repetitions

- [feature] PDF export of colored sheet music (lib/pdf.js)
  - allow paged mode (currently messes up coloring)
  - fix tab notes not being exported correctly, see https://github.com/opensheetmusicdisplay/opensheetmusicdisplay/issues/1371

## Views

- when only score/tab is shown, make it full width

- [readability] make borders around highlighted things thicker, eg in tree view

- tree
  - [feature] allow to compress only 1, 2, ... levels, has to be done in mvlib

- score
  - bounding boxes are wrong sometimes
  - OSMD does not work when tab has notes removed
  - does not work for some musicxml files
    - because of OSMD
      - fafners gold
      - master of puppets
      - iron man
  - show guitar capo, ...
  - [readability] make bars same width in score: https://github.com/opensheetmusicdisplay/opensheetmusicdisplay/issues/1314
  - [feature] animate scrolling a bit, maybe ease-in
  - [feature] highlight individual chords and notes? https://github.com/opensheetmusicdisplay/opensheetmusicdisplay/wiki/Exploring-the-Demo#drawing-overlay-lines-over-the-score-and-getting-a-notes-position

- compressed
  - should scroll to show current bar in center or left

- compact
  - [bug] compact view does not work when another than the first track selected
    - leading rests causes it, probably wrong measure times
    - bar background overdraws notes??
    - is switching the bug? try hardcoding track 2
  - [readability] repeated notes should also work for repeated chords
    - requires rendering chord for chord
  - colored line above section/motif, to better see when the same color comes twice in a row, where the new part starts

- tab view
  - [feature] render with alphatab
    - [ ] parse .gp files with alphatab into a MusicPiece
    - [x] integrate alphatab and render an example
    - [ ] render musicxml or .gp
    - [ ] colorize bars
    - [ ] highlighting and interaction
    - [x] allow to toggle notes (to only show tab)


## Publication

- [documentation] to showcase, visualize 1D positions or clustering tree with bars as glyphs
- add about modal
- update help model, explain every button and interaction
- github pages: https://hrishikeshpathak.com/blog/svelte-gh-pages
- publish https://observablehq.com/@fheyen/sequence-immediate-repetition-hierarchies
  - link to it from mvlib code


## Future work

- allow to select multiple consecutive bars
- allow playing only curent selection / loop it
- selection of two consecute sequences of bars
  - comparison of two selections
- allow to see multiple instruments at same time
- allow to manually assign colors to selections to overwrite coloring
- MoshViz:
  - support same simplified encoding: each bar, display pitch range and mean (mean weighted by note duration)
  - include metrics as coloring source
- try to add section labels to compressed as well
- get colors from compressed blocks: each block that is repeated or in between reps gets its own color
- new note encodings
  - drums
  - staff
- support 7 string guitar, 4 string bass etc
  - check tuning pitches to get number of strings, then compute bbox of measures from that?
  - sheet
  - score
- drum playback
  - fix drum sound map
  - allow to use custom map from pitch to sound
- allow printing colored sheet music
