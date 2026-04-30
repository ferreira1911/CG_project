// Returns the y-translation that moves a mesh's lowest vertex to local y=0.
// Pass any flat [x,y,z, x,y,z, ...] vertex array (CGFobjModel.vertices,
// procedural meshes, baked VBOs — anything with the same layout).
export function groundOffset(vertices) {
  let minY = Infinity;
  for (let i = 1; i < vertices.length; i += 3) {
    if (vertices[i] < minY) minY = vertices[i];
  }
  return -minY;
}

// Uniform random in [min, max).
export function r(min, max) {
  return min + Math.random() * (max - min);
}

// Rejection-sample a position inside [-range, +range]² whose footprint stays
// off the terrain's path. Returns [x, y, z] with y from terrain.heightAt.
// Falls back to an unconditioned position if no clear spot is found.
export function pickSpot(terrain, range, clearance = 0, maxTries = 30) {
  for (let i = 0; i < maxTries; i++) {
    const x = r(-range, range);
    const z = r(-range, range);
    if (terrain.isPathClear(x, z, clearance)) return [x, terrain.heightAt(x, z), z];
  }
  const x = r(-range, range);
  const z = r(-range, range);
  return [x, terrain.heightAt(x, z), z];
}
