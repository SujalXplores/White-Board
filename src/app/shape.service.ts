import { Injectable } from '@angular/core';
import Konva from 'konva';

@Injectable({
  providedIn: 'root'
})
export class ShapeService {
  line(pos: any, size: any) {
    return new Konva.Line({
      stroke: 'red',
      strokeWidth: size,
      globalCompositeOperation: 'source-over',
      points: [pos.x, pos.y],
      draggable: false
    });
  }

  erase(pos: any, size: any) {
    return new Konva.Line({
      stroke: 'white',
      strokeWidth: size,
      globalCompositeOperation: 'destination-out',
      points: [pos.x, pos.y],
      draggable: false
    });
  }
}
