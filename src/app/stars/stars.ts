import { Component } from '@angular/core';
import { NgtCanvas, NgtCanvasImpl, NgtCanvasContent } from 'angular-three/dom';
import { SceneGraph } from '../stars/scene-graph';

@Component({
  selector: 'app-stars',
  imports: [NgtCanvas, NgtCanvasImpl, NgtCanvasContent, SceneGraph],
  template: `
    <ngt-canvas [camera]="{ position: [0, 0, 1] }">
      <app-scene-graph *canvasContent />
    </ngt-canvas>
  `,
  // The canvas sizes itself to its host element, so the route component
  // needs an explicit size — otherwise WebGL renders into a 0px box.
  styles: `
    :host {
      display: block;
      width: 100%;
      height: 100vh;
      background: black;
    }
  `,
})
export default class Stars {}
