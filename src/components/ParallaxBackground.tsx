import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const ParallaxBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();

  // Different parallax speeds for depth effect
  const skyY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const cloudsY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const midSkyY = useTransform(scrollYProgress, [0, 1], ["0%", "70%"]);
  const horizonY = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  // Opacity transitions for smooth blending
  const skyOpacity = useTransform(scrollYProgress, [0, 0.3], [0.8, 0.3]);
  const earthOpacity = useTransform(scrollYProgress, [0.4, 0.8], [0, 0.6]);
  const groundOpacity = useTransform(scrollYProgress, [0.6, 1], [0, 0.8]);

  return (
    <div ref={containerRef} className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base gradient - Heaven to Earth transition */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-200 via-amber-100/50 to-amber-800/30" />
      
      {/* Upper sky layer - Light ethereal */}
      <motion.div
        style={{ y: skyY, opacity: skyOpacity }}
        className="absolute inset-0 bg-gradient-to-b from-blue-100/40 via-transparent to-transparent"
      />

      {/* Floating clouds layer */}
      <motion.div
        style={{ y: cloudsY }}
        className="absolute inset-x-0 top-[10%] h-[40%]"
      >
        <div className="absolute top-[10%] left-[5%] w-64 h-32 bg-white/20 rounded-full blur-3xl" />
        <div className="absolute top-[20%] right-[10%] w-80 h-40 bg-white/15 rounded-full blur-3xl" />
        <div className="absolute top-[35%] left-[30%] w-96 h-48 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute top-[15%] right-[35%] w-48 h-24 bg-white/25 rounded-full blur-2xl" />
      </motion.div>

      {/* Mid atmosphere - warm transition */}
      <motion.div
        style={{ y: midSkyY }}
        className="absolute inset-x-0 top-[40%] h-[40%] bg-gradient-to-b from-transparent via-amber-200/20 to-amber-400/30"
      />

      {/* Sun rays effect */}
      <motion.div
        style={{ y: horizonY, opacity: earthOpacity }}
        className="absolute inset-x-0 top-[30%] h-[50%]"
      >
        <div className="absolute inset-0 bg-gradient-radial from-amber-300/20 via-transparent to-transparent" 
             style={{ background: 'radial-gradient(ellipse at 50% 0%, hsl(var(--primary) / 0.15) 0%, transparent 70%)' }} />
      </motion.div>

      {/* Earth/Ground layer */}
      <motion.div
        style={{ opacity: groundOpacity }}
        className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-amber-900/40 via-amber-700/20 to-transparent"
      />

      {/* Subtle texture overlay */}
      <div className="absolute inset-0 opacity-[0.02] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjZmZmIj48L3JlY3Q+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMwMDAiPjwvcmVjdD4KPC9zdmc+')]" />
      
      {/* Bottom earth gradient */}
      <motion.div
        style={{ opacity: groundOpacity }}
        className="absolute inset-x-0 bottom-0 h-[30%]"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-stone-800/50 via-amber-800/30 to-transparent" />
        {/* Grass/field hint */}
        <div className="absolute bottom-0 inset-x-0 h-[40%] bg-gradient-to-t from-green-900/20 to-transparent" />
      </motion.div>
    </div>
  );
};

export default ParallaxBackground;
