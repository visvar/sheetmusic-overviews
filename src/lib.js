import { StringBased, Utils } from '../node_modules/musicvis-lib/dist/musicvislib'
import * as druid from '@saehrimnir/druidjs/dist/druid.esm'
import * as d3 from 'd3'

export const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

/**
 * Makes the first character in a string upper case
 * @param {string} string string
 * @returns {string} result
 */
export function firstLetterUpper(string) {
  return string.slice(0, 1).toUpperCase() + string.slice(1)
}

/**
 * Images are named by DOI (replacing / by _)
 * @param {string} doi DOI
 * @returns {string} path
 */
export function getImgSrc(doi) {
  return `./img/${doi.replace('/', '_')}.png`
}

/**
 * Allows to sort notes by time, notes with equal start time will be sorted by
 * pitch.
 *
 * @param {Note} a a note to compare
 * @param {Note} b a note to compare
 * @returns {number} negative for smaller, positive for greater, 0 for euqal
 */
export function sortTimePitchComparator(a, b) {
  return a.start !== b.start ? a.start - b.start : a.pitch - b.pitch
}

export function getMeasures(track) {
  // Get notes by measures
  const indices = [0, ...track.measureIndices]
  const allNotes = track.notes
  const measures = []
  for (let index = 1; index < indices.length; ++index) {
    const notes = allNotes.slice(indices[index - 1], indices[index])
    // Sort notes uniformly
    notes.sort(sortTimePitchComparator)
    measures.push(notes)
  }
  return measures
}

export function getSectionInfo(track) {
  const sections = []
  for (const [startMeasure, name] of track.measureRehearsalMap.entries()) {
    sections.push({ name, startMeasure })
  }
  for (let index = 1; index < sections.length; ++index) {
    sections[index - 1].endMeasure = sections[index].startMeasure - 1
  }
  // Last section ends with piece
  if (sections.length > 0) {
    const last = sections[sections.length - 1]
    last.endMeasure = track.measureIndices.length - 1
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
      endMeasure: track.measureIndices.length - 1,
    })
  }
  // Add lengths to each
  for (const section of sections) {
    section.length = section.endMeasure - section.startMeasure + 1
  }
  return sections
}

export function getSections(sectionInfo, measures) {
  // Get notes by measures
  const indices = sectionInfo.map((d) => d.startMeasure)
  const notesBySection = []
  for (let index = 1; index < indices.length + 1; ++index) {
    const notes = measures
      .slice(indices[index - 1], indices[index])
      .flat()
    notesBySection.push(notes)
  }
  return notesBySection
}

/**
 * Calculates the pairwise distances between all elements of noteCollections
 * @param {Note[][]} noteCollections Note[][]
 * @param {'levenshteinPitch'|'levenshteinStringFret'|'jaccardPitch'} distanceMetric distance metric
 * @returns {number[][]} distance matrix
 */
export function getDistanceMatrix(noteCollections, distanceMetric) {
  let preprocessed
  if (distanceMetric === 'levenshteinPitch') {
    preprocessed = noteCollections.map((m) => m.map((n) => n.pitch))
  } else if (distanceMetric === 'levenshteinStringFret') {
    preprocessed = noteCollections.map((m) => m.map((n) => `${n.string} ${n.fret}`))
  } else if (distanceMetric === 'jaccardPitch') {
    preprocessed = noteCollections.map((m) => m.map((n) => n.pitch % 12))
  }
  const n = preprocessed.length
  // Get distance matrix between all measures
  const distMatrix = new Array(n).fill(0).map(() => new Array(n).fill(0))
  for (let index1 = 0; index1 < n; index1++) {
    for (let index2 = index1; index2 < n; index2++) {
      let distance
      if (distanceMetric === 'jaccardPitch') {
        distance = Utils.jaccardIndex(preprocessed[index1], preprocessed[index2])
      } else {
        distance = StringBased.Levenshtein.levenshtein(
          preprocessed[index1],
          preprocessed[index2]
        )
      }
      distMatrix[index1][index2] = distance
      distMatrix[index2][index1] = distance
    }
  }
  return distMatrix
}

/**
 * Computes 1D MDS on a distance matrix
 * @param {number[][]} distMatrx distance matrix
 * @returns {number[]} 1D DR points
 */
export function getDRPointsFromDistances(distMatrix) {
  if (distMatrix.length === 0) { return [] }
  // DR
  const druidMatrix = druid.Matrix.from(distMatrix)
  const DR = new druid.MDS(druidMatrix, 1, 'precomputed').transform()
  const points = DR.to2dArray.map((d) => d[0])
  return points
}

/**
 * Maps 1D points to colors
 * @param {number[]} points points
 * @param {function} colormap colormap [0,1]=>string
 * @returns {string[]} colors
 */
export function getColorsFrom1DPoints(points, colormap) {
  if (!points || points.length === 0 || !colormap) {
    return []
  }
  const scaleColor = d3.scaleLinear().domain(d3.extent(points)).range([0, 1])
  return points.map((d) => colormap(scaleColor(d)))
}

/**
 * Allows to wait for a number of seconds with async/await
 * IMPORTANT: This it not exact, it will at *least* wait for X seconds
 *
 * @param {number} seconds number of seconds to wait
 * @returns {Promise} empty Promise that will resolve after the specified amount
 *      of seconds
 */
export function delay(seconds) {
  return new Promise(resolve => {
    setTimeout(resolve, seconds * 1000)
  })
}

/**
 * Sets a color's opacity.
 * Does not support colors in rgba format.
 *
 * @param {string} color valid HTML color identifier
 * @param {number} [opacity=1] opacity from 0 to 1
 * @returns
 */
export function setOpacity(color, opacity = 1) {
  const { r, g, b } = d3.color(color).rgb()
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}
