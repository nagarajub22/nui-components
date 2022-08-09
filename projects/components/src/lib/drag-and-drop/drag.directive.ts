import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, EventEmitter, Inject, NgZone, OnDestroy, OnInit, Output } from '@angular/core';
import { Subject, takeUntil, tap } from 'rxjs';
import { fromEvent } from 'rxjs';

export interface IDOMRect {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface IPageCoord {
  x: number;
  y: number;
}

@Directive({
  selector: '[nuiDrag]'
})
export class DragDirective implements OnInit, OnDestroy {

  @Output() dragEnd: EventEmitter<MouseEvent> = new EventEmitter();

  private dragElLastPosition!: IDOMRect;

  private get dragEl(): HTMLElement {
    return this.el.nativeElement;
  }

  private isDragInitiated = false;
  private destroy$ = new Subject();
  private document: Document;

  constructor(
    private el: ElementRef,
    private ngZone: NgZone,
    @Inject(DOCUMENT) document: Document
  ) {
    this.document = document;
  }

  ngOnInit(): void {
    this.init();
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }


  // private methods

  private init() {
    this.ngZone.runOutsideAngular(() => {
      this.attachListeners();
    });
  }

  private attachListeners() {
    fromEvent<MouseEvent>(this.el.nativeElement, 'mousedown')
      .pipe(takeUntil(this.destroy$))
      .subscribe(evt => {
        this.onPointerDown(evt);
        this.initializeDragging();
      });
  }

  private initializeDragging() {
    const upEvent = fromEvent<MouseEvent>(this.document, 'mouseup')
      .pipe(
        takeUntil(this.destroy$),
        tap(evt => {
          this.onPointerUp(evt);
        })
      );

    fromEvent<MouseEvent>(this.document, 'mousemove')
      .pipe(takeUntil(upEvent))
      .subscribe(evt => {
        this.onPointerMove(evt);
      });

  }

  private onPointerDown(evt: MouseEvent) {
    this.isDragInitiated = true;
    this.dragElLastPosition = { x: evt.pageX, y: evt.pageY };
  }

  private onPointerMove(evt: MouseEvent) {
    if (this.isDragInitiated) {
      this.moveElement(evt);
    }
  }

  private onPointerUp(evt: MouseEvent) {
    this.ngZone.run(() => {
      this.isDragInitiated = false;
      this.removeMoveStyle();
      this.dragEnd.emit(evt);
    });
  }

  private moveElement(evt: MouseEvent) {
    if (this.isDragInitiated) {

      const lastKnownDistance = this.getAttributeXY(this.el.nativeElement);
      const newDistance = {
        x: lastKnownDistance.x + (evt.pageX - this.dragElLastPosition.x), 
        y: lastKnownDistance.y + (evt.pageY - this.dragElLastPosition.y) 
      };

      this.dragElLastPosition = { x: evt.pageX, y: evt.pageY };
      this.setAttributeXY(this.el.nativeElement, newDistance);

      this.dragEl.style.transform = `translate3d(${newDistance.x}px, ${newDistance.y}px, 0px)`;
      this.setStyleOnMove();
    }
  }

  private setStyleOnMove() {
    this.dragEl.style.setProperty('user-select', 'none');
  }

  private removeMoveStyle() {
    this.dragEl.style.removeProperty('user-select');
  }

  private setAttributeXY(element: HTMLElement, position: IDOMRect) {
    if(element) {
      element.setAttribute('x', position.x.toString());
      element.setAttribute('y', position.y.toString());
    }
  }

  private getAttributeXY(element: HTMLElement): IDOMRect {
    return {
      x: parseInt(element.getAttribute('x') || '0', 10),
      y: parseInt(element.getAttribute('y') || '0', 10)
    }
  }

}
