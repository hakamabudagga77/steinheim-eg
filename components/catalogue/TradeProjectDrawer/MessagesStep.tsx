"use client";

import { motion } from "framer-motion";
import TradeMessagesPanel from "@/components/trade/TradeMessagesPanel";

export default function MessagesStep({ leadId }: { leadId: string }) {
  return (
    <motion.div
      key="messages"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="flex h-full flex-col"
    >
      <TradeMessagesPanel leadId={leadId} />
    </motion.div>
  );
}
