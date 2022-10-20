import * as d3 from 'd3'
import { Canvas, Midi, Utils } from 'musicvis-lib'

class BarRenderer {
  constructor(
    mode = 'pianoroll',
    notes = [],
    barWidth = 100,
    barHeight = 100
  ) {
    this.mode = mode
    this.notes = notes
    this.barWidth = barWidth
    this.barHeight = barHeight
    // Scales
    this.scaleX = d3.scaleLinear().range([0, barWidth])
    this.scaleY = d3.scaleLinear().range([0, barHeight])
    let pitchExtent
    switch (mode) {
      case 'None':
        break

      case 'Pianoroll':
        pitchExtent = d3.extent(notes, (d) => d.pitch)
        this.scaleY.domain([pitchExtent[1], pitchExtent[0] - 1])
        this.pitchCount = pitchExtent[1] - pitchExtent[0] + 2
        // Remember which Cs occur within the pitch range
        const minC = Math.ceil(pitchExtent[0] / 12) * 12
        this.cList = d3.range(minC, pitchExtent[1], 12)
        break

      case 'Tab':
      case 'Tab (simple)':
        const stringExtent = d3.extent(notes, (d) => d.string)
        // console.log(stringExtent)
        // this.stringCount = stringExtent[1] - stringExtent[0] + 1
        // TODO: use actual extent, but need to get this from sheet music as not all strings might occur...
        this.scaleY.domain([1, 7])
        this.stringCount = 6
        break

      case 'Drums':
        this.scaleY.domain([0, 4])
        break

      case 'Staff':
        const transpose = 0
        // Y scale
        pitchExtent = d3.extent(notes, (d) => d.pitch)
        const lineExtent = pitchExtent.map((d) => pitchToStaffLine(d + transpose))
        // console.log(lineExtent)
        const [minLine, maxLine] = d3.extent([0, 4, ...lineExtent])
        // console.log(minLine)
        this.scaleY.domain([minLine - 1, maxLine + 1])
        this.noteRadius = Math.abs(this.scaleY(0) - this.scaleY(0.5))
        break

      default:
        throw new Error(`Invalid render mode ${mode}`)
    }
  }

  /**
   * Changes the bar width or returns the current when width is undefined
   * @param {number} width new bar width
   * @returns {BarRenderer} this
   */
  setBarWidth(width) {
    this.barWidth = width
    this.scaleX.range([0, width])
    return this
  }

  /**
   * Draws a colored rectangular border around the bar to indicate highlighting
   * @param {CanvasRenderingContext2D} context canvas context
   * @param {number} x x position of the bar
   * @param {number} y y position of the bar
   * @param {number} [radius=3] corner rounding radius
   * @param {number} [lineWidth=4] width of the border
   * @param {string} [stroke='#333'] stroke color
   */
  drawHighlightBorder(context, x, y, radius = 3, lineWidth = 4, stroke = '#333') {
    context.save()
    context.strokeStyle = stroke
    context.lineWidth = lineWidth
    if (!radius) {
      context.strokeRect(x, y, this.barWidth, this.barHeight)
    } else {
      Canvas.drawRoundedRect(context, x, y, this.barWidth, this.barHeight, radius)
      context.stroke()
    }
    context.restore()
  }

  /**
   * Draws a bar and its notes
   * @param {CanvasRenderingContext2D} context canvas context
   * @param {number} index index of the current bar
   * @param {Note[]} notes notes
   * @param {number} x x position of this bar
   * @param {number} y y position of this bar
   * @param {string} bgColor background color
   * @param {object} params additional parameters, e.g., radius, showFrets
   */
  render(
    context,
    index,
    notes,
    x,
    y,
    bgColor,
    params = {}
  ) {
    context.save()
    // Background
    context.fillStyle = bgColor
    if (!params.radius) {
      context.fillRect(x, y, this.barWidth, this.barHeight)
    } else {
      Canvas.drawRoundedRect(context, x, y, this.barWidth, this.barHeight, params.radius)
      context.fill()
    }
    const darkBg = Utils.getColorLightness(bgColor) < 50

    if (this.mode === 'none' || notes.length === 0) {
      // No notes to draw
      context.restore()
      return
    }

    // Stripes?
    context.fillStyle = 'rgba(0, 0, 0, 0.1)'
    switch (this.mode) {
      case 'Tab':
      case 'Tab (simple)':
        // For tabs, draw strings
        for (let string = 1.5; string < 7; ++string) {
          context.fillRect(
            x,
            y + this.scaleY(string),
            this.barWidth,
            1
          )
        }
        break

      case 'Pianoroll':
        // For pianoroll, draw Cs
        for (const c of this.cList) {
          context.fillRect(
            x,
            y + this.scaleY(c),
            this.barWidth,
            1
          )
        }
        break

      case 'Drums':
        // For drums, draw row separators
        for (let row = 0; row < 6; ++row) {
          context.fillRect(x, y + this.scaleY(row), this.barWidth, 1)
        }
        break
      case 'Staff':
        // For staff, draw staff lines
        for (const row of [0, 1, 2, 3, 4]) {
          context.fillRect(x, y + this.scaleY(row), this.barWidth, 1);
        }
        break
    }


    // scaleX
    if (!params.displayLeadingRests || !params.measureTimes) {
      this.scaleX.domain([
        d3.min(notes, (d) => +d.start),
        d3.max(notes, (d) => +d.end)
      ])
    } else {
      this.scaleX.domain([params.measureTimes[index - 1] ?? 0, params.measureTimes[index]])
    }

    // Render notes
    let noteHeight
    const drawFn = Canvas.drawNoteTrapezoid
    switch (this.mode) {
      case 'Tab (simple)':
      case 'Tab':
        params.showFrets = this.mode === 'Tab (simple)' ? false : params.showFrets
        // Params: showFrets, displayLeadingRests, measureTimes, compactRepeatedNotes
        noteHeight = this.barHeight / this.stringCount
        const noteEndHeight = params.showFrets ? noteHeight * 0.8 : 0
        // TODO: adjust to bar size
        context.font = '7px sans-serif'
        context.textBaseline = 'middle'
        // Draw notes
        for (const [index, note] of notes.entries()) {
          let nx = this.scaleX(note.start)
          const width = this.scaleX(note.end) - nx
          nx = x + nx
          const ny = y + this.scaleY(note.string)
          context.fillStyle = darkBg ? '#eee' : '#333'
          drawFn(context, nx, ny, width, noteHeight, noteEndHeight)
          // Draw fret numbers
          if (params.showFrets) {
            context.fillStyle = darkBg ? 'black' : 'white'
            const lastNote = notes[index - 1]
            if (
              !params.compactRepeatedNotes ||
              note.fret !== lastNote?.fret ||
              note.string !== lastNote?.string
            ) {
              context.fillText(note.fret, nx + 1, ny + noteHeight / 2 + 1)
            }
          }
        }
        break

      case 'Pianoroll':
        // For pianoroll, draw Cs
        noteHeight = this.barHeight / this.pitchCount
        // Draw notes
        for (const note of notes) {
          let nx = this.scaleX(note.start)
          const width = this.scaleX(note.end) - nx
          nx = x + nx
          const ny = y + this.scaleY(note.pitch)
          context.fillStyle = darkBg ? '#eee' : '#333'
          drawFn(context, nx, ny, width, noteHeight, 0)
        }
        break

      case 'Drums':
        context.textAlign = 'left'
        context.textBaseline = 'middle'
        // TODO: adjust to bar size
        context.font = '7px sans-serif'
        noteHeight = this.barHeight / 4
        const noteHeight2 = noteHeight * 0.8
        for (const note of notes) {
          const drumInfo = guitarProDrumReplacementMap.get(note.pitch)
          let nx = this.scaleX(note.start)
          const width = this.scaleX(note.end) - nx
          nx = x + nx
          const ny = y + this.scaleY(drumInfo?.y ?? 0)
          context.fillStyle = darkBg ? '#eee' : '#333'
          drawFn(
            context,
            nx,
            ny,
            width,
            noteHeight,
            noteHeight2
          )
          // Draw labels
          if (params.showFrets && drumInfo) {
            context.fillStyle = darkBg ? 'black' : 'white'
            context.fillText(drumInfo.label, nx + 1, ny + noteHeight / 2 + 1)
          }
        }
        break
      case 'Staff':
        // TODO: make sure it works fine with different pieces
        const transpose = 0
        context.textAlign = 'center'
        context.textBaseline = 'middle'
        context.font = `${this.noteRadius * 1.5}px sans-serif`
        // Map pitches to note lines
        const noteLines = notes.map((d) => pitchToStaffLine(d.pitch + transpose))
        for (const [index, note] of notes.entries()) {
          let nx = this.scaleX(note.start)
          const width = this.scaleX(note.end) - nx
          nx = x + nx
          const ny = y + this.scaleY(noteLines[index])
          context.fillStyle = darkBg ? '#eee' : '#333'
          Canvas.drawFilledCircle(context, nx + this.noteRadius, ny, this.noteRadius)
          context.fillRect(nx, ny - 1, width - 3, 2)
          // Mark sharps
          if (Midi.isSharp(note.pitch)) {
            context.fillStyle = darkBg ? '#333' : '#eee'
            context.fillText('#', nx + this.noteRadius, ny)
          }
        }
        break
    }
    context.restore()
  }
}

export default BarRenderer

/**
 * @type {Map<number,object>} maps MIDI number to y position, symbol, label
 */
const guitarProDrumReplacementMap = new Map([
  // Crash
  [49, { y: 0, symbol: 'C', label: 'C1' }],
  [55, { y: 0, symbol: 'C', label: 'Cs' }],
  [42, { y: 0, symbol: 'C', label: 'C2' }],
  [57, { y: 0, symbol: 'C', label: 'C2' }],
  [56, { y: 0, symbol: 'B', label: 'B' }],
  [99, { y: 0, symbol: 'B', label: 'Bl' }],
  [100, { y: 0, symbol: 'B', label: 'Bh' }],
  // Ride
  [52, { y: 0, symbol: 'C', label: 'Ch' }],
  [51, { y: 0, symbol: 'R', label: 'Rm' }],
  [53, { y: 0, symbol: 'R', label: 'Rb' }],
  [59, { y: 0, symbol: 'R', label: 'R' }],
  [93, { y: 0, symbol: 'R', label: 'Re' }],
  // Hi-Hat
  [42, { y: 0, symbol: 'H', label: 'Hc' }],
  [44, { y: 0, symbol: 'H', label: 'Hh' }],
  [92, { y: 0, symbol: 'H', label: 'Hh' }],
  [46, { y: 0, symbol: 'H', label: 'Ho' }],
  // Toms
  [48, { y: 1, symbol: 'T', label: 'T1' }],
  [47, { y: 1, symbol: 'T', label: 'T2' }],
  [45, { y: 1, symbol: 'T', label: 'T3' }],
  [43, { y: 1, symbol: 'T', label: 'T4' }],
  [50, { y: 1, symbol: 'T', label: 'T5' }],
  // Snare
  [37, { y: 2, symbol: 'S', label: 'Ss' }],
  [38, { y: 2, symbol: 'S', label: 'S' }],
  [91, { y: 2, symbol: 'S', label: 'Sr' }],
  // Bass
  [35, { y: 3, symbol: 'K', label: 'K' }],
  [36, { y: 3, symbol: 'K', label: 'K' }]
])

/**
 * Maps a MIDI number to a staff line
 * @param {number} pitch pitch
 * @returns {number} staff line
 */
function pitchToStaffLine(pitch) {
  const pitchLine = [-1, -1, -0.5, -0.5, 0, 0.5, 0.5, 1, 1, 1.5, 1.5, 2.0]
  const oct = Math.floor((pitch - 60) / 12)
  const line = pitchLine[pitch % 12]
  return oct * 3.5 + line
}
