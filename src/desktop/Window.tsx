import { useEffect, useRef, useState, ReactNode } from "react";
import { Minus, Square, X, Copy } from "lucide-react";
import { useDesktop, AppId } from "./store";
import { cn } from "@/lib/utils";

type Props = {
  id: AppId;
  children: ReactNode;
  minWidth?: number;
  minHeight?: number;
  noPadding?: boolean;
  bodyClassName?: string;
  onClose?: () => boolean | void; // return false to cancel
};

export default function Window({ id, children, minWidth = 480, minHeight = 320, noPadding, bodyClassName, onClose }: Props) {
  const win = useDesktop((s) => s.windows[id]);
  const focusWindow = useDesktop((s) => s.focusWindow);
  const moveWindow = useDesktop((s) => s.moveWindow);
  const resizeWindow = useDesktop((s) => s.resizeWindow);
  const minimizeWindow = useDesktop((s) => s.minimizeWindow);
  const toggleMaximize = useDesktop((s) => s.toggleMaximize);
  const closeWindow = useDesktop((s) => s.closeWindow);

  const dragRef = useRef<{ ox: number; oy: number; mx: number; my: number } | null>(null);
  const resizeRef = useRef<{ ow: number; oh: number; mx: number; my: number } | null>(null);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (dragRef.current) {
        const { ox, oy, mx, my } = dragRef.current;
        moveWindow(id, Math.max(0, ox + e.clientX - mx), Math.max(0, oy + e.clientY - my));
      }
      if (resizeRef.current) {
        const { ow, oh, mx, my } = resizeRef.current;
        resizeWindow(id, Math.max(minWidth, ow + e.clientX - mx), Math.max(minHeight, oh + e.clientY - my));
      }
    }
    function onUp() { dragRef.current = null; resizeRef.current = null; document.body.style.userSelect = ""; }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [id, moveWindow, resizeWindow, minWidth, minHeight]);

  if (!win.open || win.minimized) return null;

  const style: React.CSSProperties = win.maximized
    ? { left: 0, top: 0, width: "100vw", height: "calc(100vh - 48px)", zIndex: win.zIndex }
    : { left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.zIndex };

  function startDrag(e: React.MouseEvent) {
    if (win.maximized) return;
    document.body.style.userSelect = "none";
    dragRef.current = { ox: win.x, oy: win.y, mx: e.clientX, my: e.clientY };
    focusWindow(id);
  }
  function startResize(e: React.MouseEvent) {
    if (win.maximized) return;
    e.stopPropagation();
    document.body.style.userSelect = "none";
    resizeRef.current = { ow: win.w, oh: win.h, mx: e.clientX, my: e.clientY };
  }
  function handleClose() {
    if (onClose && onClose() === false) return;
    closeWindow(id);
  }

  return (
    <div
      className="fixed flex flex-col bg-win-window text-foreground rounded-lg overflow-hidden window-shadow animate-window-open border border-white/10"
      style={style}
      onMouseDown={() => focusWindow(id)}
    >
      {/* Title bar */}
      <div
        className="h-8 bg-win-titlebar flex items-stretch select-none flex-shrink-0"
        onMouseDown={startDrag}
        onDoubleClick={() => toggleMaximize(id)}
      >
        <div className="flex items-center gap-2 px-3 text-[12px] text-white/85 flex-1 min-w-0">
          <span className="text-sm">{win.icon}</span>
          <span className="truncate">{win.title}</span>
        </div>
        <button className="w-11 grid place-items-center win-control" onClick={(e) => { e.stopPropagation(); minimizeWindow(id); }}>
          <Minus className="w-3.5 h-3.5 text-white/80" />
        </button>
        <button className="w-11 grid place-items-center win-control" onClick={(e) => { e.stopPropagation(); toggleMaximize(id); }}>
          {win.maximized ? <Copy className="w-3 h-3 text-white/80" /> : <Square className="w-3 h-3 text-white/80" />}
        </button>
        <button className="w-11 grid place-items-center win-control-close" onClick={(e) => { e.stopPropagation(); handleClose(); }}>
          <X className="w-3.5 h-3.5 text-white/80" />
        </button>
      </div>

      {/* Body */}
      <div className={cn("flex-1 min-h-0 bg-win-content overflow-hidden", !noPadding && "p-0", bodyClassName)}>
        {children}
      </div>

      {/* Resize handle */}
      {!win.maximized && (
        <div
          className="absolute right-0 bottom-0 w-4 h-4 cursor-nwse-resize"
          onMouseDown={startResize}
        />
      )}
    </div>
  );
}
