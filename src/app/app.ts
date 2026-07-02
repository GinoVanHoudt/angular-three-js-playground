import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgtCanvas, NgtCanvasImpl, NgtCanvasContent } from 'angular-three/dom';
import { SceneGraph } from '../scene-graph';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgtCanvas, SceneGraph, NgtCanvasImpl, NgtCanvasContent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
