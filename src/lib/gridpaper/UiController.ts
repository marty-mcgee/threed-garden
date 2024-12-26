import GridPaper from './GridPaper';
import * as dual from 'dual-range-bar';
import './style.css';

export default class UIOverlay {
  /** UI Overlay Container */
  container: HTMLElement;
  /** This area lies below the UI components, and works as the event receiver */
  eventActiveArea: HTMLElement;
  /** Synchronize UI components with the geometric properties */
  syncView: () => void;
  /** Horizontal dual range bar */
  horizontalBar: dual.HRange;
  /** Vertical dual range bar */
  verticalBar: dual.VRange;
  /** Toggling grid button container */
  buttonContainer: HTMLElement;
  /** Button to toggle grid display */
  gridButton: HTMLButtonElement;

  // Flags
  private ctrlDownFlag  = false;
  private altDownFlag   = false;
  private shiftDownFlag = false;
  private mouseOver     = false;

  constructor(gridPaper: GridPaper) {
    // Create UI Overlay
    this.container = document.createElement('div');
    this.container.style.position = 'relative';
    this.container.style.width = '100%';
    this.container.style.height = '100%';
    gridPaper.container.appendChild(this.container);

    // Horizontal dual range bar for scrolling
    let hbarContainer = document.createElement('div');
    hbarContainer.className = 'hbar-container';
    hbarContainer.style.height = '20px';
    hbarContainer.style.width = 'calc(100% - 125px)';
    hbarContainer.style.margin = '20px 40px';
    hbarContainer.style.position = 'absolute';
    hbarContainer.style.bottom = '0px';
    hbarContainer.style.zIndex = '1';
    let hbar = document.createElement('div');
    hbar.id = `horizontal-scrolling-bar-${new Date().getTime()}`;
    hbar.style.height = '100%';
    hbar.style.width = '100%';
    hbar.style.position = 'relative';
    hbarContainer.appendChild(hbar);
    this.container.appendChild(hbarContainer);
    this.horizontalBar = dual.HRange.getObject(hbar.id);
    this.horizontalBar.lowerBound = 0;
    this.horizontalBar.upperBound = 1;
    // Vertical dual range bar for scrolling
    let vbarContainer = document.createElement('div');
    vbarContainer.className = 'vbar-container';
    vbarContainer.style.height = 'calc(100% - 120px)';
    vbarContainer.style.width = '20px';
    vbarContainer.style.margin = '40px 20px';
    vbarContainer.style.position = 'absolute';
    vbarContainer.style.right = '0px';
    vbarContainer.style.zIndex = '1';
    let vbar = document.createElement('div');
    vbar.id = `vertical-scrolling-bar-${new Date().getTime()}`;
    vbar.style.height = '100%';
    vbar.style.width = '100%';
    vbar.style.position = 'relative';
    vbarContainer.appendChild(vbar);
    this.container.appendChild(vbarContainer);
    this.verticalBar = dual.VRange.getObject(vbar.id);
    this.verticalBar.lowerBound = 0;
    this.verticalBar.upperBound = 1;
    
    // Grid toggling button
    let buttonContainer = this.buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    buttonContainer.style.width = '42px';
    buttonContainer.style.height = '42px';
    buttonContainer.style.position = 'absolute';
    buttonContainer.style.right = '0px';
    buttonContainer.style.bottom = '0px';
    buttonContainer.style.margin = '16px';
    buttonContainer.style.zIndex = '1';
    let gridButton = this.gridButton = document.createElement('button');
    gridButton.className = 'grid-button';
    if(gridPaper.showGrids) {
      gridButton.classList.add('grid-on');
    } else {
      gridButton.classList.add('grid-off');
    }
    gridButton.style.width = '42px';
    gridButton.style.height = '42px';
    gridButton.innerHTML = `
  <svg version="1.1" class="icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
  viewBox="0 0 100 100" style="enable-background:new 0 0 100 100;" xml:space="preserve">
    <rect x="10" y="10" width="24" height="24"/>
    <rect x="40" y="10" width="24" height="24"/>
    <rect x="70" y="10" width="24" height="24"/>
    <rect x="10" y="40" width="24" height="24"/>
    <rect x="40" y="40" width="24" height="24"/>
    <rect x="70" y="40" width="24" height="24"/>
    <rect x="10" y="70" width="24" height="24"/>
    <rect x="40" y="70" width="24" height="24"/>
    <rect x="70" y="70" width="24" height="24"/>
  </svg>`
    gridButton.style.lineHeight = '120%';
    gridButton.style.textAlign = 'center';
    gridButton.addEventListener('click', (event) => {
      gridPaper.showGrids = !gridPaper.showGrids;
      if(gridPaper.showGrids)
        gridButton.classList.replace('grid-off', 'grid-on');
      else
        gridButton.classList.replace('grid-on', 'grid-off');
    })
    buttonContainer.appendChild(gridButton);
    this.container.appendChild(buttonContainer);

    // Event active area
    this.eventActiveArea = document.createElement('div');
    this.eventActiveArea.style.position = 'relative';
    this.eventActiveArea.style.width = '100%';
    this.eventActiveArea.style.height = '100%';
    this.eventActiveArea.style.zIndex = '0';
    this.container.appendChild(this.eventActiveArea);

    // Min differences of the range bars
    let rx = gridPaper.canvas.width / (gridPaper.bound.maxX - gridPaper.bound.minX);
    let ry = gridPaper.canvas.height / (gridPaper.bound.maxY - gridPaper.bound.minY);
    if (rx > ry) {
      this.horizontalBar.relativeMinDifference = 0.1 * rx / ry;
      this.horizontalBar.relativeMaxDifference = 1.0;
      this.verticalBar.relativeMinDifference = 0.1;
      this.verticalBar.relativeMaxDifference = 1.0 * ry / rx;
    } else {
      this.horizontalBar.relativeMinDifference = 0.1;
      this.horizontalBar.relativeMaxDifference = 1.0 * rx / ry;
      this.verticalBar.relativeMinDifference = 0.1 * ry / rx;
      this.verticalBar.relativeMaxDifference = 1.0;
    }

    // Synchronize the display rect with the UI elements & v.v.
    // But these function do not actually refresh the view
    var syncViewByHorizontal = () => {
      let lower = this.horizontalBar.lowerRange;
      let upper = this.horizontalBar.upperRange;
      let minX = lower * (gridPaper.bound.maxX - gridPaper.bound.minX) + gridPaper.bound.minX;
      let maxX = upper * (gridPaper.bound.maxX - gridPaper.bound.minX) + gridPaper.bound.minX;
      gridPaper.displayRect.setMinX(minX);
      gridPaper.displayRect.setMaxX(maxX);
      gridPaper.display();
      // Calculate the veritcal bar
      if (gridPaper.aspectLocked) {
        let displayAspect = gridPaper.canvas.width / gridPaper.canvas.height;
        let verticalDiff = (maxX - minX) / displayAspect;
        let verticalMid = (gridPaper.displayRect.minY + gridPaper.displayRect.maxY) / 2;
        if (verticalMid - verticalDiff / 2 < gridPaper.bound.minY) {
          gridPaper.displayRect.setMinY(gridPaper.bound.minY);
          gridPaper.displayRect.setMaxY(gridPaper.bound.minY + verticalDiff);
        } else if (verticalMid + verticalDiff / 2 > gridPaper.bound.maxY) {
          gridPaper.displayRect.setMinY(gridPaper.bound.maxY - verticalDiff);
          gridPaper.displayRect.setMaxY(gridPaper.bound.maxY);
        } else {
          gridPaper.displayRect.setMinY(verticalMid - verticalDiff / 2);
          gridPaper.displayRect.setMaxY(verticalMid + verticalDiff / 2);
        }
      }
      // Synchronize the changes to the scroll bars
      this.verticalBar.setLowerRange((gridPaper.bound.maxY - gridPaper.displayRect.maxY) / (gridPaper.bound.maxY - gridPaper.bound.minY));
      this.verticalBar.setUpperRange((gridPaper.bound.maxY - gridPaper.displayRect.minY) / (gridPaper.bound.maxY - gridPaper.bound.minY));
    }
    var syncViewByVertical = () => {
      let lower = 1 - this.verticalBar.upperRange;
      let upper = 1 - this.verticalBar.lowerRange;
      let minY = lower * (gridPaper.bound.maxY - gridPaper.bound.minY) + gridPaper.bound.minY;
      let maxY = upper * (gridPaper.bound.maxY - gridPaper.bound.minY) + gridPaper.bound.minY;
      gridPaper.displayRect.setMinY(minY);
      gridPaper.displayRect.setMaxY(maxY);
      // Calculate the vertical bar
      if (gridPaper.aspectLocked) {
        let displayAspect = gridPaper.canvas.width / gridPaper.canvas.height;
        let horizontalDiff = (maxY - minY) * displayAspect;
        let horizontalMid = (gridPaper.displayRect.minX + gridPaper.displayRect.maxX) / 2;
        if (horizontalMid - horizontalDiff / 2 < gridPaper.bound.minX) {
          gridPaper.displayRect.setMinX(gridPaper.bound.minX);
          gridPaper.displayRect.setMaxX(gridPaper.bound.minX + horizontalDiff);
          gridPaper.display();
        } else if (horizontalMid + horizontalDiff / 2 > gridPaper.bound.maxX) {
          gridPaper.displayRect.setMinX(gridPaper.bound.maxX - horizontalDiff);
          gridPaper.displayRect.setMaxX(gridPaper.bound.maxX);
          gridPaper.display();
        } else {
          gridPaper.displayRect.setMinX(horizontalMid - horizontalDiff / 2);
          gridPaper.displayRect.setMaxX(horizontalMid + horizontalDiff / 2);
          gridPaper.display();
        }
      }
      // Synchronize the changes to the scroll bars
      this.horizontalBar.setLowerRange((gridPaper.displayRect.minX - gridPaper.bound.minX) / (gridPaper.bound.maxX - gridPaper.bound.minX));
      this.horizontalBar.setUpperRange((gridPaper.displayRect.maxX - gridPaper.bound.minX) / (gridPaper.bound.maxX - gridPaper.bound.minX));
    }

    this.horizontalBar.addLowerRangeChangeCallback((val: number) => { syncViewByHorizontal(); });
    this.horizontalBar.addUpperRangeChangeCallback((val: number) => { syncViewByHorizontal(); });
    this.verticalBar.addLowerRangeChangeCallback((val: number) => { syncViewByVertical(); });
    this.verticalBar.addUpperRangeChangeCallback((val: number) => { syncViewByVertical(); });

    this.syncView = () => {
      let boundWidth  = gridPaper.bound.maxX - gridPaper.bound.minX;
      let boundHeight = gridPaper.bound.maxY - gridPaper.bound.minY;
      let minX = (gridPaper.displayRect.minX - gridPaper.bound.minX)/boundWidth;
      let maxX = (gridPaper.displayRect.maxX - gridPaper.bound.minX)/boundWidth;
      let minY = (gridPaper.bound.maxY - gridPaper.displayRect.maxY)/boundHeight;
      let maxY = (gridPaper.bound.maxY - gridPaper.displayRect.minY)/boundHeight;
      this.horizontalBar.setLowerRange(minX);
      this.horizontalBar.setUpperRange(maxX);
      this.verticalBar.setLowerRange(minY);
      this.verticalBar.setUpperRange(maxY);
    }

    var mac = false;
    if(window.navigator.userAgent.search('Mac') > 0) mac = true;
    this.eventActiveArea.addEventListener('mouseover', (event: MouseEvent) => this.mouseOver = true);
    this.eventActiveArea.addEventListener('mouseout', (event: MouseEvent) => this.mouseOver = false);
    // Binding preview window area events
    window.addEventListener('keydown', (event) => {
      if(this.mouseOver) {
        if(event.key === 'Alt')   this.altDownFlag    = true;
        if(event.key === 'Shift') this.shiftDownFlag  = true;
        if(mac) { if(event.key === 'Meta')      this.ctrlDownFlag = true; }
        else    { if(event.key === 'Control')   this.ctrlDownFlag = true; }
      } else {
        this.altDownFlag = false; this.shiftDownFlag = false; this.ctrlDownFlag = false;
      }
    });
    window.addEventListener('keyup', (event) => {
      if(this.mouseOver) {
        if(event.key === 'Alt')   this.altDownFlag    = false;
        if(event.key === 'Shift') this.shiftDownFlag  = false;
        if(mac) { if(event.key === 'Meta')      this.ctrlDownFlag = false; }
        else    { if(event.key === 'Control')   this.ctrlDownFlag = false; }
      } else {
        this.altDownFlag = false; this.shiftDownFlag = false; this.ctrlDownFlag = false;
      }
    });
    this.eventActiveArea.addEventListener('wheel', (event) => {
      event.preventDefault();

      let r = gridPaper.zoomFactor;

      // Scaling 
      if(this.altDownFlag) {
        let pPos = gridPaper.paperProject.view.viewToProject(new paper.Point(event.offsetX, event.offsetY));
        let d = event.deltaY/1000;
        gridPaper.zoomDisplay(pPos, Math.exp(d));
      } else {
        if(this.shiftDownFlag) {
          let d = event.deltaY/r;
          if(d === 0) d = event.deltaX/r;
          gridPaper.scrollHorizontally(d);
        } else {
          let d = -event.deltaY/r;
          gridPaper.scrollVertically(d);
        }
      }
    });
  }
}
