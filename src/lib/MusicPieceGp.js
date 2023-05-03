import { MusicPiece, NoteArray, Note, GuitarNote, Utils } from 'musicvis-lib'
// import { Track, TempoDefinition, TimeSignature, KeySignature } from 'musicvis-lib/src/types/MusicPiece.js'

/**
   * Creates a MusicPiece object from a MusicXML string
   *
   * @todo incomplete
   * @todo move to mvlib
   *
   * @param {string} name name
   * @param {object} alphaTabScore AlphaTab score object
   * @returns {MusicPiece} new MusicPiece
   * @example Parsing a MusicPiece in Node.js
   *      import * as alphaTab from '@coderline/alphatab';
   *      const data = new Uint8Array(await file.arrayBuffer());
   *      const settings = new alphaTab.Settings();
   *      const score = alphaTab.importer.ScoreLoader.loadScoreFromBytes(
   *        data,
   *        settings
   *      );
   *      musicpiece = musicvislib.MusicPiece.fromAlphaTab('My Song', score);
   */
export function fromAlphaTab (name, alphaTabScore) {
  if (!alphaTabScore) {
    throw new Error('No MusicXML file content given')
  }
  console.log(alphaTabScore)
  const parts = alphaTabScore.tracks


  if (parts.length === 0) {
    throw new Error('Music piece contains no parts')
  }


  const tempos = []
  const timeSignatures = []
  const keySignatures = []
  let measureTimes = []
  let currentTime = 0
  const barStartTimes = []
  for (const bar of alphaTabScore.masterBars) {
    barStartTimes.push(currentTime)
    // update tempo
    if (bar.tempoAutomation) {
      const tempo = bar.tempoAutomation.value
      if (tempos.length === 0 || tempo !== tempos.at(-1).bpm) {
        tempos.push(new TempoDefinition(currentTime, tempo))
      }
    }
    // update time signature
    const n = bar.timeSignatureNumerator
    const d = bar.timeSignatureDenominator
    if (timeSignatures.length === 0) {
      timeSignatures.push(new TimeSignature(currentTime, [n, d]))
    } else {
      const [lastN, lastD] = timeSignatures.at(-1).signature
      if (n !== lastN || d !== lastD) {
        timeSignatures.push(new TimeSignature(currentTime, [n, d]))
      }
    }
    // update key signature
    // keySignatures = parts[0].keySignatureChanges
    //   .map(d => new KeySignature(d.time, d.key, d.scale))
    // update measure times
    const secondsPerBeat = Utils.bpmToSecondsPerBeat(tempos.at(-1).bpm ?? 120)
    currentTime += n * secondsPerBeat
  }
  console.log({ tempos, timeSignatures, measureTimes })






  // Tracks
  const tracks = parts
    .map((track, index) => {
      // Notes
      const notes = []
      const measureIndices = []
      const measureRehearsalMap = new Map()
      const noteLyricsMap = new Map()
      console.log(track)

      for (const staff of track.staves) {
        for (const bar of staff.bars) {
          measureIndices.push(notes.length)
          for (const voice of bar.voices) {
            for (const beat of voice.beats) {
              for (const note of beat.notes) {
                const newNote = GuitarNote.from({
                  pitch: note.realValue,
                  string: note.string,
                  fret: note.fret,
                  velocity: note.dynamics,
                  channel: index,
                  // TODO: not time yet
                  start: beat.playbackStart,
                  duration: beat.playbackDuration,
                  end: beat.playbackStart + beat.playbackDuration
                })
                if (notes.length === 0 || !newNote.equals(notes.at(-1))) {
                  notes.push(newNote)
                } else {
                  console.log('euqal note')

                }
              }
            }
          }
        }
        console.log(notes)
        console.log(measureIndices)

        console.log(track.staves)


        return new Track(
          track.name,
          track.shortName,
          notes,
          track.staves.at(-1).stringTuning.tunings,
          measureIndices,
          measureRehearsalMap,
          noteLyricsMap
        )
      }
    })
  return new MusicPiece(
    name,
    tempos,
    timeSignatures,
    keySignatures,
    measureTimes,
    tracks
  )
}

/**
 * Used by MusicPiece, should not be used directly
 */
export class Track {
  /**
   * Creates a new Track.
   * Notes will be sorted by Note.startPitchComparator.
   *
   * and Track.fromMusicXml instead.
   * @param {string} name name
   * @param {string} instrument instrument name
   * @param {Note[]} notes notes
   * @param {number[]} [tuningPitches=null] MIDI note numbers of the track's
   *  tuning
   * @param {number[]} [measureIndices=null] note indices where new measures
   *  start
   * @param {Map<number,object>} measureRehearsalMap maps measure index to
   *  rehearsal marks
   * @param {Map<number,object>} noteLyricsMap maps note index to lyrics text
   * @param {number[][]} xmlNoteIndices for each parsed note, the indices of
   *  the XML note elements that correspond to it
   * @throws {'Notes are undefined or not an array'} for invalid notes
   */
  constructor(
    name,
    instrument,
    notes,
    tuningPitches = null,
    measureIndices = null,
    measureRehearsalMap,
    noteLyricsMap,
    xmlNoteIndices = null
  ) {
    name = !name?.length ? 'unnamed' : name.replace('\u0000', '')
    this.name = name
    this.instrument = instrument
    if (!notes || notes.length === undefined) {
      throw new Error('Notes are undefined or not an array')
    }
    this.notes = notes.sort(Note.startPitchComparator)
    this.tuningPitches = tuningPitches
    this.measureIndices = measureIndices
    this.measureRehearsalMap = measureRehearsalMap
    this.noteLyricsMap = noteLyricsMap
    this.xmlNoteIndices = xmlNoteIndices
    // Computed properties
    this.duration = new NoteArray(notes).getDuration()
    this.hasStringFret = false
    for (const note of notes) {
      if (note.string !== undefined && note.fret !== undefined) {
        this.hasStringFret = true
        break
      }
    }
  }

  /**
   * Returns an object representation of this Track, turns Maps into Arrays
   *  to work with JSON.stringify
   *
   * @returns {object} object represntation
   */
  toObject () {
    return {
      ...this,
      measureRehearsalMap: [...this.measureRehearsalMap],
      noteLyricsMap: [...this.noteLyricsMap]
    }
  }

  /**
   * Parses an object into a Track, must have same format as the result of
   * Track.toObject().
   *
   * @param {object} object object represntation of a Track
   * @returns {Track} track
   */
  static from (object) {
    const notes = object.notes.map(note => {
      return note.string !== undefined && note.fret !== undefined
        ? GuitarNote.from(note)
        : Note.from(note)
    })
    const measureRehearsalMap = new Map(object.measureRehearsalMap)
    const noteLyricsMap = new Map(object.noteLyricsMap)
    return new Track(
      object.name,
      object.instrument,
      notes,
      object.tuningPitches,
      object.measureIndices,
      measureRehearsalMap,
      noteLyricsMap,
      object.xmlNoteIndices
    )
  }

  /**
 * Returns the notes of a track grouped by their measure
 *
 * @todo test
 * @param {function} [sortComparator] sort each measure by a comparator
 * @returns {Note[][]} notes grouped by measures
 * @example
 * myTrack.getMeasures(Note.startPitchComparator)
   */
  getMeasures (sortComparator) {
    // Get notes by measures
    const indices = [0, ...this.measureIndices]
    const measures = []
    for (let index = 1; index < indices.length; ++index) {
      const notes = this.notes.slice(indices[index - 1], indices[index])
      if (sortComparator) {
        notes.sort(sortComparator)
      }
      measures.push(notes)
    }
    return measures
  }

  /**
   * For each section of a piece, returns information on startMeasure, endMeasure,
   * and length.
   * Requires this.measureRehearsalMap to be sensible
   *
   * @todo test
   * @returns {object[]} section information
   */
  getSectionInfo () {
    const sections = []
    for (const [startMeasure, name] of this.measureRehearsalMap.entries()) {
      sections.push({ name, startMeasure, endMeasure: null })
    }
    for (let index = 1; index < sections.length; ++index) {
      sections[index - 1].endMeasure = sections[index].startMeasure - 1
    }
    // Last section ends with piece
    if (sections.length > 0) {
      const last = sections[sections.length - 1]
      last.endMeasure = this.measureIndices.length - 1
    }
    // Add first empty section when first does not start at measure 0
    if (sections.length > 0 && sections[0].startMeasure > 0) {
      const first = {
        name: '',
        startMeasure: 0,
        endMeasure: sections[0].startMeasure - 1
      }
      sections.unshift(first)
    }
    // No sections found? Just create a single one for the entire piece
    if (sections.length === 0) {
      sections.push({
        name: '<No sections>',
        startMeasure: 0,
        endMeasure: this.measureIndices.length - 1
      })
    }
    // Add lengths to each
    for (const section of sections) {
      // @ts-ignore
      section.length = section.endMeasure - section.startMeasure + 1
    }
    return sections
  }

  /**
   * Returns notes grouped by sections, similar to this.getMeasures.
   * Requires this.measureRehearsalMap to be sensible
   * sectionInfo and measures will be computed if not passed, but can be passed
   * if already available to speed up computation
   *
   * @todo test
   * @param {function} [sortComparator] of not undefined, notes in each section
   * will be sorted by this, e.g., Note.startPitchComparator
   * @param {object} [sectionInfo] see this.getSectionInfo
   * @param {Note[][]} [measures] see this.getMeasures
   * @returns {Note[][]} notes grouped by sections
   */
  getSections (sortComparator, sectionInfo, measures) {
    if (!sectionInfo) {
      sectionInfo = this.getSectionInfo()
    }
    if (!measures) {
      measures = this.getMeasures()
    }
    const indices = sectionInfo.map((d) => d.startMeasure)
    const notesBySection = []
    for (let index = 1; index < indices.length + 1; ++index) {
      const notes = measures
        .slice(indices[index - 1], indices[index])
        .flat()
      if (sortComparator) {
        notes.sort(sortComparator)
      }
      notesBySection.push(notes)
    }
    return notesBySection
  }
}

/**
 * Tempo definition
 */
export class TempoDefinition {
  /**
   * @param {number} time in seconds
   * @param {number} bpm tempo in seconds per beat
   */
  constructor(time, bpm) {
    this.time = time
    this.bpm = bpm
    this.string = `${bpm} bpm`
  }
}

/**
 * Time signature definition
 */
export class TimeSignature {
  /**
   * @param {number} time in seconds
   * @param {number[]} signature time signature as [beats, beatType]
   */
  constructor(time, signature) {
    this.time = time
    this.signature = signature
    this.string = signature.join('/')
  }
}

/**
 * Key signature definition
 */
export class KeySignature {
  /**
   * @param {number} time in seconds
   * @param {string} key key e.g. 'C'
   * @param {string} scale scale e.g. 'major'
   */
  constructor(time, key, scale) {
    this.time = time
    this.key = key
    this.scale = scale
    this.string = `${key} ${scale}`
  }
}
