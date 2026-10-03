"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface CountdownProps {
  dataEvento: string;
}

function parseDateRobust(dateStr: string) {
  if (!dateStr) return new Date();

  // 1. Full ISO Match: YYYY-MM-DDTHH:MM:SS
  const regexIso = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/;
  const matchIso = dateStr.match(regexIso);
  if (matchIso) {
    return new Date(parseInt(matchIso[1], 10), parseInt(matchIso[2], 10) - 1, parseInt(matchIso[3], 10), parseInt(matchIso[4], 10), parseInt(matchIso[5], 10), parseInt(matchIso[6], 10));
  }

  // 2. BR Format Match: DD/MM/YYYY ou DD-MM-YYYY
  const regexBr = /^(\d{2})[\/\-](\d{2})[\/\-](\d{4})/;
  const matchBr = dateStr.match(regexBr);
  if (matchBr) {
    return new Date(parseInt(matchBr[3], 10), parseInt(matchBr[2], 10) - 1, parseInt(matchBr[1], 10), 16, 0, 0);
  }
  
  // 3. YYYY-MM-DD Match (sem horario)
  const regexYmd = /^(\d{4})-(\d{2})-(\d{2})/;
  const matchYmd = dateStr.match(regexYmd);
  if (matchYmd) {
    return new Date(parseInt(matchYmd[1], 10), parseInt(matchYmd[2], 10) - 1, parseInt(matchYmd[3], 10), 16, 0, 0);
  }

  // Fallbacks
  let d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;
  
  let cleanStr = dateStr.split('.')[0].replace(/-/g, '/').replace('T', ' ');
  cleanStr = cleanStr.replace(/\+\d{2}:\d{2}/, '').replace(/-\d{2}:\d{2}/, '');
  return new Date(cleanStr);
}

function getTimeLeft(dataEvento: string) {
  const targetDate = parseDateRobust(dataEvento);
  const now = new Date();

  const diff = targetDate.getTime() - now.getTime();

  if (isNaN(diff) || diff <= 0) {
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
          className="absolute inset-0 flex items-center justify-center text-4xl sm:text-6xl font-light text-[#06264D]"
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
            className="rounded-3xl border border-white bg-white/70 p-4 sm:p-8 shadow-sm backdrop-blur"
          >
            <div className="relative h-16 overflow-hidden flex items-center justify-center text-4xl sm:text-6xl font-light text-[#06264D]">
              00
            </div>
            <p className="mt-3 text-sm uppercase tracking-widest text-[#006A89] font-bold text-center">
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
          className="rounded-3xl border border-white bg-white/70 p-4 sm:p-8 shadow-sm backdrop-blur"
        >
          <AnimatedNumber value={value as number} />

          <p className="mt-3 text-sm uppercase tracking-widest text-[#006A89] font-bold text-center">
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}   