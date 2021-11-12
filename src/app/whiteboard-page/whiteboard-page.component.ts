import { Component, OnInit } from '@angular/core';
import { KonvaService } from '../konva.service';
import { MatBottomSheet, MatBottomSheetRef } from '@angular/material/bottom-sheet';
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
  inkColor: string = '#000000';
  selectedButton: any = {
    'line': false,
    'eraser': false
  }
  eraser: boolean = false;
  transformers: Konva.Transformer[] = [];
  brushSize: number = 3;
  brushOpacity: number = 1.0;

  constructor(
    private _bottomSheet: MatBottomSheet,
    private konvaService: KonvaService
  ) { }

  ngOnInit(): void {
    this.setSelection('brush');
    this.stage = new Konva.Stage({
      container: 'container',
      width: window.innerWidth,
      height: window.innerHeight
    });
    this.layer = new Konva.Layer();
    this.stage.add(this.layer);
    this.addLineListeners();
  }

  clearSelection(): void {
    this.selectedButton = {
      'brush': false,
      'eraser': false
    }
  }

  openBottomSheet(): void {
    const bottomSheetRef = this._bottomSheet.open(BottomSheet);
    bottomSheetRef.afterDismissed().subscribe((result) => {
      if (result) {
        this.brushSize = result.brushSize;
        this.brushOpacity = result.brushOpacity;
      }
    });
  }

  setSelection(type: string) {
    this.clearSelection();
    this.selectedButton[type] = true;
    if (!(type === 'brush')) this.selectedButton['brush'] = false;
    switch (type) {
      case "eraser":
        this.eraser = true;
        break;
      case "brush":
        this.eraser = false;
        this.selectedButton['brush'] = true;
        break;
      default:
        this.eraser = false;
        break;
    }
  }

  addLineListeners(): void {
    const component = this;
    let lastLine: any;
    let isPaint: boolean = false;

    this.stage.on('mousedown touchstart', function () {
      if (!component.selectedButton['brush'] && !component.eraser) {
        return;
      }
      isPaint = true;
      let pos = component.stage.getPointerPosition();
      lastLine = component.eraser ? component.konvaService.erase(pos, 30) : component.konvaService.brush(pos, component.brushSize, component.inkColor, component.brushOpacity);
      component.shapes.push(lastLine);
      component.layer.add(lastLine);
    });

    this.stage.on('mouseup touchend', function () {
      isPaint = false;
    });

    this.stage.on('mousemove touchmove', function (e: any) {
      if (!isPaint) {
        return;
      }
      e.evt.preventDefault();
      const position: any = component.stage.getPointerPosition();
      const newPoints = lastLine.points().concat([position.x, position.y]);
      lastLine.points(newPoints);
      component.layer.batchDraw();
    });
  }

  undo(): void {
    const removedShape = this.shapes.pop();

    this.transformers.forEach(t => {
      t.detach();
    });

    if (removedShape) {
      removedShape.remove();
    }

    this.layer.draw();
  }

  clearBoard(): void {
    this.layer.destroyChildren();
    this.layer.draw();
  }

  saveAsImage(): void {
    const dataUrl: string = this.stage.toDataURL({
      mimeType: 'image/png',
      quality: 1,
      pixelRatio: 1
    });

    const link = document.createElement('a');
    link.download = 'board_image.png';
    link.href = dataUrl;
    link.click();
  }

  getCursorClass(): string {
    if (this.selectedButton['brush'] || this.selectedButton['eraser']) {
      return 'pointer_cursor';
    } else {
      return 'default';
    }
  }
}

@Component({
  selector: 'bottom-sheet',
  templateUrl: 'bottom-sheet.html',
  styleUrls: ['./whiteboard-page.component.scss']
})
export class BottomSheet {
  brushSize!: number;
  brushOpacity!: number;
  constructor(private bottomSheet: MatBottomSheetRef<BottomSheet>, private konvaService: KonvaService) {
    this.brushSize = this.konvaService.brushSize;
    this.brushOpacity = this.konvaService.brushOpacity;
  }

  ngOnDestroy(): void {
    const data = {
      brushSize: this.brushSize,
      brushOpacity: this.brushOpacity
    }
    this.bottomSheet.dismiss(data);
  }
}
