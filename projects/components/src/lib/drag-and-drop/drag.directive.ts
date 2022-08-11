import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, EventEmitter, Inject, Input, NgZone, OnDestroy, OnInit, Output } from '@angular/core';
import { fromEvent, Subject, takeUntil, tap } from 'rxjs';

export interface NUIDOMRect {
  x: number;
  y: number;
  width?: number;
  height?: number;
}
export interface NUIBoundaryRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}


export const NUI_DRAG_ELEMENT_ACTIVE = 'nui-drag-active';

@Directive({
  selector: '[nuiDrag]'
})
export class NUIDragDirective implements OnInit, OnDestroy {

  /**
   * Input bindings
   */
  @Input('nuiDragBoundary') dragBoundary: HTMLElement;


  /**
   * Output Emitters
   */
  @Output() dragEnd: EventEmitter<MouseEvent> = new EventEmitter();

  /** 
   * Private Variables 
  */
  
  private get dragEl(): HTMLElement {
    return this.el.nativeElement;
  }

  private dragLastPickupPoint: NUIDOMRect;
  private dragLastTransform: NUIDOMRect = {
    x: 0,
    y: 0
  };
  private dragBoundaryRect:NUIBoundaryRect = {
    left: -Infinity,
    top: -Infinity,
    right: Infinity,
    bottom: Infinity
  };

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
  private init(): void {
    this.ngZone.runOutsideAngular(() => {
      this.attachListeners();
    });
  }

  private attachListeners(): void {
    fromEvent<MouseEvent>(this.el.nativeElement, 'mousedown')
      .pipe(takeUntil(this.destroy$))
      .subscribe(evt => {
        this.onPointerDown(evt);
        this.initializeDragging();
      });
  }

  private initializeDragging(): void {
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

  private onPointerDown(evt: MouseEvent): void {
    this.isDragInitiated = true;
    this.dragLastPickupPoint = { x: evt.pageX, y: evt.pageY };
    this.setDragBoundary();
    this.setDragStyles();
  }

  private onPointerMove(evt: MouseEvent): void {
    if (this.isDragInitiated) {
      this.moveElement(evt);
    }
  }

  private onPointerUp(evt: MouseEvent): void {
    this.ngZone.run(() => {
      this.isDragInitiated = false;
      this.removeDragStyles();
      this.dragEnd.emit(evt);
    });
  }

  private moveElement(evt: MouseEvent): void {
    if (this.isDragInitiated) {

      const newDistance = {
        x: this.dragLastTransform.x + (evt.pageX - this.dragLastPickupPoint.x), 
        y: this.dragLastTransform.y + (evt.pageY - this.dragLastPickupPoint.y) 
      };

      this.dragLastPickupPoint = { x: evt.pageX, y: evt.pageY };
      this.dragLastTransform = newDistance;

      this.dragEl.style.transform = `translate3d(${newDistance.x}px, ${newDistance.y}px, 0px)`;
    }
  }

  private setDragBoundary(): void {
    if(this.dragBoundary) {
      const boundaryRect = this.dragBoundary.getBoundingClientRect();
      this.dragBoundaryRect = {
        left: boundaryRect.x,
        top: boundaryRect.y,
        right: boundaryRect.x + boundaryRect.width,
        bottom: boundaryRect.y + boundaryRect.height
      };
      console.log(this.dragBoundaryRect);
    }
  }

  private setDragStyles(): void {
    this.dragEl.classList.add(NUI_DRAG_ELEMENT_ACTIVE);
  }

  private removeDragStyles(): void {
    this.dragEl.classList.remove(NUI_DRAG_ELEMENT_ACTIVE);
  }

}
