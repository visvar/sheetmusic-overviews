import * as d3 from 'd3'
import { Canvas, Utils } from 'musicvis-lib'

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
    switch (mode) {
      case 'none':
        break

      case 'pianoroll':
        const pitchExtent = d3.extent(notes, (d) => d.pitch)
        this.scaleY.domain([pitchExtent[1], pitchExtent[0] - 1])
        this.pitchCount = pitchExtent[1] - pitchExtent[0] + 2
        // Remember which Cs occur within the pitch range
        const minC = Math.ceil(pitchExtent[0] / 12) * 12
        this.cList = d3.range(minC, pitchExtent[1], 12)
        break

      case 'tab':
      case 'tab (simple)':
        const stringExtent = d3.extent(notes, (d) => d.string)
        // console.log(stringExtent)
        // this.stringCount = stringExtent[1] - stringExtent[0] + 1
        // TODO: use actual extent, but need to get this from sheet music as not all strings might occur...
        this.scaleY.domain([1, 7])
        this.stringCount = 6
        break

      case 'drums':
        // TODO:
        break
      case 'staff':
        // TODO:
        break
      default:
        throw new Error('Invalid render mode')
    }
  }

  /**
   * Draws a colored rectangular border around the bar to indicate highlighting
   * @param {CanvasRenderingContext2D} context canvas context
   * @param {number} x x position of the bar
   * @param {number} y y position of the bar
   * @param {number} [lineWidth=4] width of the border
   * @param {string} [stroke='#333'] stroke color
   */
  drawHighlightBorder(context, x, y, lineWidth = 4, stroke = '#333') {
    context.save()
    context.strokeStyle = stroke
    context.lineWidth = lineWidth
    context.strokeRect(x, y, this.barWidth, this.barHeight)
    context.restore()
  }

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
    context.fillRect(x, y, this.barWidth, this.barHeight)
    const darkBg = Utils.getColorLightness(bgColor) < 50

    if (this.mode === 'none' || notes.length === 0) {
      // No notes to draw
      context.restore()
      return
    }

    // Stripes?
    context.fillStyle = 'rgba(0, 0, 0, 0.1)'
    switch (this.mode) {
      case 'tab':
      case 'tab (simple)':
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

      case 'pianoroll':
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

      case 'drums':
        // TODO:
        break
      case 'staff':
        // TODO:
        break
    }

    // TODO: for drums, draw row bands
    // TODO: for staff, draw staff lines

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
      case 'tab (simple)':
      case 'tab':
        params.showFrets = this.mode === 'tab (simple)' ? false : params.showFrets
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

      case 'pianoroll':
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

      case 'drums':
        // TODO:
        break
      case 'staff':
        // TODO:
        break
    }
    context.restore()
  }
}

export default BarRenderer