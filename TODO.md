# TODO

1. [TODO](#todo)
   1. [Urgent](#urgent)
   2. [Features](#features)
2. [Performance](#performance)
   1. [Bugs](#bugs)
   2. [Publication](#publication)
   3. [Future work](#future-work)

## Urgent


- compact viewdoes not work when another than the first track selected
  - bar background overdraws notes??
- metric that takes rhythm into account, maybe like simeon's ie levenshtein of both pitch and start, maybe also duration, differently weighted


- show note color map in tree wehn notes are shown

## Features

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
- allow to color bars by how often they occur identically
  - just count 0s in dist matrix, sort by occurence, map to blues
- drum playback
  - fix drum sound map
  - allow to use custom map from pitch to sound
- tree
  - allow to compress only 1, 2, ... levels

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
