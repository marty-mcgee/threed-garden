import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  DirectionalLight,
  HemisphereLight,
  Group,
} from 'three';
import { MeshGenerator } from './MeshGenerator';
import { addGlobalListener, UnsubscribeCallback } from './properties/Property';
import { ResourcePool } from './ResourcePool';

export class SceneRenderer {
  private scene = new Scene();
  private camera: PerspectiveCamera;
  private renderer: WebGLRenderer;
  private pool = new ResourcePool();
  private frameId: number | null = null;
  private showWireframe: boolean = false;
  private group = new Group();
  private groupPool = new ResourcePool();
  private cameraAngle: number = 0;
  private unsubscribe: UnsubscribeCallback;

  constructor(private mount: HTMLElement, private generator: MeshGenerator) {
    this.render = this.render.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleWheel = this.handleWheel.bind(this);
    this.pool.add(this.scene);

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    // Setup camera
    this.camera = new PerspectiveCamera(40, width / height, 0.1, 100);
    this.updateCameraPosition();

    // Setup renderer
    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setClearColor('#202030');
    this.mount.appendChild(this.renderer.domElement);

    // Populate scene
    this.addLights();
    this.addObjects();

    // Setup window resize callback.
    window.addEventListener('resize', this.handleResize);
    this.renderer.domElement.addEventListener('wheel', this.handleWheel);

    this.unsubscribe = addGlobalListener(() => {
      this.sceneChanged();
    });

    this.sceneChanged();
  }

  public dispose() {
    this.unsubscribe();
    this.stop();
    window.removeEventListener('resize', this.handleResize);
    this.renderer.domElement.removeEventListener('wheel', this.handleWheel);
    this.mount.removeChild(this.renderer.domElement);
    this.pool.dispose();
  }

  private addLights() {
    // Ambient light
    const skyColor = 0xb1e1ff; // light blue
    const groundColor = 0xb97a20; // brownish orange
    const intensity = 0.5;
    const hLight = new HemisphereLight(skyColor, groundColor, intensity);
    this.scene.add(hLight);

    // Directional light
    const sunlight = new DirectionalLight('#ffffff', 0.5);
    sunlight.position.set(5, 7, -4);
    sunlight.target.position.set(0, 0, 0);
    this.scene.add(sunlight);
    this.scene.add(sunlight.target);
  }

  private addObjects() {
    if (this.group) {
      this.scene.remove(this.group);
      this.groupPool.dispose();
    }

    this.group = new Group();
    this.scene.add(this.group);

    // Add a generated mesh to the scene.
    const mesh = this.generator.generate();
    this.group.add(mesh);
  }

  private render() {
    this.frameId = null;
    this.updateCameraPosition();
    if (this.generator.isModified) {
      this.generator.generate();
    }

    this.renderer.render(this.scene, this.camera);
  }

  private sceneChanged() {
    if (!this.frameId) {
      this.frameId = window.requestAnimationFrame(this.render);
    }
  }

  private stop() {
    window.cancelAnimationFrame(this.frameId!);
    this.frameId = null;
  }

  private updateCameraPosition() {
    this.camera.position.z = Math.sin(this.cameraAngle) * 5;
    this.camera.position.y = 7;
    this.camera.position.x = Math.cos(this.cameraAngle) * 5;
    this.camera.lookAt(0, 2, 0);
  }

  private handleResize() {
    const width = this.mount.clientWidth;
    const height = this.mount.clientHeight;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.render();
  }

  private handleWheel(e: WheelEvent) {
    this.cameraAngle -= e.deltaX / 200;
    this.cameraAngle = this.cameraAngle % (Math.PI * 2);
    this.sceneChanged();
  }
}
