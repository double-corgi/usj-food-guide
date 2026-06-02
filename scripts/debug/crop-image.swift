import Foundation
import ImageIO
import UniformTypeIdentifiers

guard CommandLine.arguments.count == 7 else {
  fputs("Usage: swift scripts/debug/crop-image.swift <input> <output> <x> <y> <width> <height>\n", stderr)
  exit(2)
}

let inputURL = URL(fileURLWithPath: CommandLine.arguments[1])
let outputURL = URL(fileURLWithPath: CommandLine.arguments[2])
guard
  let x = Int(CommandLine.arguments[3]),
  let y = Int(CommandLine.arguments[4]),
  let width = Int(CommandLine.arguments[5]),
  let height = Int(CommandLine.arguments[6]),
  let source = CGImageSourceCreateWithURL(inputURL as CFURL, nil),
  let image = CGImageSourceCreateImageAtIndex(source, 0, nil)
else {
  fputs("Invalid input or crop arguments\n", stderr)
  exit(1)
}

let cropRect = CGRect(x: x, y: y, width: width, height: height)
guard let cropped = image.cropping(to: cropRect) else {
  fputs("Crop failed\n", stderr)
  exit(1)
}

try FileManager.default.createDirectory(at: outputURL.deletingLastPathComponent(), withIntermediateDirectories: true)
guard let destination = CGImageDestinationCreateWithURL(outputURL as CFURL, UTType.png.identifier as CFString, 1, nil) else {
  fputs("Failed to create output\n", stderr)
  exit(1)
}

CGImageDestinationAddImage(destination, cropped, nil)
if !CGImageDestinationFinalize(destination) {
  fputs("Failed to write output\n", stderr)
  exit(1)
}
