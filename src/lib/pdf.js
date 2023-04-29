import * as jsPDF from 'jspdf'
import * as svg2pdf from 'svg2pdf.js'

/**
 * Creates a Pdf of the currently rendered MusicXML
 * @see https://github.com/opensheetmusicdisplay/opensheetmusicdisplay/blob/master/demo/index.js
 * @param pdfName if no name is given, the composer and title of the piece will be used
 */
export async function createPdf (osmd, pdfName) {
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
  // create a new jsPDF instance
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

  if (!pdfName) {
    pdfName = osmd.sheet.FullNameString
  }
  // save/download the created pdf
  pdf.save(pdfName + ".pdf")
  // open PDF in new tab/window
  // does not work, if needed see here: https://github.com/parallax/jsPDF/issues/1969
  // pdf.output("pdfobjectnewwindow", { filename: "osmd_createPDF.pdf" })
}
