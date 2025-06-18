import { AnimatePresence, motion } from "framer-motion";

export function StatTicker({ value }: { value: number }) {
  return (
    <div className="relative overflow-hidden h-[1.25em]">
      <AnimatePresence initial={false}>
        <motion.span
          key={value}                     // ← cause enter/exit on every new number
          className="absolute inset-0 flex items-center justify-center text-4xl font-medium"
          initial={{ y: "100%" }}
          animate={{ y: "0%" }}
          exit={{ y: "-100%" }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}