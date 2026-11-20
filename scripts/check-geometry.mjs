import { createServer } from 'vite';
import * as THREE from 'three';

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
});

try {
  const mod = await server.ssrLoadModule('/src/geometry/parts.ts');
  const { geometries } = mod;
  const raycaster = new THREE.Raycaster();

  function box(geometry) {
    geometry.computeBoundingBox();
    const { min, max } = geometry.boundingBox;
    return {
      min: min.toArray().map((value) => Number(value.toFixed(2))),
      max: max.toArray().map((value) => Number(value.toFixed(2))),
      triangles: geometry.index ? geometry.index.count / 3 : geometry.getAttribute('position').count / 3,
    };
  }

  function hitCount(geometry, origin, direction) {
    const mesh = new THREE.Mesh(geometry);
    raycaster.set(new THREE.Vector3(...origin), new THREE.Vector3(...direction).normalize());
    return raycaster.intersectObject(mesh, false).length;
  }

  const report = {
    plate: box(geometries.plate),
    bracket: box(geometries.bracket),
    washer: box(geometries.washer),
    bolt: box(geometries.bolt),
    mountHoleHits: hitCount(geometries.bracket, [18, 40, 24], [0, -1, 0]),
    faceHoleHits: hitCount(geometries.bracket, [16, 68, 30], [0, 0, -1]),
    footHits: hitCount(geometries.bracket, [0, 40, 60], [0, -1, 0]),
    uprightHits: hitCount(geometries.bracket, [0, 60, -30], [0, 0, 1]),
    plateHoleHits: hitCount(geometries.plate, [18, 30, 24], [0, -1, 0]),
    plateSolidHits: hitCount(geometries.plate, [0, 30, 30], [0, -1, 0]),
    washerCenterHits: hitCount(geometries.washer, [0, 10, 0], [0, -1, 0]),
    washerRingHits: hitCount(geometries.washer, [6, 10, 0], [0, -1, 0]),
  };

  console.log(JSON.stringify(report, null, 2));

  const failures = [];
  if (report.mountHoleHits !== 0) failures.push(`mount hole still solid (${report.mountHoleHits})`);
  if (report.faceHoleHits !== 0) failures.push(`face hole still solid (${report.faceHoleHits})`);
  if (report.plateHoleHits !== 0) failures.push(`plate hole still solid (${report.plateHoleHits})`);
  if (report.footHits < 1) failures.push('foot ray missed the bracket');
  if (report.uprightHits < 1) failures.push('upright ray missed the bracket');
  if (report.plateSolidHits < 1) failures.push('plate solid ray missed');
  if (report.washerCenterHits !== 0) failures.push('washer hole is filled');
  if (report.washerRingHits < 1) failures.push('washer ring was missed');
  if (report.bracket.triangles < 100) failures.push('bracket geometry is suspiciously small');

  if (failures.length) {
    console.error(failures.join('\n'));
    process.exitCode = 1;
  }
} finally {
  await server.close();
}
