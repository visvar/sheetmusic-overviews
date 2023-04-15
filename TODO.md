# TODO

1. [TODO](#todo)
   1. [Urgent](#urgent)
   2. [Features](#features)
2. [Performance](#performance)
   1. [Bugs](#bugs)
   2. [Publication](#publication)
   3. [minor](#minor)
   4. [major](#major)
   5. [Future work](#future-work)

## Urgent

- OSMD does not work when tab has notes removed

- compact viewdoes not work when another than the first track selected
  - leading rests causes it,probably wrong measure times
  - bar background overdraws notes??
  - is switching the bug? try hardcoding track 2
- metric that takes rhythm into account, maybe like simeon's ie levenshtein of both pitch and start, maybe also duration, differently weighted

- show note color legend in tree wehn notes are shown

- allow coloring compressed by sections

- player
  - seems one bar ahead for muse - hysteria

## Features

- make showTrailingRests global
- compact repeated notes should also work for repeated chords
  - requires rendering chord for chord
- tree
  - allow to compress only 1, 2, ... levels, has to be done in mvlib

# Performance

- make clustering more performant by not reclustering on threshold change
- only remap colors when changing scale, do not recompute DR etc!

## Bugs

- does not work for some musicxml files
  - because of OSMD
    - fafners gold
    - master of puppets
    - iron man

## Publication

- add about modal
- update help model, explain every button and interaction
- github pages: https://hrishikeshpathak.com/blog/svelte-gh-pages
- publish https://observablehq.com/@fheyen/sequence-immediate-repetition-hierarchies
  - link to it from mvlib code


## minor

- make borders around highlighted things thicker, eg in tree view
- show meter and tempo changes in tracks view
    - also draw ticks for bars numbers
    - Add tempo curve to tracks view
    - And time signature labels
- metronome, mute player (or just gain slider)
- remove color scales
    - rainbow, sinebow, warm, cool, blues
- score
  - draw only one rect per bar, no matter how many staffs, simply span whole height
  - show guitar capo, ...
      - maybe disable compacttight to show full meta info
  - score view does not update when track is changed
  - make bars same width in score: https://github.com/opensheetmusicdisplay/opensheetmusicdisplay/issues/1314
  - scrolling to current bar in score does sometimes not scrolls far enough
      - make sure bar is completely within viewport
      - next 2 3 rows should be in view port
      - animate scrolling a bit, maybe ease-in
  - highlight individual chords and notes? https://github.com/opensheetmusicdisplay/opensheetmusicdisplay/wiki/Exploring-the-Demo#drawing-overlay-lines-over-the-score-and-getting-a-notes-position
- compressed should scroll to show current bar in center or left
- speedup cluster threshold slider, or at least debounce
- levenshtein on only rhythm, not pitch
- replace inputs with custom ones
- allow to jump between sections when pressing pgup pgdown
- when only score is shown, make it full width

## major

- render with alphatab
  - [ ] parse .gp files with alphatab into a MusicPiece
  - [x] integrate alphatab and render an example
  - [ ] render musicxml
  - [ ] colorize bars
  - [ ] highlighting and interaction
  - [x] allow to toggle notes (to only show tab)
- to showcase, visualize 1D positions or clustering tree with bars as glyphs
- segment into motifs, riffs
   - most common ngrams, largest first
- clustering with brightness for within-cluster similarity
  - colors for each cluster
  - for bars within each cluster, assign brightness by leaf ordering
- colored line above section/motif, to better see when the same color comes twice in a row, where the new part starts


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
