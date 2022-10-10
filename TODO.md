# TODO

1. [TODO](#todo)
   1. [Urgent](#urgent)
   2. [Features](#features)
   3. [Bugs](#bugs)
   4. [Publication](#publication)
   5. [Future work](#future-work)

## Urgent

- rename score to detailed
- rename sheet to compact

## Features

- make clustering more performant by not reclustering on threshold change
- get colors from compressed blocks: each block that is repeated or in between reps gets its own color
- encodings for drum and general staff notation, see observable

## Bugs

- support 7 string guitar, 4 string bass etc
  - check tuning pitches to get number of strings, then compute bbox of measures from that?
  - sheet
  - score

## Publication

- add about modal
- github pages: https://hrishikeshpathak.com/blog/svelte-gh-pages
- publish https://observablehq.com/@fheyen/sequence-immediate-repetition-hierarchies
  - link to it from mvlib code

## Future work

- allow to select multiple consecutiove bars
- allow playing only curent selection / loop it
- selection of two consecute sequences of bars
  - comparison of two selections
- allow to see multiple instruments at same time
- allow to manually assign colors to selections to overwrite coloring
