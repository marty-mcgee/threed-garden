// ** PAPER Imports
import paper from 'paper'
// ** GRIDPAPER Imports
import { Config, defaultConfig } from './Config';
import { Rect, GeometricRect } from './Rect';
import UIOverlay from './UiController';

// A user interface on canvas
/**
 * GridPaper main class
 */
export default class GridPaper {
  // HTML elements
  /** Grid paper container, the div element to initialize on */
  container: HTMLElement;
  /** UI control conponents */
  uiOverlay: UIOverlay;
  /** Canvas to draw */
  canvas: HTMLCanvasElement;

  // Paper stuffs
  /** Paper project instance */
  paperProject: paper.Project;
  /** Paper tool instance */
  paperTool: paper.Tool;

  // Geometric properties
  /** The coordinary boundary of the project */
  bound: GeometricRect;
  /** Rectangular area indicating current display */
  displayRect: GeometricRect;
  /** Zoom factor of current view: display/bound */
  get zoomFactor() { return (this.displayRect.maxX - this.displayRect.minX) / (this.bound.maxX - this.bound.minX); }

  // Grid properties
  /** Max major grid density, number of lines/pixel */
  majorGridDensity: number;
  /** Grid series */
  gridSeries: number[][];

  // Flags
  private aspectLock = true;
  /** Canvas aspect locked */
  get aspectLocked() { return this.aspectLock; }
  set aspectLocked(newVal) { this.aspectLock = newVal; }
  //
  private showGridsFlag = true;
  /** Flag to toggle grid display */
  get showGrids() { return this.showGridsFlag; }
  set showGrids(newVal) { this.showGridsFlag = newVal; this.display(); }
  

  /** Update canvas geometric settings */
  display() {
    let [minX, maxX, minY, maxY] = [
      this.displayRect.minX,
      this.displayRect.maxX,
      this.displayRect.minY,
      this.displayRect.maxY
    ];
    if (maxX > minX && maxY > minY) {
      let p = this.paperProject.view.pixelRatio;
      let [w, h] = [this.canvas.width / p, this.canvas.height / p];
      this.paperProject.view.matrix.a = w / (maxX - minX);
      this.paperProject.view.matrix.b = 0;
      this.paperProject.view.matrix.c = 0;
      this.paperProject.view.matrix.d = h / (minY - maxY);
      this.paperProject.view.matrix.tx = w * minX / (minX - maxX);
      this.paperProject.view.matrix.ty = h * maxY / (maxY - minY);
      this.updateGridLines();
    }
  }

  constructor(config: Config) {
    let bound = config.bound || defaultConfig.bound;
    this.gridSeries = config.gridSeries || defaultConfig.gridSeries;
    this.majorGridDensity = config.majorGridDensity || defaultConfig.majorGridDensity;
    this.aspectLock = config.aspeckLocked || defaultConfig.aspeckLocked;
    this.showGridsFlag = config.showGrid || defaultConfig.showGrid;

    // UI and canvas container
    var container = document.getElementById(config.elementID);
    this.container = container;
    this.container.style.textAlign = 'left';
    this.container.style.position = 'relative';

    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.id = (this.container.id ? this.container.id : 'preview-container') + '-canvas';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.container.appendChild(this.canvas);
    var resizeCallback = () => {
      this.canvas.width = this.container.clientWidth;
      this.canvas.height = this.container.clientHeight;
    }
    resizeCallback();
    this.canvas.addEventListener('resize', resizeCallback);

    let parent = this;
    // Display rect
    (window as any).displayRect = this.displayRect = {
      _minx: bound.minX, _maxx: bound.maxX, _maxy: bound.maxY,
      _miny: bound.maxY - (bound.maxX - bound.minX) / this.canvas.width * this.canvas.height,
      get minX() { return this._minx; },
      get maxX() { return this._maxx; },
      get minY() { return this._miny; },
      get maxY() { return this._maxy; },
      set minX(newVal: number) {
        this.setMinX(newVal);
        if (parent.uiOverlay) { parent.uiOverlay.syncView(); }
        parent.display();
      },
      set maxX(newVal: number) {
        this.setMaxX(newVal);
        if (parent.uiOverlay) { parent.uiOverlay.syncView(); }
        parent.display();
      },
      set minY(newVal: number) {
        this.setMinY(newVal);
        if (parent.uiOverlay) { parent.uiOverlay.syncView(); }
        parent.display();
      },
      set maxY(newVal: number) {
        this.setMaxY(newVal);
        if (parent.uiOverlay) { parent.uiOverlay.syncView(); }
        parent.display();
      },
      // These setting functions have no callbacks
      setMinX(newVal: number) { this._minx = newVal; },
      setMaxX(newVal: number) { this._maxx = newVal; },
      setMinY(newVal: number) { this._miny = newVal; },
      setMaxY(newVal: number) { this._maxy = newVal; }
    };

    // Bound rect
    this.bound = {
      _minx: bound.minX, _maxx: bound.maxX, _miny: bound.minY, _maxy: bound.maxY,
      get minX() { return this._minx; },
      get maxX() { return this._maxx; },
      get minY() { return this._miny; },
      get maxY() { return this._maxy; },
      set minX(newVal: number) {
        if (parent.uiOverlay) { parent.uiOverlay.syncView(); }
        this.setMinX(newVal);
        parent.display();
      },
      set maxX(newVal: number) {
        if (parent.uiOverlay) { parent.uiOverlay.syncView(); }
        this.setMaxX(newVal);
        parent.display();
      },
      set minY(newVal: number) {
        if (parent.uiOverlay) { parent.uiOverlay.syncView(); }
        this.setMinY(newVal);
        parent.display();
      },
      set maxY(newVal: number) {
        if (parent.uiOverlay) { parent.uiOverlay.syncView(); }
        this.setMaxY(newVal);
        parent.display();
      },
      // These setting functions have no callbacks
      setMinX(newVal: number) { this._minx = newVal; },
      setMaxX(newVal: number) { this._maxx = newVal; },
      setMinY(newVal: number) { this._miny = newVal; },
      setMaxY(newVal: number) { this._maxy = newVal; }
    };

    // Create UI overlay
    this.uiOverlay = new UIOverlay(this);

    // Set up paper on canvas
    this.paperProject = new paper.Project(this.canvas);
    this.paperTool = new paper.Tool();

    this.paperTool.onMouseDown = (event: paper.ToolEvent) => {
      this.paperProject.view.translate(new paper.Point(10, 10));
    }

    this.display();
  }

  /** Use the current paper project */
  useProject() { paper.project = this.paperProject; }

  // View controlling
  /** Scaling the display rectangle */
  zoomDisplay(point: paper.Point, scale: number): void;
  zoomDisplay(projectX: number, projectY: number, scale: number): void;
  zoomDisplay(...args: any[]) {
    // First case
    var x, y: number;
    if (typeof args[0] != 'number') {
      x = (args[0] as paper.Point).x;
      y = (args[0] as paper.Point).y;
    } else {
      x = args[0] as number;
      y = args[1] as number;
    }
    let scale = args.pop();
    // Nothing to scale
    if (scale === 1) return;
    // Too big to scale
    if (scale > 1 && (this.displayRect.minX === this.bound.minX && this.displayRect.maxX === this.bound.maxX
      || this.displayRect.minY === this.bound.minY && this.displayRect.maxY === this.bound.maxY))
      return;
    // Too small to scale
    if (scale < 1 && this.uiOverlay.horizontalBar.upperBound - this.uiOverlay.horizontalBar.lowerBound < this.uiOverlay.horizontalBar.lower)
      return;
    if (scale < 1 && this.uiOverlay.verticalBar.upperBound - this.uiOverlay.verticalBar.lowerBound < this.uiOverlay.verticalBar.upper)
      return;
    let offsets: Rect = {
      minX: this.displayRect.minX - x,
      maxX: this.displayRect.maxX - x,
      minY: this.displayRect.minY - y,
      maxY: this.displayRect.maxY - y
    };
    offsets.minX *= scale; offsets.maxX *= scale;
    offsets.minY *= scale; offsets.maxY *= scale;
    let expected: Rect = {
      minX: offsets.minX + x,
      maxX: offsets.maxX + x,
      minY: offsets.minY + y,
      maxY: offsets.maxY + y
    }
    if (expected.minY < this.bound.minY) {
      let d = this.bound.minY - expected.minY;
      expected.minY = this.bound.minY;
      expected.maxY += d;
      if (expected.maxY > this.bound.maxY) {
        expected.maxY = this.bound.maxX;
        let expectedDx = (this.bound.maxY - this.bound.minY) / this.canvas.height * this.canvas.width;
        let diff = expectedDx - (expected.maxX - expected.minX);
        expected.maxX += diff / 2; expected.minX -= diff / 2;
      }
    }
    if (expected.maxY > this.bound.maxY) {
      let d = expected.maxY - this.bound.maxY;
      expected.maxY = this.bound.maxY;
      expected.minY -= d;
      if (expected.minY < this.bound.minY) {
        expected.minY = this.bound.minY;
        let expectedDx = (this.bound.maxY - this.bound.minY) / this.canvas.height * this.canvas.width;
        let diff = expectedDx - (expected.maxX - expected.minX);
        expected.minX += diff / 2; expected.minX -= diff / 2;
      }
    }
    if (expected.minX < this.bound.minX) {
      let d = this.bound.minX - expected.minX;
      expected.minX = this.bound.minX;
      expected.maxX += d;
      if (expected.maxX > this.bound.maxX) {
        expected.maxX = this.bound.maxX;
        let expectedDy = (this.bound.maxX - this.bound.minX) / this.canvas.width * this.canvas.height;
        let diff = expectedDy - (expected.maxY - expected.minY);
        expected.maxY += diff / 2; expected.minY -= diff / 2;
      }
    }
    if (expected.maxX > this.bound.maxX) {
      let d = expected.maxX - this.bound.maxX;
      expected.maxX = this.bound.maxX;
      expected.minX -= d;
      if (expected.minX < this.bound.minX) {
        expected.minX = this.bound.minX;
        let expectedDy = (this.bound.maxX - this.bound.minX) / this.canvas.width * this.canvas.height;
        let diff = expectedDy - (expected.maxY - expected.minY);
        expected.maxY += diff / 2; expected.minY -= diff / 2;
      }
    }

    // Update view
    this.displayRect.minX = expected.minX;
    this.displayRect.maxX = expected.maxX;
    this.displayRect.minY = expected.minY;
    this.displayRect.maxY = expected.maxY;
    this.uiOverlay.syncView();
  }

  scrollHorizontally(offset: number) {
    if (this.displayRect.minX + offset < this.bound.minX) offset = this.bound.minX - this.displayRect.minX;
    if (this.displayRect.maxX + offset > this.bound.maxX) offset = this.bound.maxX - this.displayRect.maxX;
    this.displayRect.minX += offset;
    this.displayRect.maxX += offset;
    this.uiOverlay.syncView();
  }

  scrollVertically(offset: number) {
    if (this.displayRect.minY + offset < this.bound.minY) offset = this.bound.minY - this.displayRect.minY;
    if (this.displayRect.maxY + offset > this.bound.maxY) offset = this.bound.maxY - this.displayRect.maxY;
    this.displayRect.minY += offset;
    this.displayRect.maxY += offset;
    this.uiOverlay.syncView();
  }

  hMajorGridLines: paper.Path[] = [];
  hMinorGridLines: paper.Path[] = [];
  vMajorGridLines: paper.Path[] = [];
  vMinorGridLines: paper.Path[] = [];
  updateGridLines() {
    // Number of max horizontal grid lines
    let nMaxHorizontal = Math.ceil(this.majorGridDensity * this.canvas.height);
    // Number of max vertical grid lines
    let nMaxVertical = Math.ceil(this.majorGridDensity * this.canvas.width);
    // Check if the grid series is useable
    const checkGridUseability = (a: number[]) => {
      let max = Math.max.apply(this, a);
      if (max * nMaxHorizontal > this.displayRect.maxY - this.displayRect.minY
        && max * nMaxVertical > this.displayRect.maxX - this.displayRect.minX) return true;
      else return false;
    }
    // Number of major grid lines
    let nHMajorGridLines = 0, nVMajorGridLines = 0;
    // Number of minor grid lines
    let nHMinorGridLines = 0, nVMinorGridLines = 0;
    let useableGrid: number[] = [0, 0];
    if (this.showGridsFlag) {
      for (let i in this.gridSeries) {
        let max = Math.max.apply(this, this.gridSeries[i]);
        let min = Math.min.apply(this, this.gridSeries[i]);
        if (checkGridUseability(this.gridSeries[i])) {
          useableGrid = this.gridSeries[i];
          nHMajorGridLines = Math.ceil((this.displayRect.maxY - this.displayRect.minY) / max);
          nVMajorGridLines = Math.ceil((this.displayRect.maxX - this.displayRect.minX) / max);
          nHMinorGridLines = Math.ceil((this.displayRect.maxY - this.displayRect.minY) / min);
          nVMinorGridLines = Math.ceil((this.displayRect.maxX - this.displayRect.minX) / min);
          break;
        }
      }
    }

    // Update grid line storages
    let savedProject = paper.project;
    paper.project = this.paperProject;
    [[this.hMajorGridLines, nHMajorGridLines], [this.hMinorGridLines, nHMinorGridLines],
    [this.vMajorGridLines, nVMajorGridLines], [this.vMinorGridLines, nVMinorGridLines]]
      .map(args => ((a: paper.Path[], n: number) => {
        let length = a.length;
        if (length < n) {
          for (let i = 0; i < n - length; i++) {
            a.push(new paper.Path([[0, 0], [0, 0]]));
          }
        }
      }).apply(this, args));
    paper.project = savedProject;

    // Here to update the grid lines
    let i = 0;
    let maxUseable = Math.max.apply(this, useableGrid);
    let firstMajorHLineY = Math.ceil(this.displayRect.minY / maxUseable) * maxUseable;
    for (let hline of this.hMajorGridLines) {
      hline.segments[0].point.x = this.displayRect.minX - 10;
      hline.segments[0].point.y = firstMajorHLineY + i * maxUseable;
      hline.segments[1].point.x = this.displayRect.maxX + 10;
      hline.segments[1].point.y = firstMajorHLineY + i * maxUseable;
      i++;
    }
    i = 0;
    let firstMajorVLineX = Math.ceil(this.displayRect.minX / maxUseable) * maxUseable;
    for (let vline of this.vMajorGridLines) {
      vline.segments[0].point.x = firstMajorVLineX + i * maxUseable;
      vline.segments[0].point.y = this.displayRect.minY - 10;
      vline.segments[1].point.x = firstMajorVLineX + i * maxUseable;
      vline.segments[1].point.y = this.displayRect.maxY + 10;
      i++;
    }
    i = 0;
    let minUseable = Math.min.apply(this, useableGrid);
    let firstMinorHLineY = Math.ceil(this.displayRect.minY / minUseable) * minUseable;
    for (let hline of this.hMinorGridLines) {
      hline.segments[0].point.x = this.displayRect.minX - 10;
      hline.segments[0].point.y = firstMinorHLineY + i * minUseable;
      hline.segments[1].point.x = this.displayRect.maxX + 10;
      hline.segments[1].point.y = firstMinorHLineY + i * minUseable;
      i++;
    }
    i = 0;
    let firstMinorVLineX = Math.ceil(this.displayRect.minX / minUseable) * minUseable;
    for (let vline of this.vMinorGridLines) {
      vline.segments[0].point.y = this.displayRect.minY - 10;
      vline.segments[1].point.y = this.displayRect.maxY + 10;
      vline.segments[0].point.x = firstMinorVLineX + i * minUseable;
      vline.segments[1].point.x = firstMinorVLineX + i * minUseable;
      i++;
    }

    this.hMajorGridLines.map(this.stylizeMajor, this);
    this.vMajorGridLines.map(this.stylizeMajor, this);
    this.hMinorGridLines.map(this.stylizeMinor, this);
    this.vMinorGridLines.map(this.stylizeMinor, this);
  }

  /** Stylizing major grid lines */
  stylizeMajor(line: paper.Path) {
    line.strokeColor = new paper.Color(200, 200, 200, 1) // '#CCCCCC';
    line.strokeWidth = this.zoomFactor * 2;
  }
  /** Styleizing minor grid lines */
  stylizeMinor(line: paper.Path) {
    line.strokeColor = new paper.Color(222, 222, 222, 1) // '#DDDDDD';
    line.strokeWidth = this.zoomFactor;
  }

  destruct(): void {
    this.container.removeChild(this.uiOverlay.container);
    this.container.removeChild(this.canvas);
  }
};  