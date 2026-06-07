// One-off generator: rasterizes the KITalent logo mark to assets/logo/app_icon.png
// (1024×1024, transparent) so flutter_launcher_icons can build platform icons.
//
//   dart run tool/generate_icon.dart
//
// Pure Dart (package:image) — no native SVG rasterizer required.
import 'dart:io';
import 'package:image/image.dart' as img;

const int size = 1024;
const double draw = 600; // mark size within the canvas (leaves adaptive-icon padding)
const double scale = draw / 240; // SVG viewBox is 240
const double pad = (size - draw) / 2;

img.Point p(double x, double y) => img.Point(pad + x * scale, pad + y * scale);

void main() {
  final image = img.Image(width: size, height: size, numChannels: 4);
  // Transparent background.
  img.fill(image, color: img.ColorRgba8(0, 0, 0, 0));

  final blue = img.ColorRgba8(0x2E, 0x5A, 0x9E, 0xFF);
  final white = img.ColorRgba8(0xFF, 0xFF, 0xFF, 0xFF);

  // Upper chevron band.
  img.fillPolygon(image, vertices: [
    p(120, 24), p(206, 78), p(206, 104), p(120, 50), p(34, 104), p(34, 78),
  ], color: blue);

  // Lower chevron banner.
  img.fillPolygon(image, vertices: [
    p(120, 112), p(206, 166), p(206, 196), p(120, 148), p(34, 196), p(34, 166),
  ], color: blue);

  // White outlined chevron inside the upper band (two thick segments).
  final a = p(72, 96), b = p(120, 60), c = p(168, 96);
  final t = (15 * scale).round();
  img.drawLine(image, x1: a.xi, y1: a.yi, x2: b.xi, y2: b.yi, color: white, thickness: t, antialias: true);
  img.drawLine(image, x1: b.xi, y1: b.yi, x2: c.xi, y2: c.yi, color: white, thickness: t, antialias: true);

  final out = File('assets/logo/app_icon.png');
  out.writeAsBytesSync(img.encodePng(image));
  stdout.writeln('Wrote ${out.path} (${image.width}x${image.height})');
}
