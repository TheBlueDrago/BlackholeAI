import React, { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";

// A native <select> replacement: bottom-sheet on mobile, popover on desktop.
export default function SheetSelect({ value, onChange, options, className = "", placeholder = "Select" }) {
  const isMobile = useIsMobile();
  const [openDesk, setOpenDesk] = useState(false);
  const [openMob, setOpenMob] = useState(false);
  const current = options.find((o) => o.value === value);
  const label = current?.label ?? placeholder;

  const handleSelect = (v) => {
    onChange(v);
    setOpenDesk(false);
    setOpenMob(false);
  };

  const trigger = (
    <button
      type="button"
      className={`flex items-center gap-2 w-full min-w-0 ${className}`}
    >
      <span className="flex-1 text-left truncate font-mono">{label}</span>
      <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
    </button>
  );

  const list = (onPick) =>
    options.map((o) => (
      <button
        key={o.value}
        type="button"
        onClick={() => onPick(o.value)}
        className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm transition-colors ${
          o.value === value ? "bg-indigo-500/20 text-indigo-300" : "text-slate-200 hover:bg-slate-800"
        }`}
      >
        <span className="font-mono truncate">{o.label}</span>
        {o.value === value && <Check className="w-4 h-4 shrink-0" />}
      </button>
    ));

  if (isMobile) {
    return (
      <Drawer open={openMob} onOpenChange={setOpenMob}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent className="bg-slate-900 border-slate-700">
          <div className="p-3 space-y-1 max-h-[60vh] overflow-y-auto">{list(handleSelect)}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={openDesk} onOpenChange={setOpenDesk}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-64 bg-slate-900 border-slate-700 p-1">
        <div className="max-h-72 overflow-y-auto">{list(handleSelect)}</div>
      </PopoverContent>
    </Popover>
  );
}