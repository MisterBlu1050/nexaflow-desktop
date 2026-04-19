import { useEffect } from "react";
import { useDesktop } from "@/desktop/store";
import DesktopIcons from "@/desktop/DesktopIcons";
import Taskbar from "@/desktop/Taskbar";
import StartMenu from "@/desktop/StartMenu";
import NotificationCenter from "@/desktop/NotificationCenter";

import GmailWindow from "@/desktop/apps/GmailWindow";
import NexaAIWindow from "@/desktop/apps/NexaAIWindow";
import SirhWindow from "@/desktop/apps/SirhWindow";
import WorkableWindow from "@/desktop/apps/WorkableWindow";
import TeamsWindow from "@/desktop/apps/TeamsWindow";
import CalendarWindow from "@/desktop/apps/CalendarWindow";
import SecurexWindow from "@/desktop/apps/SecurexWindow";
import FoldersWindow from "@/desktop/apps/FoldersWindow";
import { DocBibleWindow, DocCas008Window } from "@/desktop/apps/DocWindows";

const Index = () => {
  const openWindow = useDesktop((s) => s.openWindow);
  const minimizeWindow = useDesktop((s) => s.minimizeWindow);
  const setActiveConv = useDesktop((s) => s.setNexaActiveConv);
  const setSelectedDesktopIcon = useDesktop((s) => s.setSelectedDesktopIcon);

  // Boot: 3 windows already open (Gmail foreground, NexaAI behind, SIRH minimized)
  useEffect(() => {
    setActiveConv("cas-008");
    openWindow("nexaai");
    openWindow("sirh");
    minimizeWindow("sirh");
    openWindow("gmail"); // last opened → foreground
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main
      className="fixed inset-0 wallpaper overflow-hidden"
      onMouseDown={(e) => { if (e.target === e.currentTarget) setSelectedDesktopIcon(null); }}
    >
      <title>NexaFlow — Windows 11 Desktop Demo</title>
      <meta name="description" content="Windows 11 desktop emulation demo: Gmail, NexaAI, SIRH, ATS, Collaboration, Payroll UI." />

      <DesktopIcons />

      {/* Open windows (rendered together; z-index controls stacking) */}
      <GmailWindow />
      <NexaAIWindow />
      <SirhWindow />
      <WorkableWindow />
      <TeamsWindow />
      <CalendarWindow />
      <SecurexWindow />
      <FoldersWindow />
      <DocBibleWindow />
      <DocCas008Window />

      <NotificationCenter />
      <StartMenu />
      <Taskbar />
    </main>
  );
};

export default Index;
