import { StringBased } from '../node_modules/musicvis-lib/dist/musicvislib'
import * as druid from '@saehrimnir/druidjs/dist/druid.esm'
import * as d3 from 'd3'

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

/**
 * Calculates the pairwise distances between all elements of noteCollections
 * @param {Note[][]} noteCollections Note[][]
 * @param {string} distanceMetric distance metric
 * @returns {number[][]} distance matrix
 */
export function getDistanceMatrix(noteCollections, distanceMetric) {
  let preprocessed
  if (distanceMetric === 'levenshteinPitch') {
    preprocessed = noteCollections.map((m) => m.map((n) => n.pitch))
  } else if (distanceMetric === 'levenshteinStringFret') {
    preprocessed = noteCollections.map((m) => m.map((n) => `${n.string} ${n.fret}`))
  }
  const n = preprocessed.length
  // Get distance matrix between all measures
  const distMatrix = new Array(n).fill(0).map(() => new Array(n).fill(0))
  for (let index1 = 0; index1 < n; index1++) {
    for (let index2 = index1; index2 < n; index2++) {
      const distance = StringBased.Levenshtein.levenshtein(
        preprocessed[index1],
        preprocessed[index2]
      )
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
  const scaleColor = d3.scaleLinear().domain(d3.extent(points)).range([0, 1])
  return points.map((d) => colormap(scaleColor(d)))
}
