import { motion, useScroll, useTransform } from "framer-motion";

const ParallaxBackground = () => {
  const { scrollYProgress } = useScroll();

  // Background moves slower than scroll (parallax effect)
  // This creates the illusion of depth - sky to earth journey
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);

  return (
    <motion.div 
      style={{ y: backgroundY }}
      className="fixed inset-0 -z-10 pointer-events-none h-[150vh]"
    >
      {/* Full gradient from sky (top) to earth (bottom) */}
      <div 
        className="absolute inset-0 h-full"
        style={{
          background: `linear-gradient(to bottom,
            hsl(200, 80%, 85%) 0%,
            hsl(200, 70%, 80%) 10%,
            hsl(195, 60%, 75%) 20%,
            hsl(45, 60%, 80%) 35%,
            hsl(40, 50%, 75%) 50%,
            hsl(35, 45%, 65%) 65%,
            hsl(30, 40%, 55%) 80%,
            hsl(25, 35%, 40%) 90%,
            hsl(20, 30%, 30%) 100%
          )`
        }}
      />

      {/* Clouds in the upper portion */}
      <div className="absolute top-[5%] left-[5%] w-64 h-32 bg-white/40 rounded-full blur-3xl" />
      <div className="absolute top-[8%] right-[15%] w-80 h-36 bg-white/35 rounded-full blur-3xl" />
      <div className="absolute top-[15%] left-[25%] w-96 h-40 bg-white/30 rounded-full blur-3xl" />
      <div className="absolute top-[12%] right-[40%] w-48 h-24 bg-white/45 rounded-full blur-2xl" />
      <div className="absolute top-[20%] left-[60%] w-72 h-32 bg-white/25 rounded-full blur-3xl" />
      
      {/* Sun glow */}
      <div 
        className="absolute top-[25%] left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(ellipse, hsl(40, 90%, 70%, 0.3) 0%, transparent 70%)' }}
      />

      {/* Earth/ground texture hints at bottom */}
      <div className="absolute bottom-[10%] inset-x-0 h-[20%] bg-gradient-to-t from-green-900/20 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-[15%] bg-gradient-to-t from-stone-800/30 to-transparent" />
    </motion.div>
  );
};

export default ParallaxBackground;
