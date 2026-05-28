"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface CountdownProps {
  dataEvento: string;
}

function getTimeLeft(dataEvento: string) {
  const targetDate = new Date(dataEvento);
  const now = new Date();

  const diff = targetDate.getTime() - now.getTime();

  if (diff <= 0) {
    return {
      dias: 0,
      horas: 0,
      minutos: 0,
      segundos: 0,
    };
  }

  return {
    dias: Math.floor(diff / (1000 * 60 * 60 * 24)),
    horas: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutos: Math.floor((diff / (1000 * 60)) % 60),
    segundos: Math.floor((diff / 1000) % 60),
  };
}

function AnimatedNumber({
  value,
}: {
  value: number;
}) {
  return (
    <div className="relative h-16 overflow-hidden">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={value}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{
            duration: 0.45,
            ease: "easeInOut",
          }}
          className="absolute inset-0 flex items-center justify-center text-5xl font-light"
        >
          {String(value).padStart(2, "0")}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function Countdown({ dataEvento }: CountdownProps) {
  const [time, setTime] = useState<ReturnType<typeof getTimeLeft> | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Inicializar com o valor correto após hidratação
    setTime(getTimeLeft(dataEvento));
    setIsHydrated(true);

    const timer = setInterval(() => {
      setTime(getTimeLeft(dataEvento));
    }, 1000);

    return () => clearInterval(timer);
  }, [dataEvento]);

  if (!isHydrated || !time) {
    return (
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-3xl border border-white bg-white/70 p-8 shadow-sm backdrop-blur"
          >
            <div className="relative h-16 overflow-hidden flex items-center justify-center text-5xl font-light">
              00
            </div>
            <p className="mt-3 text-sm uppercase tracking-widest text-zinc-500 text-center">
              &nbsp;
            </p>
          </div>
        ))}
      </div>
    );
  }

  const items = [
    ["Dias", time.dias],
    ["Horas", time.horas],
    ["Min", time.minutos],
    ["Seg", time.segundos],
  ];

  return (
    <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
      {items.map(([label, value]) => (
        <div
          key={label}
          className="rounded-3xl border border-white bg-white/70 p-8 shadow-sm backdrop-blur"
        >
          <AnimatedNumber value={value as number} />

          <p className="mt-3 text-sm uppercase tracking-widest text-zinc-500 text-center">
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}   