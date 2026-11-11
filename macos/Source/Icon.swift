import Cocoa

let output = CommandLine.arguments[1]
try FileManager.default.createDirectory(atPath: output, withIntermediateDirectories: true)
let sizes = [(16,1),(16,2),(32,1),(32,2),(128,1),(128,2),(256,1),(256,2),(512,1),(512,2)]
for (base,scale) in sizes {
    let pixels = base*scale
    let size = CGFloat(pixels)
    let bitmap = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: pixels, pixelsHigh: pixels, bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
    bitmap.size = NSSize(width: size, height: size)
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: bitmap)
    NSColor.clear.setFill()
    NSRect(x: 0, y: 0, width: size, height: size).fill()
    let inset = size*0.065
    let face = NSBezierPath(roundedRect: NSRect(x: inset, y: inset, width: size-2*inset, height: size-2*inset), xRadius: size*0.2, yRadius: size*0.2)
    NSGradient(starting: NSColor(srgbRed: 0.17, green: 0.40, blue: 0.87, alpha: 1), ending: NSColor(srgbRed: 0.22, green: 0.47, blue: 0.94, alpha: 1))!.draw(in: face, angle: 90)
    let pulse = NSBezierPath()
    let points: [(CGFloat,CGFloat)] = [(9,33),(21,33),(27,17),(37,48),(43,33),(55,33)]
    func point(_ pair: (CGFloat,CGFloat)) -> NSPoint { NSPoint(x: inset + pair.0/64*(size-2*inset), y: size-inset-pair.1/64*(size-2*inset)) }
    pulse.move(to: point(points[0]))
    for p in points.dropFirst() { pulse.line(to: point(p)) }
    pulse.lineWidth = size*0.055
    pulse.lineCapStyle = .round
    pulse.lineJoinStyle = .round
    NSColor.white.setStroke()
    pulse.stroke()
    NSGraphicsContext.restoreGraphicsState()
    let suffix = scale==2 ? "@2x" : ""
    let path = "\(output)/icon_\(base)x\(base)\(suffix).png"
    try bitmap.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: path))
}
