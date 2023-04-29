import * as jsPDF from 'jspdf'
import * as svg2pdf from 'svg2pdf.js'
import { Canvg, presets } from 'canvg'
import saveAs from 'save-as'

/**
 * Creates a Pdf of the currently rendered MusicXML
 * @see https://github.com/opensheetmusicdisplay/opensheetmusicdisplay/blob/master/demo/index.js
 * @param {OpenSheetMusicDisplay} osmd OpenSheetMusicDisplay
 * @param {string} fileName if no name is given, the composer and title of the piece will be used
 */
export async function createPdf (osmd, fileName) {
  const backends = osmd.drawer.Backends
  let svgElement = backends[0].getSvgElement()
  // get sizes
  let pageWidth = 210
  let pageHeight = 297
  const engravingRulesPageFormat = osmd.rules.PageFormat
  if (engravingRulesPageFormat && !engravingRulesPageFormat.IsUndefined) {
    pageWidth = engravingRulesPageFormat.width
    pageHeight = engravingRulesPageFormat.height
  } else {
    pageHeight = pageWidth * svgElement.clientHeight / svgElement.clientWidth
  }
  const orientation = pageHeight > pageWidth ? "p" : "l"
  const pdf = new jsPDF.jsPDF({
    orientation: orientation,
    unit: "mm",
    format: [pageWidth, pageHeight]
  })
  if (!pdf.svg && !svg2pdf) { // this line also serves to make the svg2pdf not unused, though it's still necessary
    // we need svg2pdf to have pdf.svg defined
    console.log("svg2pdf missing, necessary for jspdf.svg().")
    return
  }
  for (let idx = 0, len = backends.length; idx < len; ++idx) {
    if (idx > 0) {
      pdf.addPage()
    }
    svgElement = backends[idx].getSvgElement()
    await pdf.svg(svgElement, {
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
      // loadExternalStyleSheets: true,
    })
  }
  console.log(pdf)
  if (!fileName) {
    fileName = osmd.sheet.FullNameString
  }
  // save/download the created pdf
  pdf.save(fileName + ".pdf")
  // open PDF in new tab/window
  // does not work, if needed see here: https://github.com/parallax/jsPDF/issues/1969
  // pdf.output("pdfobjectnewwindow", { filename: "osmd_createPDF.pdf" })
}


// Tried with pdf.addSvgAsImage but doesn't work
// export async function createPdf2 (osmd, pdfName) {
//   const backends = osmd.drawer.Backends
//   let svgElement = backends[0].getSvgElement()
//   // get sizes
//   let pageWidth = 210
//   let pageHeight = 297
//   const engravingRulesPageFormat = osmd.rules.PageFormat
//   if (engravingRulesPageFormat && !engravingRulesPageFormat.IsUndefined) {
//     pageWidth = engravingRulesPageFormat.width
//     pageHeight = engravingRulesPageFormat.height
//   } else {
//     pageHeight = pageWidth * svgElement.clientHeight / svgElement.clientWidth
//   }
//   const orientation = pageHeight > pageWidth ? "p" : "l"
//   const pdf = new jsPDF.jsPDF({
//     orientation: orientation,
//     unit: "mm",
//     format: [pageWidth, pageHeight]
//   })
//   if (!pdf.svg && !svg2pdf) {
//     console.log("svg2pdf missing, necessary for jspdf.svg().")
//     return
//   }
//   for (let idx = 0, len = backends.length; idx < len; ++idx) {
//     if (idx > 0) {
//       pdf.addPage()
//     }
//     svgElement = backends[idx].getSvgElement()
//     const svgString = svgElement.outerHTML
//     console.log(svgString)

//     pdf.addSvgAsImage(svgString, 0, 0, pageWidth, pageHeight)
//   }
//   console.log(pdf)
//   pdf.save(pdfName + ".pdf")
// }

export async function createPng (osmd, fileName) {
  const backends = osmd.drawer.Backends
  let svgElement = backends[0].getSvgElement()
  // get sizes
  let pageWidth = 210
  let pageHeight = 297
  const engravingRulesPageFormat = osmd.rules.PageFormat
  if (engravingRulesPageFormat && !engravingRulesPageFormat.IsUndefined) {
    pageWidth = engravingRulesPageFormat.width
    pageHeight = engravingRulesPageFormat.height
  } else {
    pageHeight = pageWidth * svgElement.clientHeight / svgElement.clientWidth
  }
  console.log(pageWidth, pageHeight)

  // convert to png
  for (let idx = 0, len = backends.length; idx < len; ++idx) {
    svgElement = backends[idx].getSvgElement()
    const svgString = svgElement.outerHTML
    const blob = await toPng({
      width: pageWidth * 5,
      height: pageHeight * 5,
      svg: svgString
    })
    saveAs(blob, fileName + '.png')
  }
}

async function toPng (data) {
  const preset = {
    ...presets.offscreen(),
    ignoreClear: true,
    ignoreDimensions: true,
    // scaleWidth: 2,
    // scaleHeight: 2
  }
  const {
    width,
    height,
    svg
  } = data
  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, width, height)
  const v = await Canvg.from(ctx, svg, preset)
  // Render only first frame, ignoring animations and mouse.
  await v.render()
  const blob = await canvas.convertToBlob()
  return blob
}
