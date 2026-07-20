"use client";

import { useCallback, useRef, useState, type RefObject } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

interface Flight {
  id: number;
  image: string;
  start: DOMRect;
  end: DOMRect;
}

export function useFlyAnimation(iconRef: RefObject<HTMLButtonElement | null>) {
  const flightId = useRef(0);
  const [flights, setFlights] = useState<Flight[]>([]);

  const fly = useCallback(
    (originEl: HTMLElement | null, image: string, onComplete?: () => void) => {
      if (!originEl || !iconRef.current) return;
      const start = originEl.getBoundingClientRect();
      const end = iconRef.current.getBoundingClientRect();
      const id = ++flightId.current;
      setFlights((f) => [...f, { id, image, start, end }]);
      window.setTimeout(() => {
        setFlights((f) => f.filter((item) => item.id !== id));
        onComplete?.();
      }, 750);
    },
    [iconRef]
  );

  const FlightLayer = useCallback(
    () => (
      <AnimatePresence>
        {flights.map((flight) => (
          <motion.div
            key={flight.id}
            initial={{
              left: flight.start.left,
              top: flight.start.top,
              width: flight.start.width,
              height: flight.start.height,
              opacity: 1,
              borderRadius: 20,
            }}
            animate={{
              left: flight.end.left + flight.end.width / 2 - 13,
              top: flight.end.top + flight.end.height / 2 - 13,
              width: 26,
              height: 26,
              opacity: [1, 1, 0],
              borderRadius: 999,
            }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            style={{ position: "fixed", zIndex: 200, overflow: "hidden", pointerEvents: "none" }}
          >
            <Image src={flight.image} alt="" fill sizes="26px" className="object-cover" />
          </motion.div>
        ))}
      </AnimatePresence>
    ),
    [flights]
  );

  return { fly, FlightLayer };
}
