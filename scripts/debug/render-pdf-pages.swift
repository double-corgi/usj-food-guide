import Foundation
import PDFKit
import AppKit

guard CommandLine.arguments.count >= 3 else {
  fputs("Usage: swift scripts/debug/render-pdf-pages.swift <pdf> <output-dir>\n", stderr)
  exit(2)
}

let pdfURL = URL(fileURLWithPath: CommandLine.arguments[1])
let outputDir = URL(fileURLWithPath: CommandLine.arguments[2], isDirectory: true)
guard let document = PDFDocument(url: pdfURL) else {
  fputs("Failed to open PDF: \(pdfURL.path)\n", stderr)
  exit(1)
}

try FileManager.default.createDirectory(at: outputDir, withIntermediateDirectories: true)

for index in 0..<document.pageCount {
  guard let page = document.page(at: index) else { continue }
  let bounds = page.bounds(for: .mediaBox)
  let scale: CGFloat = 1.0
  let size = NSSize(width: bounds.width * scale, height: bounds.height * scale)
  let image = page.thumbnail(of: size, for: .mediaBox)

  guard let tiff = image.tiffRepresentation,
        let bitmap = NSBitmapImageRep(data: tiff),
        let png = bitmap.representation(using: .png, properties: [:]) else {
    continue
  }
  let output = outputDir.appendingPathComponent("page-\(index + 1).png")
  try png.write(to: output)
  print(output.path)
}
