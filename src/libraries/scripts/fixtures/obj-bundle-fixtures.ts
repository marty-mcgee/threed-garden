/** Original synthetic OBJ/MTL triangles; no vendor or private assets. */
export const objGeometry = 'v 0 0 0\nv 2 0 0\nv 0 3 0\nvt 0 0\nvt 1 0\nvt 0 1\nvn 0 0 1\n';
export const objTriangle = objGeometry + 'f 1/1/1 2/2/1 3/3/1\n';
export const objWithMaterial = 'mtllib materials/paint.mtl\n' + objGeometry + 'usemtl Paint\nf 1/1/1 2/2/1 3/3/1\n';
export const objMaterial = 'newmtl Paint\nKd 0.6 0.3 0.2\nKs 0.2 0.2 0.2\nNs 40\n';
export const objTexturedMaterial = objMaterial + 'map_Kd -s 2 3 1 -o 0.1 0.2 0 -clamp on "../images/paint atlas.png"\n';
export const objImage = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGP4DwQACfsD/fteaysAAAAASUVORK5CYII='), (c) => c.charCodeAt(0));
