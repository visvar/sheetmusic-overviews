# TODO

1. [TODO](#todo)
   1. [Urgent](#urgent)
   2. [Features](#features)
   3. [Bugs](#bugs)
   4. [Publication](#publication)
   5. [Future work](#future-work)

## Urgent

- rename score to full
- allow using any encoding (e.g, piano roll and tab) everywhere
  - none (notes hidden)
  - piano roll
  - tab (should support different numbers of strings)
  - future: staff
- draw measures with rounded corners to show where they end

## Features

- make clustering more performant by not reclustering on threshold change
- get colors from compressed blocks: each block that is repeated or in between reps gets its own color
  - add encodings for drum and general staff notation, see observable
- support 7 string guitar, 4 string bass etc
  - check tuning pitches to get number of strings, then compute bbox of measures from that?
  - sheet
  - score
- compact repeated notes should also work for repeated chords

## Bugs

- does not work for some musicxml files

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
