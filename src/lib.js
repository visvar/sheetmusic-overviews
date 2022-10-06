import { GuitarNote, Note, StringBased, Utils } from 'musicvis-lib'
import * as druid from '@saehrimnir/druidjs/dist/druid.esm'
import * as d3 from 'd3'

export const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

/**
 * Allows to sort notes by time, notes with equal start time will be sorted by
 * pitch.
 *
 * @param {Note} a a note to compare
 * @param {Note} b a note to compare
 * @returns {number} negative for smaller, positive for greater, 0 for euqal
 */
export function sortTimePitchComparator (a, b) {
  return a.start !== b.start ? a.start - b.start : a.pitch - b.pitch
}

/**
 * Returns the notes of a track grouped by their measure
 * @param {object} track MusicPiece Track
 * @returns {Note[][]} notes grouped by measures
 */
export function getMeasures (track) {
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
 * For each section of a piece, returns information on startMeasure, endMeasure,
 * and length.
 *
 * @param {object} track MusicPiece Track
 * @returns {object[]} section information
 */
export function getSectionInfo (track) {
  const sections = []
  for (const [startMeasure, name] of track.measureRehearsalMap.entries()) {
    sections.push({ name, startMeasure, endMeasure: null })
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
    // @ts-ignore
    section.length = section.endMeasure - section.startMeasure + 1
  }
  return sections
}

export function getSections (sectionInfo, measures) {
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
 * @param {Note[][]|GuitarNote[][]} noteCollections Note[][]
 * @param {'levenshteinPitch'|'levenshteinStringFret'|'jaccardPitch'} distanceMetric distance metric
 * @returns {number[][]} distance matrix
 */
export function getDistanceMatrix (noteCollections, distanceMetric) {
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
 * Computes MDS to obtain a coloring
 * @param {number[][]} distMatrix distance matrix
 * @param {function} colormap colormap [0,1]=>string
 * @returns {string[]} colors
 */
export function getColorsViaMDSFromDistances (distMatrix, colormap) {
  if (distMatrix.length === 0) { return [] }
  // DR
  const DR = new druid.MDS(distMatrix)
    .parameter("d", 1)
    .parameter("metric", "precomputed")
    .transform()
  const points = DR.map((d) => d[0])

  if (!points || points.length === 0 || !colormap) {
    return []
  }
  const scaleColor = d3.scaleLinear().domain(d3.extent(points)).range([0, 1])
  return points.map((d) => colormap(scaleColor(d)))
}


/**
 * Computes hierachical clustering on a distance matrix to obtain a coloring
 * @param {number[][]} distMatrix distance matrix
 * @returns {string[]} colors
 */
export function getColorsViaClusteringFromDistances (
  distMatrix,
  colormap,
  clusterThreshold = 0,
) {
  if (distMatrix.length === 0) { return [] }
  // Perform clustering
  const druidMatrix = druid.Matrix.from(distMatrix)
  const clusterTree = new druid.Hierarchical_Clustering(
    druidMatrix,
    "complete",
    "precomputed",
    druidMatrix.to2dArray
  )
  /**
   * Traverses a tree in pre-order
   * @param {object} node tree node
   * @returns {object[]} nodes
   */
  function preOrderTraverse (node) {
    const nodes = []
    // Next node always at last position
    const todo = [node]
    while (todo.length > 0) {
      const currentNode = todo.pop()
      nodes.push(currentNode)
      if (!currentNode.isLeaf) {
        // Do left before right, so push it last
        todo.push(currentNode.right, currentNode.left)
      }
    }
    return nodes
  }
  // Get nodes
  const nodes = preOrderTraverse(clusterTree.root)
  const leaves = nodes.filter((n) => n.isLeaf)
  // Compute x from weighted mean of children
  for (const [i, node] of leaves.entries()) {
    node.x = i
  }
  const sortedBottomUp = nodes
    .filter((n) => !n.isLeaf)
    .sort((a, b) => a.depth - b.depth)
  for (const node of sortedBottomUp) {
    const { left, right } = node
    node.x =
      (left.x * left.size + right.x * right.size) / (left.size + right.size)
  }
  // Get clusters (e.g. for color)
  const threshold = clusterThreshold
  // const clusters = clusterTree.get_clusters(threshold, "depth");
  const clusters = clusterTree.get_clusters(threshold, "distance")
  // Assign cluster IDs to nodes
  for (const [clusterId, cluster] of clusters.entries()) {
    for (const node of cluster) {
      node.clusterId = clusterId
    }
  }
  const measureClusters = clusters
    .flatMap((cluster, cIndex) =>
      cluster.map((item) => {
        return {
          mIndex: item.index,
          cIndex
        }
      })
    )
    .sort((a, b) => a.mIndex - b.mIndex)
    .map((d) => d.cIndex)
  const scaleColor = d3
    .scaleLinear()
    .domain([0, clusters.length])
    .range([0, 1])
  const measureColors = measureClusters.map((d) =>
    colormap(scaleColor(d + 0.5))
  )
  // measureClusters is an array with array[measureIndex] = clusterId
  // return { measureClusters, measureColors, nClusters: clusters.length };
  return measureColors
}

/**
 * Allows to wait for a number of seconds with async/await
 * IMPORTANT: This it not exact, it will at *least* wait for X seconds
 *
 * @param {number} seconds number of seconds to wait
 * @returns {Promise} empty Promise that will resolve after the specified amount
 *      of seconds
 */
export function delay (seconds) {
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
export function setOpacity (color, opacity = 1) {
  const { r, g, b } = d3.color(color).rgb()
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

/**
 * Removes tags from an XML document.
 * Will change the document in place.
 *
 * @param {XMLDocument} parsedXml
 * @param {string[]} selectors e.g., ['mytag', '.myclass', '#myid']
 * @returns {XMLDocument} the changed input document
 */
export function removeXmlElements (parsedXml, selectors) {
  for (const selector of selectors) {
    const elements = parsedXml.querySelectorAll(selector)
    for (let element of elements) {
      element.remove()
    }
  }
  return parsedXml
}
