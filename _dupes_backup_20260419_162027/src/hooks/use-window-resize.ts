import { useEffect } from 'react';

// Hook léger pour gérer le redimensionnement des fenêtres via pointer events.
// Usage: attacher des poignées qui ont l'attribut data-resize="right"|"bottom"|"corner" etc.
export default function useWindowResize(ref: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let isResizing = false;
    let startX = 0;
    let startY = 0;
    let startWidth = 0;
    let startHeight = 0;
    let currentHandle: HTMLElement | null = null;

    function onPointerDown(e: PointerEvent) {
      const target = e.target as HTMLElement;
      const handle = target.closest('[data-resize]') as HTMLElement | null;
      if (!handle) return;
      currentHandle = handle;
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      startWidth = el.offsetWidth;
      startHeight = el.offsetHeight;
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      e.preventDefault();
    }

    function onPointerMove(e: PointerEvent) {
      if (!isResizing || !currentHandle) return;
      const dir = currentHandle.dataset.resize || 'right';
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      let newW = startWidth;
      let newH = startHeight;
      if (dir.includes('right')) newW = Math.max(200, startWidth + dx);
      if (dir.includes('left')) newW = Math.max(200, startWidth - dx);
      if (dir.includes('bottom')) newH = Math.max(100, startHeight + dy);
      if (dir.includes('top')) newH = Math.max(100, startHeight - dy);

      el.style.width = `${newW}px`;
      el.style.height = `${newH}px`;
    }

    function onPointerUp(e: PointerEvent) {
      isResizing = false;
      currentHandle = null;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    }

    el.addEventListener('pointerdown', onPointerDown as any);
    return () => {
      el.removeEventListener('pointerdown', onPointerDown as any);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [ref]);
}
