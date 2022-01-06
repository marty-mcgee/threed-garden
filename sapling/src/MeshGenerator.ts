import {
  BackSide,
  Box2,
  BufferGeometry,
  CanvasTexture,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  LineSegments,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Scene,
  sRGBEncoding,
  Vector2,
  Vector3,
  WireframeGeometry,
} from 'three';
import { OutlineMaterial } from './materials/OutlineMaterial';
import {
  addGlobalListener,
  BooleanProperty,
  ColorProperty,
  ComputedProperty,
  FloatProperty,
  IntegerProperty,
  PropertyGroup,
  PropertyMap,
  RangeProperty,
  RepeatingPropertyGroup,
  UnsubscribeCallback,
} from './properties';
import Prando from 'prando';
import download from 'downloadjs';
import { buildLeafPath, calcLeafBounds } from './genLeafShape';
import { LeafStamp, TwigStem } from './leaf';
import { drawLeafTexture } from './genLeafTexture';
import { propertyMapToJson } from './properties/PropertyMap';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
// import { minimizeShadow } from './collision';

const GLTFExporter = require('./third-party/GLTFExporter.js');

enum GrowthPattern {
  Dichotomous = 0,
  Monopodial = 1,
}

const growthPattern = new IntegerProperty({ init: 0, enumVals: ['dichotomous', 'monopodial'] });
const monopodial = new ComputedProperty(growthPattern, value => value === GrowthPattern.Monopodial);
const notMonopodial = new ComputedProperty(
  growthPattern,
  value => value !== GrowthPattern.Monopodial
);

class TrunkProps extends PropertyGroup {
  seed = new IntegerProperty({ init: 200, min: 1, max: 100000, increment: 1 });
  growthPattern = growthPattern;
  radius = new FloatProperty({ init: 0.16, min: 0.01, max: 1 });
  length = new FloatProperty({ init: 3, min: 0.01, max: 6, increment: 0.1 });
  taper = new FloatProperty({ init: 0.1, min: 0.01, max: 1 });
  segmentLength = new FloatProperty({ init: 0.5, min: 0.1, max: 1, increment: 0.1 });
  color = new ColorProperty({ init: 0xa08000 });
}

class BranchProps extends PropertyGroup {
  branchAt = new RangeProperty({
    init: [0.4, 0.4],
    min: 0,
    max: 1,
    increment: 0.01,
    enabled: monopodial,
  });
  interval = new RangeProperty({
    init: [0.3, 0.3],
    min: 0,
    max: 1,
    increment: 0.01,
    enabled: monopodial,
  });
  length = new RangeProperty({ init: [0.4, 0.4], min: 0, max: 5, increment: 0.01 });
  lengthTaper = new FloatProperty({
    init: 1,
    min: 0.05,
    max: 1,
    increment: 0.01,
    enabled: monopodial,
  });
  axis = new RangeProperty({
    init: [0, 0],
    min: -Math.PI,
    max: Math.PI,
    increment: 0.01,
    precision: 2,
  });
  angle = new RangeProperty({ init: [0.51, 0.61], min: 0, max: 2.5, increment: 0.01 });
  angleBias = new FloatProperty({ init: 0, min: -1, max: 1, increment: 0.01, enabled: monopodial });
  symmetry = new IntegerProperty({ init: 2, min: 1, max: 3 });
  deflect = new RangeProperty({
    init: [1, 1],
    min: 0,
    max: 1,
    increment: 0.05,
    enabled: notMonopodial,
  });
  flex = new FloatProperty({ init: 0, min: -1, max: 1, increment: 0.1 });
  leaves = new BooleanProperty({
    init: false,
    enabled: monopodial,
  });
}

class LeavesProps extends PropertyGroup {
  fanSize = new IntegerProperty({ init: 1, min: 1, max: 10, increment: 1 });
  fanAngle = new FloatProperty({ init: 1.5, min: 0.01, max: 6 });
  angleVariation = new FloatProperty({ init: 0, min: 0, max: 3 });
  lateralDroop = new FloatProperty({ init: 0, min: -1.5, max: 1.5 });
  axialDroop = new FloatProperty({ init: 0, min: -1.5, max: 1.5 });
  taper = new FloatProperty({ init: 1, min: 0, max: 2 });
  phalanxCount = new IntegerProperty({ init: 0, min: 0, max: 10, increment: 1 });
  leafSpacing = new FloatProperty({ init: 20, min: 1, max: 100 });
  leafSpacingVariation = new FloatProperty({ init: 0, min: 0, max: 3 });
}

class LeafShapeProps extends PropertyGroup {
  length = new FloatProperty({ init: 60, min: 20, max: 128, increment: 1 });
  numSegments = new IntegerProperty({ init: 1, min: 1, max: 12, increment: 1 });
  baseWidth = new FloatProperty({ init: 0.27, min: 0.01, max: 1 });
  baseTaper = new FloatProperty({ init: 0, min: -1, max: 1 });
  tipWidth = new FloatProperty({ init: 0.2, min: 0.01, max: 1 });
  tipTaper = new FloatProperty({ init: 0.41, min: -1, max: 1 });
  serration = new FloatProperty({ init: 0, min: 0, max: 1 });
  rake = new FloatProperty({ init: 0, min: 0, max: 1 });
  jitter = new FloatProperty({ init: 0, min: 0, max: 1 });
}

class LeafColorProps extends PropertyGroup {
  innerColor = new ColorProperty({ init: 0x444444 });
  outerColor = new ColorProperty({ init: 0x444444 });
  variation = new FloatProperty({ init: 0, min: 0, max: 1 });
  gradientDirection = new IntegerProperty({ init: 0, enumVals: ['lateral', 'axial'] });
}

const newBranchGroup = () => new BranchProps();

/** Class which generates a collection of meshes and geometry for the tree model. */
export class MeshGenerator {
  public name = 'tree-model';
  private modified = true;
  private unsubscribe: UnsubscribeCallback;

  private barkGeometry = new BufferGeometry();
  private barkMaterial = new MeshStandardMaterial({ color: 0xa08000 });
  private barkOutlineMaterial = new OutlineMaterial(0.008);
  private barkMesh: Mesh;
  private barkOutlineMesh: Mesh;

  private leafGeometry = new BufferGeometry();
  private leafMaterial = new MeshStandardMaterial();
  private leafMesh: Mesh;
  private leafTexture: CanvasTexture;
  private leafMeshInstances: Matrix4[] = [];

  private group: Group = new Group();

  public canvas: HTMLCanvasElement;
  public triangleCount = new IntegerProperty({ init: 0 });

  private barkWireframe: WireframeGeometry | null = null;
  private barkLineSegments: LineSegments | null = null;

  private rnd = new Prando(200);

  // This defines the list of editable properties for the tree.
  public properties = {
    trunk: new TrunkProps(),
    branch: new RepeatingPropertyGroup(newBranchGroup),
    leafGroup: new LeavesProps(),
    leafShape: new LeafShapeProps(),
    leafColor: new LeafColorProps(),
  };

  constructor() {
    this.unsubscribe = addGlobalListener(() => {
      this.modified = true;
    });

    this.properties.branch.push();

    this.barkMesh = new Mesh(this.barkGeometry, this.barkMaterial);
    this.barkMesh.name = 'bark';
    this.barkOutlineMesh = new Mesh(this.barkGeometry, this.barkOutlineMaterial);
    this.barkOutlineMesh.name = 'barkOutline';
    this.leafMesh = new Mesh(this.leafGeometry, this.leafMaterial);
    this.leafMesh.name = 'leaf';

    this.barkOutlineMaterial.side = BackSide;

    this.leafMaterial.side = DoubleSide;
    this.leafMaterial.transparent = true;
    this.leafMaterial.alphaTest = 0.2;
    this.leafMaterial.name = 'leaf';

    this.group.add(this.barkMesh);
    this.group.add(this.barkOutlineMesh);
    this.group.add(this.leafMesh);

    this.canvas = document.createElement('canvas');
    this.canvas.width = 128;
    this.canvas.height = 128;
    this.canvas.style.zIndex = '100';
    this.leafTexture = new CanvasTexture(this.canvas);
    this.leafMaterial.map = this.leafTexture;
    this.leafMaterial.map.encoding = sRGBEncoding;
  }

  public dispose() {
    this.group.remove(this.barkMesh);
    this.group.remove(this.barkOutlineMesh);
    this.group.remove(this.leafMesh);
    this.barkGeometry.dispose();
    this.barkMaterial.dispose();
    this.barkOutlineMaterial.dispose();
    this.leafGeometry.dispose();
    this.leafMaterial.dispose();
    this.unsubscribe();
  }

  public get isModified() {
    return this.modified;
  }

  public setModified() {
    this.modified = true;
  }

  public toJson() {
    return propertyMapToJson(this.properties);
  }

  public fromJson(json: any) {
    for (const key in json) {
      const props = (this.properties as PropertyMap)[key];
      props?.fromJson(json[key]);
    }
  }

  public fromFile(file: File) {
    const loader = new GLTFLoader();
    loader.load(
      URL.createObjectURL(file),
      gltf => {
        const json = gltf.scene?.userData?.sapling;
        if (json) {
          let name = file.name;
          const index = name.lastIndexOf('.');
          this.name = name.substr(0, index);
          this.fromJson(json);
        } else {
          window.alert('Model file does not contain Sapling metadata.');
        }
      },
      undefined,
      error => {
        console.error(error);
      }
    );
  }

  public downloadGltf(name: string) {
    const binary = true;

    // Temporary scene containing just what we want to export.
    const scene = new Scene();
    scene.name = 'sapling';
    scene.userData = { sapling: this.toJson() };

    // Make a group representing the whole tree.
    const group = new Group();
    group.name = name;
    scene.add(group);

    // Do this instead of calling 'add' to prevent breakage of the original scene hierarchy.
    // TODO: Make outline mesh optional
    group.children.push(this.barkMesh, this.barkOutlineMesh, this.leafMesh);

    // Add custom data
    this.barkOutlineMaterial.userData = { outline: 0.01 };
    this.leafMaterial.userData = { billboard: true };

    // Instantiate a exporter
    const exporter = new GLTFExporter();
    exporter.parse(
      scene,
      (gltf: any) => {
        binary
          ? download(gltf, `${name}.glb`, 'model/gltf-binary')
          : download(JSON.stringify(gltf), `${name}.gltf`, 'model/gltf-binary');
        this.name = name;
      },
      { binary }
    );
  }

  public reset() {
    for (const key in this.properties) {
      const group = (this.properties as PropertyMap)[key];
      group.reset();
    }
  }

  public generate() {
    this.modified = false;
    const trunkProps = this.properties.trunk;
    this.rnd = new Prando(trunkProps.seed.value);

    const positionArray: number[] = [];
    const indexArray: number[] = [];
    this.leafMeshInstances.length = 0;
    this.growBranch(positionArray, indexArray);

    if (this.barkGeometry) {
      this.barkGeometry.dispose();
    }

    if (this.leafGeometry) {
      this.leafGeometry.dispose();
    }

    if (this.barkWireframe) {
      this.barkWireframe.dispose();
    }

    if (this.barkLineSegments) {
      this.group.remove(this.barkLineSegments);
    }

    this.barkGeometry = new BufferGeometry();
    this.barkGeometry.setIndex(indexArray);
    this.barkGeometry.setAttribute('position', new Float32BufferAttribute(positionArray, 3));
    this.barkGeometry.computeVertexNormals();
    this.barkMesh.geometry = this.barkGeometry;
    this.barkMaterial.color = new Color(trunkProps.color.value);
    this.barkMaterial.name = 'bark';
    this.barkOutlineMesh.geometry = this.barkGeometry;
    this.barkOutlineMaterial.name = 'outline';

    // Compute the outline of a single leaf
    const leafProps = this.properties.leafShape;
    const leafOutline = buildLeafPath(leafProps.values, this.rnd);
    const stamps = this.createLeafStamps();
    const twigStems: TwigStem[] = [
      // {
      //   x0: 0,
      //   y0: 0,
      //   x1: 50,
      //   y1: -30,
      //   width: 6,
      // },
      // {
      //   x0: 0,
      //   y0: 0,
      //   x1: -30,
      //   y1: 10,
      //   width: 4,
      // },
    ];
    const bounds = calcLeafBounds(leafOutline, stamps, twigStems);

    const leafTriangles = this.createLeafMesh(bounds);
    drawLeafTexture(this.canvas, leafOutline, stamps, twigStems, bounds, this.rnd, {
      ...this.properties.leafColor.values,
      stemColor: this.properties.trunk.color.value,
    });
    this.leafTexture.needsUpdate = true;

    this.barkWireframe = new WireframeGeometry(this.barkGeometry);
    this.barkLineSegments = new LineSegments(this.barkWireframe);

    if (!Array.isArray(this.barkLineSegments.material)) {
      this.barkLineSegments.material.opacity = 0.25;
      this.barkLineSegments.material.transparent = true;
    }

    this.group.add(this.barkLineSegments);
    this.barkLineSegments.visible = false;

    this.triangleCount.update(indexArray.length / 3 + leafTriangles);
    return this.group;
  }

  private growBranch(positionArray: number[], indexArray: number[]) {
    const {
      taper,
      length: trunkLength,
      radius: trunkRadius,
      segmentLength,
    } = this.properties.trunk.values;
    const branchStack = this.properties.branch.groups;
    const monopodial = growthPattern.value;

    // Note: Lengths are presumed to be in meters
    const numSectors = 6; // Number of polygon faces around the circumference

    // Estimate the length of an "average" branch from root to tip.
    let averageBranchLength = trunkLength;
    for (let level = 0; level < branchStack.length; level += 1) {
      let spanLength = branchStack[level].length.medianValue;
      if (monopodial) {
        spanLength *= branchStack[level].branchAt.medianValue;
      }
      averageBranchLength += spanLength;
    }
    // Calculate the rate at which branches get thinner per unit length.
    const contractionRate = 1 / averageBranchLength;

    const addSegmentNodeVertices = (transform: Matrix4, radius: number) => {
      // const radius = trunkRadius * Math.pow(taper, t);
      for (let i = 0; i < numSectors; i += 1) {
        const angle = (i * 2 * Math.PI) / numSectors;
        const vertex = new Vector3(
          radius * Math.sin(angle),
          0,
          radius * Math.cos(angle)
        ).applyMatrix4(transform);
        positionArray.push(vertex.x, vertex.y, vertex.z);
      }
    };

    const addSegmentFaces = (fromRing: number, toRing: number) => {
      for (let i = 0; i < numSectors; i += 1) {
        const i2 = (i + 1) % numSectors;
        indexArray.push(fromRing + i, fromRing + i2, toRing + i);
        indexArray.push(fromRing + i2, toRing + i2, toRing + i);
      }
    };

    const grow = (
      transform: Matrix4,
      branchLength: number,
      branchRadius: number,
      branchScale: number,
      branchLevel: number
    ) => {
      // Pre-allocate three.js objects used as temporary vars in calculations.
      const position = new Vector3();
      const forward = new Vector3();
      const rotation = new Matrix4();
      const tmpMatrix = new Matrix4();

      let maxIterations = 100;
      let prevRingIndex = positionArray.length / 3;
      let branchRotation = Math.PI / 2;
      let currentLength = 0;
      let hasLeaves = false;

      branchLength *= branchScale;

      // Add the ring of vertices at the base of the branch.
      addSegmentNodeVertices(transform, branchRadius);

      // Advance transform and create faces.
      const addSegment = (length: number, radius: number) => {
        // Curve branches up or down based on gravity bias
        position.setFromMatrixPosition(transform);
        rotation.extractRotation(transform);
        forward.set(0, length, 0).applyMatrix4(rotation);
        const up = new Vector3(0, 1, 0);
        const normal = up.clone().cross(forward);
        if (normal.length() > 0.01) {
          const flex = branchLevel > 0 ? branchStack[branchLevel - 1].flex.value : 0;
          const nl = normal.length();
          normal.normalize();
          tmpMatrix.makeRotationAxis(normal, flex * nl * 4);
          transform.copy(rotation).premultiply(tmpMatrix).setPosition(position);
        }

        transform.multiply(new Matrix4().makeTranslation(0, length, 0));
        const ringIndex = positionArray.length / 3;
        addSegmentNodeVertices(transform, radius);
        addSegmentFaces(prevRingIndex, ringIndex);
        prevRingIndex = ringIndex;
        currentLength += length;
      };

      const forkChildBranch = (
        yAngle: number,
        xAngle: number,
        offset: number,
        length: number,
        radius: number,
        scale: number
      ) => {
        // Compute the fork axis.
        const forkTransform = new Matrix4();
        rotation.makeRotationY(yAngle);
        rotation.multiply(tmpMatrix.makeRotationX(xAngle));

        // Rotate the transform to the new direction.
        forkTransform.copy(transform);
        forkTransform.multiply(tmpMatrix.makeTranslation(0, offset, 0));
        forkTransform.multiply(rotation);

        grow(forkTransform, length, radius, scale, branchLevel + 1);
      };

      if (monopodial) {
        // Monopodial growth pattern

        // The tip at the end of a branch, no child branches here.
        if (branchLevel >= branchStack.length) {
          // Add segments until we get to the next fork point.
          while (currentLength < branchLength) {
            const len = Math.min(segmentLength, branchLength - currentLength);
            branchRadius *= Math.pow(taper, len * contractionRate);
            addSegment(len, branchRadius);
          }
          hasLeaves = true;
        } else {
          const {
            angle,
            angleBias,
            axis,
            length,
            interval,
            symmetry,
            branchAt,
            lengthTaper,
            leaves,
          } = branchStack[branchLevel].values;

          hasLeaves = leaves;

          const firstFork = Math.min(
            branchLength,
            currentLength + this.rnd.next(...branchAt) * (branchLength - currentLength)
          );

          let nextFork = firstFork;
          while (currentLength < branchLength && maxIterations > 0) {
            maxIterations -= 1;

            // Add segments until we overshoot the next fork point.
            while (currentLength < nextFork) {
              const len = Math.min(segmentLength, branchLength - currentLength);
              branchRadius *= Math.pow(taper, len * contractionRate);
              addSegment(len, branchRadius);
            }

            while (nextFork <= currentLength && nextFork < branchLength) {
              const relativePosition = (nextFork - firstFork) / (branchLength - firstFork);
              const branchAngle = this.rnd.next(...angle) + relativePosition * angleBias;
              branchRotation += this.rnd.next(...axis);
              const forkRadius =
                branchRadius * Math.pow(taper, (nextFork - currentLength) * contractionRate);
              for (let i = 0; i < symmetry; i += 1) {
                forkChildBranch(
                  branchRotation + (i * Math.PI * 2) / symmetry,
                  -branchAngle,
                  nextFork - currentLength,
                  this.rnd.next(...length),
                  forkRadius * 0.9,
                  branchScale * (1 - relativePosition * lengthTaper)
                );
              }

              nextFork += this.rnd.next(...interval);
              nextFork = Math.min(nextFork, branchLength);
            }
          }
        }
      } else {
        // Dichotomous growth pattern

        hasLeaves = true;
        let nextFork = branchLength;
        while (branchLevel < branchStack.length) {
          maxIterations -= 1;

          // Add segments until we reach the next fork point.
          while (currentLength < nextFork) {
            const len = Math.min(segmentLength, nextFork - currentLength);
            branchRadius *= Math.pow(taper, len * contractionRate);
            addSegment(len, branchRadius);
          }

          if (branchLevel >= branchStack.length) {
            break;
          }

          const { angle, axis, length, symmetry, deflect } = branchStack[branchLevel].values;
          const branchAngle = this.rnd.next(...angle);
          branchRotation += this.rnd.next(...axis);
          for (let i = 1; i < symmetry; i += 1) {
            const childLength = this.rnd.next(...length);
            forkChildBranch(
              branchRotation + (i * Math.PI * 2) / symmetry,
              -branchAngle,
              0,
              childLength,
              branchRadius * 0.9,
              1
            );
          }

          if (symmetry > 1) {
            rotation.makeRotationY(branchRotation * this.rnd.next(...deflect));
            rotation.multiply(tmpMatrix.makeRotationX(-branchAngle));
            transform.multiply(rotation);
          }

          const childLength = this.rnd.next(...length);
          nextFork = currentLength + childLength;
          branchLevel += 1;
        }

        while (currentLength < nextFork) {
          const len = Math.min(segmentLength, nextFork - currentLength);
          branchRadius *= Math.pow(taper, len * contractionRate);
          addSegment(len, branchRadius);
        }
      }

      // Endpoint
      transform.multiply(tmpMatrix.makeTranslation(0, 0.1, 0));
      const endpointIndex = positionArray.length / 3;
      this.addBranchEnd(positionArray, transform);
      for (let i = 0; i < numSectors; i += 1) {
        const i2 = (i + 1) % numSectors;
        indexArray.push(prevRingIndex + i, prevRingIndex + i2, endpointIndex);
      }

      if (hasLeaves) {
        position.setFromMatrixPosition(transform);
        rotation.extractRotation(transform);
        forward.set(0, 1, 0).applyMatrix4(rotation).normalize();
        const up = new Vector3(0, 1, 0);
        const normal = up.clone().cross(forward).normalize();
        if (normal.length() > 0.01) {
          const binormal = normal.clone().cross(forward).normalize();
          transform.makeBasis(normal, forward, binormal).setPosition(position);
        }

        const leafSize = branchScale * 0.7 + 0.3;
        this.leafMeshInstances.push(
          transform
            .clone()
            .scale(new Vector3(leafSize, leafSize, leafSize))
            .multiply(new Matrix4().makeRotationX(-Math.PI / 2))
        );
      }
    };

    grow(new Matrix4(), trunkLength, trunkRadius, 1, 0);
  }

  private addBranchEnd(positionArray: number[], transform: Matrix4) {
    const vertex = new Vector3(0, 0, 0).applyMatrix4(transform);
    positionArray.push(vertex.x, vertex.y, vertex.z);
  }

  private createLeafMesh(bounds: Box2) {
    const positionArray: number[] = [];
    const texCoordArray: number[] = [];
    const indexArray: number[] = [];

    const scaledBounds = bounds.clone();
    scaledBounds.min.divideScalar(128);
    scaledBounds.max.divideScalar(128);

    this.leafMeshInstances.forEach(li => {
      this.createLeafFaces(scaledBounds, positionArray, texCoordArray, indexArray, li);
    });

    this.leafGeometry = new BufferGeometry();
    this.leafGeometry.setIndex(indexArray);
    this.leafGeometry.setAttribute('position', new Float32BufferAttribute(positionArray, 3));
    this.leafGeometry.setAttribute('uv', new Float32BufferAttribute(texCoordArray, 2));
    this.leafGeometry.computeVertexNormals();
    this.leafMaterial.map = this.leafTexture;
    this.leafMesh.geometry = this.leafGeometry;
    return indexArray.length / 3;
  }

  private createLeafFaces(
    bounds: Box2,
    positionArray: number[],
    texCoordArray: number[],
    indexArray: number[],
    transform: Matrix4
  ) {
    const leafGroup = this.properties.leafGroup;
    const lateralDroop = leafGroup.lateralDroop.value;
    const axialDroop = leafGroup.axialDroop.value;

    const { x: width, y: length } = bounds.getSize(new Vector2());

    // Leaf-relative coordinates:
    // * z extends along the axis of the shoot
    // * y is perpendicular up (normal to leaf face)
    // * x is perpendicular lateral (tangent to leaf face)

    const index = positionArray.length / 3;

    const sinLateral = Math.sin(lateralDroop);
    const cosLateral = Math.cos(lateralDroop);
    const sinAxial = Math.sin(axialDroop);
    const cosAxial = Math.cos(axialDroop);

    // Size of leaf mesh: 2 x 2 quads
    const numSteps = 2;

    const zs = [bounds.min.y, 0, bounds.max.y];

    // Generate vertices
    for (const dz of zs) {
      const zt = 1 - (dz - bounds.min.y) / length;
      const z = dz > 0 ? cosAxial * dz : dz;
      for (let dx = -0.5; dx <= 0.5; dx += 1 / numSteps) {
        const ax = -Math.abs(dx);
        const az = -Math.max(0, dz) * length;
        const x = cosLateral * dx * width;
        const y = sinLateral * ax * width + sinAxial * az;

        const vertex = new Vector3(x, y, z).applyMatrix4(transform);
        positionArray.push(vertex.x, vertex.y, vertex.z);
        texCoordArray.push(dx + 0.5, zt);

        // We want the center fold to be a sharp crease, so we need extra vertices.
        if (dx === 0) {
          positionArray.push(vertex.x, vertex.y, vertex.z);
          texCoordArray.push(dx + 0.5, zt);
        }
      }
    }

    const stride = numSteps + 2;
    for (let z = 0; z < numSteps; z += 1) {
      let i2 = index + z * stride;
      indexArray.push(i2, i2 + 1, i2 + stride);
      indexArray.push(i2 + stride, i2 + 1, i2 + stride + 1);

      i2 += 2;
      indexArray.push(i2, i2 + 1, i2 + stride);
      indexArray.push(i2 + stride, i2 + 1, i2 + stride + 1);
    }
  }

  private createLeafStamps(): LeafStamp[] {
    const leafGroup = this.properties.leafGroup;
    const fanSize = leafGroup.fanSize.value;
    const fanAngle = leafGroup.fanAngle.value;
    const angleVariation = leafGroup.angleVariation.value;
    const taper = leafGroup.taper.value;
    const phalanxCount = leafGroup.phalanxCount.value;
    const leafSpacing = leafGroup.leafSpacing.value;
    const leafSpacingVariation = leafGroup.leafSpacingVariation.value;
    const result: LeafStamp[] = [];

    result.push({
      angle: 0,
      scale: 1,
      translate: new Vector2(0, 0),
    });

    for (let i = 1; i < fanSize; i += 1) {
      let scale = Math.pow(taper, i / (fanSize - 1));
      result.push({
        angle: (i * fanAngle) / (fanSize - 1) + this.rnd.next(-0.5, 0.5) * angleVariation,
        scale,
        translate: new Vector2(0, 0),
      });
      result.push({
        angle: (-i * fanAngle) / (fanSize - 1) + this.rnd.next(-0.5, 0.5) * angleVariation,
        scale,
        translate: new Vector2(0, 0),
      });
    }

    let pos = 0;
    for (let i = 0; i < phalanxCount; i += 1) {
      pos -= leafSpacing;

      result.push({
        angle: fanAngle + this.rnd.next(-0.5, 0.5) * angleVariation,
        scale: taper,
        translate: new Vector2(
          0,
          pos + this.rnd.next(-0.5, 0.5) * leafSpacing * leafSpacingVariation
        ),
      });

      result.push({
        angle: -fanAngle + this.rnd.next(-0.5, 0.5) * angleVariation,
        scale: taper,
        translate: new Vector2(
          0,
          pos + this.rnd.next(-0.5, 0.5) * leafSpacing * leafSpacingVariation
        ),
      });
    }

    return result;
  }
}
