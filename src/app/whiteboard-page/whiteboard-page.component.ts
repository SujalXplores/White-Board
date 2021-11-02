import { Component, OnInit } from '@angular/core';
import { ShapeService } from '../shape.service';
import Konva from 'konva';

@Component({
  selector: 'app-whiteboard-page',
  templateUrl: './whiteboard-page.component.html',
  styleUrls: ['./whiteboard-page.component.scss']
})
export class WhiteboardPageComponent implements OnInit {
  shapes: any = [];
  stage!: Konva.Stage;
  layer!: Konva.Layer;
  selectedButton: any = {
    'line': false,
    'undo': false,
    'erase': false
  }
  erase: boolean = false;
  transformers: Konva.Transformer[] = [];

  constructor(
    private shapeService: ShapeService
  ) { }

  ngOnInit() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.stage = new Konva.Stage({
      container: 'container',
      width: width,
      height: height
    });
    this.layer = new Konva.Layer();
    this.stage.add(this.layer);
    this.addLineListeners();
  }

  clearSelection() {
    Object.keys(this.selectedButton).forEach(key => {
      this.selectedButton[key] = false;
    })
  }

  setSelection(type: string) {
    this.clearSelection();
    this.selectedButton[type] = true;
    if (!(type === 'line')) this.selectedButton['line'] = false;
    console.log(type);
    switch (type) {
      case "erase":
        this.erase = true;
        document.getElementById('container')!.style.cursor = 'cell';
        break;
      case "line":
        this.erase = false;
        document.getElementById('container')!.style.cursor = 'crosshair';
        this.selectedButton['line'] = true;
        break;
      default:
        document.getElementById('container')!.style.cursor = 'default';
        break;
    }
  }

  addLineListeners() {
    const component = this;
    let lastLine: any;
    let isPaint: boolean = false;
    this.stage.on('mousedown touchstart', function (e) {
      e.evt.preventDefault();
      if (!component.selectedButton['line'] && !component.erase) {
        return;
      }
      isPaint = true;
      let pos = component.stage.getPointerPosition();
      lastLine = component.erase ? component.shapeService.erase(pos, 15) : component.shapeService.line(pos, 2);
      component.shapes.push(lastLine);
      component.layer.add(lastLine);
    });
    this.stage.on('mouseup touchend', function (e) {
      e.evt.preventDefault();
      isPaint = false;
    });
    // and core function - drawing
    this.stage.on('mousemove touchmove', function (e) {
      e.evt.preventDefault();
      if (!isPaint) {
        return;
      }
      const position: any = component.stage.getPointerPosition();
      var newPoints = lastLine.points().concat([position.x, position.y]);
      lastLine.points(newPoints);
      component.layer.batchDraw();
    });
  }

  undo() {
    this.clearSelection();
    const removedShape = this.shapes.pop();
    this.transformers.forEach(t => {
      t.detach();
    });
    if (removedShape) {
      removedShape.remove();
    }
    this.layer.draw();
  }

  clearBoard() {
    this.clearSelection();
    this.layer.destroyChildren();
    this.layer.draw();
  }
}
