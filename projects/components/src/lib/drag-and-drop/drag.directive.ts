import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, EventEmitter, Inject, Input, NgZone, OnDestroy, OnInit, Output } from '@angular/core';
import { fromEvent, Subject, takeUntil, tap } from 'rxjs';
import { clamp } from '../utils/math.util';

export const NUI_DRAG_ELEMENT_ACTIVE = 'nui-drag-active';

export interface DOMPosition {
  x: number;
  y: number;
}

@Directive({
  selector: '[nuiDrag]'
})
export class NUIDragDirective implements OnInit, OnDestroy {

  /**
   * Input bindings
   */
  @Input('nuiDragBoundary') boundaryEl: HTMLElement;


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

  private boundaryRect: DOMRect;
  private pickupPoint: DOMPosition;
  private offsetPoint: DOMPosition;
  private lastTransform: DOMPosition = {
    x: 0,
    y: 0
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
    this.pickupPoint = {
      x: evt.pageX,
      y: evt.pageY
    };
    this.offsetPoint = {
      x: evt.offsetX,
      y: evt.offsetY
    };
    this.setBoundaryRect();
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

      let x = evt.pageX, y = evt.pageY;

      const dragEl = {
        left: (x - this.offsetPoint.x),
        top: (y - this.offsetPoint.y),
        right: (x - this.offsetPoint.x) + this.dragEl.offsetWidth,
        bottom: (y - this.offsetPoint.y) + this.dragEl.offsetHeight
      };

      if(this.boundaryEl) {
        if (dragEl.left < this.boundaryRect.left) {
          x = this.boundaryRect.left + this.offsetPoint.x;
        } else if (dragEl.right > this.boundaryRect.right) {
          x = this.boundaryRect.right - this.dragEl.offsetWidth + this.offsetPoint.x;
        }
  
        if (dragEl.top < this.boundaryRect.top) {
          y = this.boundaryRect.top + this.offsetPoint.y;
        } else if (dragEl.bottom > this.boundaryRect.bottom) {
          y = this.boundaryRect.bottom - this.dragEl.offsetHeight + this.offsetPoint.y;
        }
      }

      const newX = this.lastTransform.x + (x - this.pickupPoint.x);
      const newY = this.lastTransform.y + (y - this.pickupPoint.y);

      this.pickupPoint = { x: x, y: y };
      this.lastTransform = { x: newX, y: newY };

      this.dragEl.style.transform = `translate3d(
        ${newX}px,
        ${newY}px,
        0
      )`;
    }
  }

  private setBoundaryRect() {
    if (this.boundaryEl) {
      this.boundaryRect = this.boundaryEl.getBoundingClientRect()
    }
  }

  private setDragStyles(): void {
    this.dragEl.classList.add(NUI_DRAG_ELEMENT_ACTIVE);
  }

  private removeDragStyles(): void {
    this.dragEl.classList.remove(NUI_DRAG_ELEMENT_ACTIVE);
  }

}
