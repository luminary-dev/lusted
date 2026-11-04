// Finds the model in each photo with Apple's Vision framework (macOS only) and prints one JSON line per photo: the
// largest face's box and the middle of the body from the shoulders and hips, as fractions of the photo with y from
// the top. scripts/frame-products.mjs runs it. Usage: swift scripts/lib/measure-model.swift <photo> …
import AppKit
import Foundation
import Vision

for file in CommandLine.arguments.dropFirst() {
  guard let image = NSImage(contentsOfFile: file),
        let cg = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
    print("{\"file\":\"\(file)\",\"error\":\"unreadable\"}")
    continue
  }
  let faces = VNDetectFaceRectanglesRequest()
  let body = VNDetectHumanBodyPoseRequest()
  try? VNImageRequestHandler(cgImage: cg).perform([faces, body])
  guard let face = faces.results?.max(by: { $0.boundingBox.height < $1.boundingBox.height })?.boundingBox else {
    print("{\"file\":\"\(file)\",\"error\":\"no face\"}")
    continue
  }
  // shoulders and hips, where Vision is fairly sure of them; a back view turns the face away from the body's middle
  var xs: [Double] = []
  if let pose = body.results?.max(by: { $0.confidence < $1.confidence }) {
    for joint in [VNHumanBodyPoseObservation.JointName.leftShoulder, .rightShoulder, .leftHip, .rightHip] {
      if let p = try? pose.recognizedPoint(joint), p.confidence > 0.2 { xs.append(Double(p.location.x)) }
    }
  }
  let bodyX = xs.count >= 2 ? xs.reduce(0, +) / Double(xs.count) : Double(face.midX)
  print(String(format: "{\"file\":\"%@\",\"faceTop\":%.4f,\"faceHeight\":%.4f,\"bodyX\":%.4f}", file, 1 - face.maxY, face.height, bodyX))
}
