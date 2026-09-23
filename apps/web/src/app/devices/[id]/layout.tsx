"use client";

import { DeviceChrome, DeviceProvider } from "@/hooks/useDevice";

export default function DeviceLayout({ children }: { children: React.ReactNode }) {
  return (
    <DeviceProvider>
      <DeviceChrome>{children}</DeviceChrome>
    </DeviceProvider>
  );
}
