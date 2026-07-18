import { FaFacebookF, FaInstagram } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";
import { Link2 } from "lucide-react";
import type { ChannelPlatform } from "@/lib/channel-attribution";

const CONFIG: Record<ChannelPlatform, { className: string; icon: React.ReactNode }> = {
  facebook: {
    className: "bg-gradient-to-br from-[#3d8bff] to-[#0a5cd1]",
    icon: <FaFacebookF className="h-[48%] w-[48%] text-white" />,
  },
  instagram: {
    className: "bg-gradient-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]",
    icon: <FaInstagram className="h-[56%] w-[56%] text-white" />,
  },
  google: {
    className: "bg-gradient-to-b from-white to-[#f1f1f1]",
    icon: <FcGoogle className="h-[58%] w-[58%]" />,
  },
  direct: {
    className: "bg-gradient-to-br from-white/[0.14] to-white/[0.03]",
    icon: <Link2 className="h-[46%] w-[46%] text-white/55" />,
  },
  other: {
    className: "bg-gradient-to-br from-white/[0.14] to-white/[0.03]",
    icon: <Link2 className="h-[46%] w-[46%] text-white/55" />,
  },
};

export function ChannelIcon({ platform, size = 30 }: { platform: ChannelPlatform; size?: number }) {
  const cfg = CONFIG[platform];
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-[9px] shadow-[0_2px_8px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.3)] ${cfg.className}`}
      style={{ width: size, height: size }}
    >
      {cfg.icon}
    </div>
  );
}
