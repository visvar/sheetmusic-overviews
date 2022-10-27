import { Chords, StringBased, Utils } from 'musicvis-lib'
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
export function sortTimePitchComparator(a, b) {
  return a.start !== b.start ? a.start - b.start : a.pitch - b.pitch
}

/**
 * Returns the notes of a track grouped by their measure
 * @param {object} track MusicPiece Track
 * @returns {Note[][]} notes grouped by measures
 */
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
 * For each section of a piece, returns information on startMeasure, endMeasure,
 * and length.
 *
 * @param {object} track MusicPiece Track
 * @returns {object[]} section information
 */
export function getSectionInfo(track) {
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

function mod12(p) { return p % 12 }

/**
 * Calculates the pairwise distances between all elements of noteCollections
 * @param {Note[][]|GuitarNote[][]} noteCollections Note[][]
 * @param {'levenshteinPitchStart'|'levenshteinPitch'|'gotohPitch'|'levenshteinStringFret'|'jaccardPitch'|'chordJaccard'} distanceMetric distance metric
 * @returns {number[][]} distance matrix
 */
export function getDistanceMatrix(noteCollections, distanceMetric) {
  // Preprocess only once for better performance
  let prepr
  let prepr2
  if (distanceMetric === 'levenshteinPitchStart') {
    prepr = noteCollections.map((nc) => nc.map((n) => n.pitch))
    prepr2 = noteCollections.map((nc) => nc.map((n) => n.start))
  } else if (distanceMetric === 'levenshteinPitch' || distanceMetric === 'gotohPitch') {
    prepr = noteCollections.map((nc) => nc.map((n) => n.pitch))
  } else if (distanceMetric === 'levenshteinStringFret') {
    prepr = noteCollections.map((nc) => nc.map((n) => `${n.string} ${n.fret}`))
  } else if (distanceMetric === 'jaccardPitch') {
    prepr = noteCollections.map((nc) => nc.map((n) => n.pitch % 12))
  } else if (distanceMetric === 'chordJaccard') {
    prepr = noteCollections.map((nc) => Chords.detectChordsByExactStart(nc))
  } else {
    console.error(`Invalid distanceMetric ${distanceMetric}`)
  }
  const gotohGapPenStart = 1
  const gotohGapPenExt = 0.5
  const n = prepr.length
  // Get distance matrix between all measures
  const distMatrix = new Array(n).fill(0).map(() => new Array(n).fill(0))
  for (let index1 = 0; index1 < n; index1++) {
    for (let index2 = index1; index2 < n; index2++) {
      const a = prepr[index1]
      const b = prepr[index2]
      let distance
      if (distanceMetric === 'levenshteinPitchStart') {
        // Weighted sum of separate Levenshtein for pitch and start
        const weight = 0.5
        const a2 = prepr2[index1]
        const b2 = prepr2[index2]
        const pitchDist = StringBased.Levenshtein.levenshtein(a, b)
        const startDist = StringBased.Levenshtein.levenshtein(a2, b2)
        distance = weight * pitchDist + (1 - weight) * startDist
      } else if (distanceMetric === 'levenshteinPitch' || distanceMetric === 'levenshteinStringFret') {
        distance = StringBased.Levenshtein.levenshtein(a, b)
      } else if (distanceMetric === 'gotohPitch') {
        // Gotoh of pitches
        const simFn = StringBased.Gotoh.matchMissmatchSimilarity
        distance = StringBased.Gotoh.gotoh(a, b, simFn, gotohGapPenStart, gotohGapPenExt)
      } else if (distanceMetric === 'jaccardPitch') {
        // Turn similarity into distance by taking JD=1-JS as Jaccard is always in [0,1]
        distance = 1 - Utils.jaccardIndex(a, b)
      } else if (distanceMetric === 'chordJaccard') {
        // Gotoh of harmonies
        const simFn = (h1, h2) => {
          return Utils.jaccardIndex(h1, h2) + Utils.jaccardIndex(h1.map(mod12), h2.map(mod12))
        }
        distance = StringBased.Gotoh.gotoh(a, b, simFn, gotohGapPenStart, gotohGapPenExt)
      }
      distMatrix[index1][index2] = distance
      distMatrix[index2][index1] = distance
    }
  }
  // Normalize
  return normalizeNdArray(distMatrix)
}

/**
 * Computes MDS to obtain a coloring
 * @param {number[][]} distMatrix distance matrix
 * @param {function} colormap colormap [0,1]=>string
 * @returns {string[]} colors
 */
export function getColorsViaMDSFromDistances(distMatrix, colormap) {
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
 * @param {function} colormap colormap [0,1]=>string
 * @param {number} [clusterThreshold=0] threshold between 0 and 1 for cluster
 * cut-off
 * @returns {string[]} colors
 */
export function getColorsViaClusteringFromDistances(
  distMatrix,
  colormap,
  clusterThreshold = 0,
) {
  if (distMatrix.length === 0 || distMatrix.length === 1) { return [] }
  // Perform clustering
  const druidMatrix = druid.Matrix.from(distMatrix)
  const clusterTree = new druid.Hierarchical_Clustering(
    druidMatrix,
    "complete",
    "precomputed"
  )
  if (!clusterTree.root) {
    // Happens when there are no items, e.g., when piece has no sections
    return []
  }
  /**
   * Traverses a tree in pre-order
   * @param {object} node tree node
   * @returns {object[]} nodes
   */
  function preOrderTraverse(node) {
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
  const clusters = clusterTree.get_clusters(clusterThreshold, "distance")
  // Assign cluster IDs to nodes
  for (const [clusterId, cluster] of clusters.entries()) {
    for (const node of cluster) {
      node.clusterId = clusterId
    }
  }
  const measureClusters = clusters.flatMap((cluster, cIndex) =>
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
 * Computes a compression hierachy of nested repeated sections and uses this
 * hierarchy for coloring, similar to the approach with hierarchical clustering
 * @param {number[][]} distMatrix distance matrix
 * @param {function} colormap colormap [0,1]=>string
 * @param {number} [depth=2] determines the depth where to cut the hierachy
 */
export function getColorsViaCompression(distMatrix, colormap, depth = 2) {
  if (distMatrix.length === 0) { return [] }
  const repeatedIndices = Utils.findRepeatedIndices(
    d3.range(0, distMatrix.length),
    (a, b) => distMatrix[a][b] === 0
  )
  const hierarchy =
    StringBased.ImmediateRepetitionCompression.compress(repeatedIndices)

  // Segmentation
  let currentCluster = 1
  const recurse = (node, parent) => {
    if (node.pre) {
      recurse(node.pre, node)
    }
    if (!node.seq) {
      parent.seq = new Array(node.length).fill(currentCluster)
      currentCluster++
      return
    } else {
      recurse(node.seq, node)
    }
    if (node.post) {
      recurse(node.post, node)
    }
  }
  recurse(hierarchy)

  console.log(hierarchy)
  let measureClusters = StringBased.ImmediateRepetitionCompression.decompress(hierarchy)
  console.log(measureClusters)

  // Make every second cluster a very different color
  const max = d3.max(measureClusters)
  measureClusters = measureClusters.map(d => d % 2 === 0 ? d + max : d)
  console.log(measureClusters)
  // Map colors
  const scaleColor = d3
    .scaleLinear()
    .domain(d3.extent(measureClusters))
    .range([0, 1])
  const measureColors = measureClusters.map((d) =>
    colormap(scaleColor(d + 0.5)))
  return measureColors
}
// export function getColorsViaCompression (distMatrix, colormap, depth = 2) {
//   if (distMatrix.length === 0) { return [] }
//   const repeatedIndices = Utils.findRepeatedIndices(
//     d3.range(0, distMatrix.length),
//     (a, b) => distMatrix[a][b] === 0
//   )
//   const hierarchy =
//     StringBased.ImmediateRepetitionCompression.compress(repeatedIndices)
//   console.log(distMatrix)

//   // Segmentation
//   let currentCluster = 1
//   const measureClusters = new Array(distMatrix.length).fill(0)
//   const recurse = node => {
//     if (!node.seq) {
//       for (const itemIndex of node) {
//         measureClusters[itemIndex] = currentCluster
//       }
//       currentCluster++
//       return
//     }
//     if (node.pre) {
//       recurse(node.pre)
//     }
//     recurse(node.seq)
//     if (node.post) {
//       recurse(node.post)
//     }
//   }
//   recurse(hierarchy)


//   // Since repeated indices have the same number of identical items, we need
//   // to post-process measureClusters and copy values
//   // TODO: or do this directly when assigning clusters?
//   for (const [mIndex, rIndex] of repeatedIndices.entries()) {
//     if (measureClusters[mIndex] === 0 && measureClusters[rIndex] > measureClusters[mIndex]) {
//       measureClusters[mIndex] = measureClusters[rIndex]
//     }
//   }
//   const nClusters = (new Set(measureClusters)).size
//   console.log(repeatedIndices)
//   console.log(hierarchy)
//   console.log(measureClusters)
//   console.log(nClusters)
//   // Map colors
//   const scaleColor = d3
//     .scaleLinear()
//     .domain([0, nClusters])
//     .range([0, 1])
//   const measureColors = measureClusters.map((d) =>
//     colormap(scaleColor(d + 0.5)))
//   return measureColors
// }

/**
 * Assigns a color based on how often an item occurs (number of 0s in its
 * distance matrix row)
 *
 * @param {number[][]} distMatrix distance matrix
 * @param {function} colormap colormap [0,1]=>string
 */
export function getColorsViaOccurence(distMatrix, colormap) {
  const occurences = distMatrix.map(row => count(row, 0))
  // TODO: sort so colors are different
  const scale = d3.scaleLinear().domain(d3.extent(occurences))
  return occurences.map(d => colormap(scale(d)))
}


/**
 * Counts hw often value appears in array
 * @param {Array} array array
 * @param {*} value value
 * @returns {number} count
 */
function count(array, value) {
  let count = 0
  for (const v of array) {
    if (v === value) {
      count++
    }
  }
  return count
}


/**
 * Allows to wait for a number of seconds with async/await
 * IMPORTANT: This it not exact, it will at *least* wait for X seconds
 *
 * @todo use the one from mvlib
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
 * @todo use the one from mvlib
 * @param {string} color valid HTML color identifier
 * @param {number} [opacity=1] opacity from 0 to 1
 * @returns
 */
export function setOpacity(color, opacity = 1) {
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
export function removeXmlElements(parsedXml, selectors) {
  for (const selector of selectors) {
    const elements = parsedXml.querySelectorAll(selector)
    for (const element of elements) {
      element.remove()
    }
  }
  return parsedXml
}


/**
 * Normalizes by dividing scaling all values to [0, 1] linearly.
 *
 * @todo move to musicvis-lib and test
 * @param {Array} array nD array with arbitrary depth and structure, containing
 *  only numbers
 * @returns {Array} normalized array
 */
export function normalizeNdArray(array) {
  const extent = d3.extent(array.flat(Number.POSITIVE_INFINITY))
  const scale = d3.scaleLinear().domain(extent)
  const normalize = (array_) =>
    array_.map((d) => {
      return d.length !== undefined ? normalize(d) : scale(d)
    })
  return normalize(array)
}


/**
 * @todo import from mvlib
 * @param canvas
 * @param width
 * @param height
 * @param colorMap
 */
export function drawColorRamp(canvas, width, height, colorMap) {
  if (!canvas || !colorMap) {
    return
  }
  const context = canvas.getContext('2d')
  context.fillStyle = 'white'
  context.fillRect(0, 0, width, height)
  const scaleColor = d3.scaleLinear().domain([0, width])
  for (let hue = 0; hue < width; ++hue) {
    context.fillStyle = colorMap(scaleColor(hue))
    context.fillRect(hue, 0, 2, height)
  }
}

/**
 * Draws text horizontally rotated 90 degrees clock-wise
 * @param {*} context
 * @param {*} x
 * @param {*} y
 * @param {*} text
 * @param {*} color
 * @param {*} size
 * @param {*} centered
 */
export function drawVerticalText(
  context,
  x,
  y,
  text,
  color,
  size,
  centered = false
) {
  context.save();
  context.rotate((90 * Math.PI) / 180)
  if (centered) {
    context.textAlign = 'center'
  }
  context.fillStyle = color
  context.font = `${size}px sans-serif`
  context.fillText(text, y, -x)
  context.restore()
}
