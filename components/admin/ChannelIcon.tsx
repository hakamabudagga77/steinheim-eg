import { FaFacebook, FaInstagram } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";
import { Link2 } from "lucide-react";
import type { ChannelPlatform } from "@/lib/channel-attribution";

// No background chip by design — these render as free-floating brand marks
// with just a soft drop-shadow for depth, not a colored box behind them.
const CONFIG: Record<ChannelPlatform, React.ReactNode> = {
  facebook: <FaFacebook className="h-full w-full text-[#1877F2] drop-shadow-[0_3px_6px_rgba(24,119,242,0.4)]" />,
  instagram: <FaInstagram className="h-full w-full text-[#E1306C] drop-shadow-[0_3px_6px_rgba(225,48,108,0.4)]" />,
  google: <FcGoogle className="h-full w-full drop-shadow-[0_3px_6px_rgba(0,0,0,0.3)]" />,
  direct: <Link2 className="h-[82%] w-[82%] text-white/45" />,
  other: <Link2 className="h-[82%] w-[82%] text-white/45" />,
};

export function ChannelIcon({ platform, size = 30 }: { platform: ChannelPlatform; size?: number }) {
  return (
    <div className="flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      {CONFIG[platform]}
    </div>
  );
}
