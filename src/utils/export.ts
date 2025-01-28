import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { TLShape } from '@tldraw/tldraw'

export async function exportRegions(shapes: Record<string, TLShape>) {
  const zip = new JSZip()
  let pageNum = 1

  // Get all regions
  const regions = Object.values(shapes).filter(
    (shape) => shape.type === 'imageRegion'
  )

  // Get all images that intersect with regions
  const images = Object.values(shapes).filter(
    (shape) => shape.type === 'image'
  )

  // For each region, find intersecting images and add to zip
  for (const region of regions) {
    const regionBounds = {
      minX: region.x,
      minY: region.y,
      maxX: region.x + (region.props as any).w,
      maxY: region.y + (region.props as any).h,
    }

    const intersectingImages = images.filter((image) => {
      const imageBounds = {
        minX: image.x,
        minY: image.y,
        maxX: image.x + (image.props as any).w,
        maxY: image.y + (image.props as any).h,
      }

      return !(
        imageBounds.maxX < regionBounds.minX ||
        imageBounds.minX > regionBounds.maxX ||
        imageBounds.maxY < regionBounds.minY ||
        imageBounds.minY > regionBounds.maxY
      )
    })

    // Create a canvas for this region
    const canvas = document.createElement('canvas')
    canvas.width = (region.props as any).w
    canvas.height = (region.props as any).h
    const ctx = canvas.getContext('2d')
    if (!ctx) continue

    // Draw each intersecting image
    for (const image of intersectingImages) {
      const img = new Image()
      img.src = (image.props as any).src

      // Wait for image to load
      await new Promise((resolve) => {
        img.onload = resolve
      })

      // Calculate relative position
      const relX = image.x - region.x
      const relY = image.y - region.y

      ctx.drawImage(
        img,
        relX,
        relY,
        (image.props as any).w,
        (image.props as any).h
      )
    }

    // Add to zip
    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((blob) => resolve(blob!))
    )
    zip.file(`page-${pageNum}.png`, blob)
    pageNum++
  }

  // Generate and download zip
  const content = await zip.generateAsync({ type: 'blob' })
  saveAs(content, 'exported-regions.zip')
}

/* PDF Version (commented out for future use)
import { PDFDocument, rgb } from 'pdf-lib'

export async function exportRegionsToPDF(shapes: Record<string, TLShape>) {
  const pdfDoc = await PDFDocument.create()
  let pageNum = 1

  // Get all regions
  const regions = Object.values(shapes).filter(
    (shape) => shape.type === 'imageRegion'
  )

  // Get all images that intersect with regions
  const images = Object.values(shapes).filter(
    (shape) => shape.type === 'image'
  )

  // For each region, create a new PDF page
  for (const region of regions) {
    const page = pdfDoc.addPage([
      (region.props as any).w,
      (region.props as any).h,
    ])

    const regionBounds = {
      minX: region.x,
      minY: region.y,
      maxX: region.x + (region.props as any).w,
      maxY: region.y + (region.props as any).h,
    }

    const intersectingImages = images.filter((image) => {
      const imageBounds = {
        minX: image.x,
        minY: image.y,
        maxX: image.x + (image.props as any).w,
        maxY: image.y + (image.props as any).h,
      }

      return !(
        imageBounds.maxX < regionBounds.minX ||
        imageBounds.minX > regionBounds.maxX ||
        imageBounds.maxY < regionBounds.minY ||
        imageBounds.minY > regionBounds.maxY
      )
    })

    // Draw each intersecting image
    for (const image of intersectingImages) {
      const img = await pdfDoc.embedPng((image.props as any).src)
      
      // Calculate relative position
      const relX = image.x - region.x
      const relY = image.y - region.y

      page.drawImage(img, {
        x: relX,
        y: relY,
        width: (image.props as any).w,
        height: (image.props as any).h,
      })
    }
  }

  // Generate and download PDF
  const pdfBytes = await pdfDoc.save()
  const blob = new Blob([pdfBytes], { type: 'application/pdf' })
  saveAs(blob, 'exported-regions.pdf')
}
*/