import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgtCanvas, NgtCanvasImpl } from 'angular-three/dom';
import { SceneGraph } from '../scene-graph';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgtCanvas, SceneGraph, NgtCanvasImpl],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('angular-threejs-playground');
}
