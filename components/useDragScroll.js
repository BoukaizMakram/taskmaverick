'use client';

import { useRef } from 'react';

export default function useDragScroll() {
  const gesture = useRef(null);
  const suppressClick = useRef(false);
  const finish = event => {
    if (gesture.current?.pointerId !== event.pointerId) return;
    gesture.current = null;
    delete event.currentTarget.dataset.dragScrolling;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  return {
    onPointerDownCapture(event) {
      suppressClick.current = false;
      if (event.pointerType !== 'mouse' || event.button !== 0 || event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
      let scroller = event.target;
      while (scroller && event.currentTarget.contains(scroller)) {
        if (scroller.scrollHeight > scroller.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(scroller).overflowY)) break;
        scroller = scroller.parentElement;
      }
      if (!scroller || !event.currentTarget.contains(scroller)) return;
      gesture.current = { scroller, pointerId: event.pointerId, y: event.clientY, scrollTop: scroller.scrollTop, dragging: false };
    },
    onPointerMoveCapture(event) {
      const active = gesture.current;
      if (!active || active.pointerId !== event.pointerId) return;
      const distance = event.clientY - active.y;
      if (!active.dragging && Math.abs(distance) < 5) return;
      if (!active.dragging) {
        active.dragging = true;
        suppressClick.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        event.currentTarget.dataset.dragScrolling = 'true';
      }
      event.preventDefault();
      // Account for the device's container-query scale.
      const scale = active.scroller.getBoundingClientRect().height / active.scroller.offsetHeight || 1;
      active.scroller.scrollTop = active.scrollTop - distance / scale;
    },
    onPointerUpCapture: finish,
    onPointerCancelCapture: finish,
    onLostPointerCapture: finish,
    onPointerLeave() { if (!gesture.current?.dragging) gesture.current = null; },
    onClickCapture(event) {
      if (!suppressClick.current) return;
      suppressClick.current = false;
      event.preventDefault();
      event.stopPropagation();
    },
    onDragStart(event) { event.preventDefault(); },
  };
}
