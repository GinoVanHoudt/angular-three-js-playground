import {
  CUSTOM_ELEMENTS_SCHEMA,
  Component,
  viewChild, ElementRef,
} from '@angular/core';
import { extend, beforeRender } from 'angular-three';
import { NgtsPointsBuffer } from 'angular-three-soba/performances';
import { NgtsPointMaterial } from 'angular-three-soba/materials';
import { random } from 'maath';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { Mesh, MeshBasicMaterial, PointsMaterialParameters, ConeGeometry, CylinderGeometry, Group, Shape, ExtrudeGeometry, AdditiveBlending } from 'three';
import { NgtArgs } from 'angular-three';

@Component({
  selector: 'app-scene-graph',
  template: `
    <ngt-group [rotation]="[0,0,1]">
      <ngts-points-buffer [positions]="sphere" [stride]="3" [options]="{ frustumCulled: false }">
        <ngts-point-material [options]="starMaterialOptions"
        />
      </ngts-points-buffer>
    </ngt-group>
    <ngt-group #ship [scale]="0.5">
      <!-- body: vertical cylinder centered at origin -->
      <ngt-mesh>
        <ngt-cylinder-geometry *args="[0.1, 0.1, 0.5, 16]" />
        <ngt-mesh-basic-material color="silver" />
      </ngt-mesh>

      <!-- nose: cone sits on top of the body -->
      <!-- y = half body (0.25) + half cone (0.125) = 0.375 -->
      <ngt-mesh [position]="[0, 0.375, 0]">
        <ngt-cone-geometry *args="[0.1, 0.25, 16]" />
        <ngt-mesh-basic-material color="crimson" />
      </ngt-mesh>

      <!-- fins: one triangular profile (finShape) extruded thin, mirrored on ±X.
           attach at body surface (x = ±0.1); -X fin is the same shape flipped with scale -1 -->
      <ngt-mesh [position]="[0.1, 0, -0.015]">
        <ngt-extrude-geometry *args="[finShape, finSettings]" />
        <ngt-mesh-basic-material color="steelblue" />
      </ngt-mesh>
      <ngt-mesh [position]="[-0.1, 0, -0.015]" [scale]="[-1, 1, 1]">
        <ngt-extrude-geometry *args="[finShape, finSettings]" />
        <ngt-mesh-basic-material color="steelblue" />
      </ngt-mesh>

      <!-- exhaust flame (outer): an inverted cone at the engine bottom. Only this flickers. -->
      <ngt-mesh #flame [position]="[0, -0.4, 0]" [rotation]="[Math.PI, 0, 0]">
        <ngt-cone-geometry *args="[0.08, 0.3, 16]" />
        <ngt-mesh-basic-material
          color="orange"
          [transparent]="true"
          [opacity]="0.9"
          [depthWrite]="false"
          [blending]="additiveBlending"
        />
      </ngt-mesh>

      <!-- hot inner core: sibling of the flame so it's fixed in the SHIP's frame,
           not dragged by the outer flame's animated scale. -->
      <ngt-mesh [position]="[0, -0.35, 0]" [rotation]="[Math.PI, 0, 0]" [scale]="0.6">
        <ngt-cone-geometry *args="[0.08, 0.3, 16]" />
        <ngt-mesh-basic-material
          color="yellow" [transparent]="true" [opacity]="0.9"
          [depthWrite]="false" [blending]="additiveBlending"
        />
      </ngt-mesh>
    </ngt-group>
    <ngts-orbit-controls/>
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    NgtsPointsBuffer,
    NgtsPointMaterial,
    NgtsOrbitControls,
    NgtArgs,
  ],
})
export class SceneGraph {
  protected readonly Math = Math;
  protected readonly additiveBlending = AdditiveBlending; // numeric constant from three

  private pointsBufferRef = viewChild.required(NgtsPointsBuffer);
  private shipRef = viewChild.required<ElementRef<Group>>('ship');
  private flameRef = viewChild.required<ElementRef<Mesh>>('flame');

  protected readonly sphere = random.inSphere(new Float32Array(5000), { radius: 1.5 }) as Float32Array;

  protected readonly starMaterialOptions:  PointsMaterialParameters = {
    transparent: true,
    color: 'orange',
    size: 0.005,
    sizeAttenuation: true,
    depthWrite: true,
  } ;

  // Fin = a 2D triangle profile (in XY) that ExtrudeGeometry pushes along Z to give it thickness.
  // A=root leading edge, B=root trailing (body bottom), C=swept tip out & below the body.
  protected readonly finShape = (() => {
    const s = new Shape();
    s.moveTo(0, 0.05);    // A
    s.lineTo(0, -0.25);   // B
    s.lineTo(0.25, -0.32);// C — the A→C edge is the sleek swept leading edge
    s.closePath();
    return s;
  })();

  protected readonly finSettings = { depth: 0.03, bevelEnabled: false };

  constructor() {
    extend({ Mesh, ExtrudeGeometry, MeshBasicMaterial, ConeGeometry, CylinderGeometry, Group });

    beforeRender(({ delta }) => {
      // delta = seconds since last frame
      const points = this.pointsBufferRef().pointsRef().nativeElement
      points.rotation.x += delta/15;
      points.rotation.y += delta/15;
    });

    beforeRender(({ clock }) => {
      const ship = this.shipRef().nativeElement;
      ship.rotation.y = Math.sin(clock.elapsedTime) * 0.3; // rotating bob
    });

    beforeRender(({ clock }) => {
      const flame = this.flameRef().nativeElement;
      const t = clock.elapsedTime;

      // length: steady pulse + random jitter → an unsteady, licking flame
      flame.scale.y = 1 + Math.sin(t * 25) * 0.1 + Math.random() * 0.15;

      // width wobbles on a different frequency so it doesn't feel rigid
      flame.scale.x = flame.scale.z = 1 + Math.sin(t * 17) * 0.05;
    });
  }
}
