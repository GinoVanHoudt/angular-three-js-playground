import {
  CUSTOM_ELEMENTS_SCHEMA,
  Component,
  viewChild,
  ElementRef,
} from '@angular/core';
import { extend, beforeRender } from 'angular-three';
import { Mesh, BoxGeometry, MeshBasicMaterial, PointsMaterialParameters } from 'three';
import { NgtsPointsBuffer } from 'angular-three-soba/performances';
import { NgtsPointMaterial } from 'angular-three-soba/materials';
import { random } from 'maath';
import { NgtsOrbitControls } from 'angular-three-soba/controls';


@Component({
  selector: 'app-scene-graph',
  template: `
    <ngt-mesh #mesh>
<!--      <ngt-box-geometry/>-->
      <ngt-mesh-basic-material color="hotpink"/>
    </ngt-mesh>
    <ngt-group [rotation]="[0,0,1]">
      <ngts-points-buffer [positions]="sphere" [stride]="3" [options]="{ frustumCulled: false }">
        <ngts-point-material [options]="starMaterialOptions"
        />
      </ngts-points-buffer>
    </ngt-group>
    <ngts-orbit-controls/>
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    NgtsPointsBuffer,
    NgtsPointMaterial,
    NgtsOrbitControls,
  ],
})
export class SceneGraph {
  // private meshRef = viewChild.required<ElementRef<Mesh>>('mesh');
  private pointsBufferRef = viewChild.required(NgtsPointsBuffer);

  protected readonly sphere = random.inSphere(new Float32Array(5000), { radius: 1.5 }) as Float32Array;

  protected readonly starMaterialOptions:  PointsMaterialParameters = {
    transparent: true,
    color: 'orange',
    size: 0.005,
    sizeAttenuation: true,
    depthWrite: true,
  } ;

  constructor() {
    extend({ Mesh, BoxGeometry, MeshBasicMaterial });

    beforeRender(({ delta }) => {
      // delta = seconds since last frame
      const points = this.pointsBufferRef().pointsRef().nativeElement
      points.rotation.x += delta/15;
      points.rotation.y += delta/15;
    });
  }
}
