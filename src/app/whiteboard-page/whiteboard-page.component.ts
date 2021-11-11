import { Component, OnInit } from '@angular/core';
import { ShapeService } from '../shape.service';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
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
    'erase': false
  }
  erase: boolean = false;
  transformers: Konva.Transformer[] = [];
  brushSize!: number;
  brushOpacity!: number;

  constructor(
    private _bottomSheet: MatBottomSheet,
    private shapeService: ShapeService,
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer
  ) {
    this.matIconRegistry.addSvgIcon(
      "menu",
      this.domSanitizer.bypassSecurityTrustResourceUrl("assets/menu.svg")
    );
    this.matIconRegistry.addSvgIcon(
      "brushSizeAndOpacity",
      this.domSanitizer.bypassSecurityTrustResourceUrl("assets/brushSizeAndOpacity.svg")
    );
    this.matIconRegistry.addSvgIcon(
      "pencil",
      this.domSanitizer.bypassSecurityTrustResourceUrl("assets/pencil.svg")
    );
    this.matIconRegistry.addSvgIcon(
      "eraser",
      this.domSanitizer.bypassSecurityTrustResourceUrl("assets/eraser.svg")
    );
    this.matIconRegistry.addSvgIcon(
      "undo",
      this.domSanitizer.bypassSecurityTrustResourceUrl("assets/undo.svg")
    );
    this.matIconRegistry.addSvgIcon(
      "delete",
      this.domSanitizer.bypassSecurityTrustResourceUrl("assets/delete.svg")
    );
  }

  ngOnInit() {
    // console.clear();
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

  openBottomSheet() {
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
    if (!(type === 'line')) this.selectedButton['line'] = false;
    switch (type) {
      case "erase":
        this.erase = true;
        break;
      case "line":
        this.erase = false;
        this.selectedButton['line'] = true;
        break;
      default:
        this.erase = false;
        break;
    }
  }

  addLineListeners() {
    const component = this;
    let lastLine: any;
    let isPaint: boolean = false;

    this.stage.on('mousedown touchstart', function () {
      if (!component.selectedButton['line'] && !component.erase) {
        return;
      }
      isPaint = true;
      let pos = component.stage.getPointerPosition();
      lastLine = component.erase ? component.shapeService.erase(pos, 30) : component.shapeService.line(pos, component.brushSize, component.inkColor, component.brushOpacity);
      component.shapes.push(lastLine);
      component.layer.add(lastLine);
    });

    this.stage.on('mouseup touchend', function () {
      isPaint = false;
    });

    this.stage.on('mousemove touchmove', function () {
      if (!isPaint) {
        return;
      }
      const position: any = component.stage.getPointerPosition();
      const newPoints = lastLine.points().concat([position.x, position.y]);
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

  saveAsImage() {
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

  reportBug() {
    location.href = "https://github.com/SujalShah3234/White-Board/issues";
  }

  getCursorClass() {
    if (this.selectedButton['line']) {
      return 'line';
    } else if (this.selectedButton['erase']) {
      return 'eraser';
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
  constructor(private bottomSheet: MatBottomSheetRef<BottomSheet>, private shapeService: ShapeService) {
    this.brushSize = this.shapeService.brushSize;
    this.brushOpacity = this.shapeService.brushOpacity;
  }

  ngOnDestroy(): void {
    const data = {
      brushSize: this.brushSize,
      brushOpacity: this.brushOpacity
    }
    this.bottomSheet.dismiss(data);
  }
}
