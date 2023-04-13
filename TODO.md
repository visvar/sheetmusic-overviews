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

- show note color map in tree wehn notes are shown

- allow coloring compressed by sections

- player
  - seems one bar ahead for muse - hysteria

## Features

- make showTrailingRests global
- get colors from compressed blocks: each block that is repeated or in between reps gets its own color
- new note encodings
  - drums
  - staff
- support 7 string guitar, 4 string bass etc
  - check tuning pitches to get number of strings, then compute bbox of measures from that?
  - sheet
  - score
- compact repeated notes should also work for repeated chords
  - requires rendering chord for chord
- drum playback
  - fix drum sound map
  - allow to use custom map from pitch to sound
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
    - also in score with border
- score view does not update when track is changed
- scrolling to current bar in score does sometimes not scrolls far enough
    - make sure bar is completely within viewport
    - next 2 3 rows should be in view port
    - animate scrolling a bit, maybe ease-in
- show guitar tuning (eg EADGBE), capo, ...
    - maybe disable compacttight to show full meta info
- show meter and tempo changes in tracks view
    - also draw ticks for bars numbers
- metronome, mute player (or just gain slider)
- remove color scales
    - rainbow, sinebow, warm, cool, blues
- slider for score bar opacity
- slider for bars per row in compact
- make bars same width
- compressed should scroll to show current bar in center or left
- speedup cluster threshold slider, or at least debounce
- levenshtein on only rhythm, not pitch
- replace inputs with custom ones
- Add tempo curve to tracks view
- And time signature labels
- allow to jump between sections when pressing pgup pgdown

## major

- render with alphatab
- allow to toggle notes (to only show tab)
- to showcase, visualize 1D positions or clustering tree with bars as glyphs
- segment into motifs, riffs
   - most common ngrams, largest first
clustering with brightness for within-cluster similarity
  - colors for each cluster
  - for bars within each cluster, assign brightness by leaf ordering
colored line above section/motif, to better see when the same color comes twice in a row, where the new part starts


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
