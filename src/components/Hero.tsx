import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import heroImage from "@/assets/hero-shepherd.jpg";
import QuestionnaireModal from "./QuestionnaireModal";
import PrayerModal from "./PrayerModal";
import BibleVerseModal from "./BibleVerseModal";
import { BookOpen, Heart, Dices } from "lucide-react";

interface HeroProps {
  showJoinButton?: boolean;
}

const Hero = ({ showJoinButton = false }: HeroProps) => {
  const [showQuestionnaireModal, setShowQuestionnaireModal] = useState(false);
  const [showPrayerModal, setShowPrayerModal] = useState(false);
  const [isQuestionnaireButtonExpanded, setIsQuestionnaireButtonExpanded] = useState(false);
  const [isPrayerButtonExpanded, setIsPrayerButtonExpanded] = useState(false);
  const [showBibleModal, setShowBibleModal] = useState(false);
  const [isBibleButtonExpanded, setIsBibleButtonExpanded] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("prayer") === "1") {
      setShowPrayerModal(true);
    }
  }, []);

  return <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Banderole Buttons - Top Right */}
      {/* Glaubensprüfung Button */}
      <motion.button
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        onClick={() => {
          if (!isQuestionnaireButtonExpanded) {
            setIsQuestionnaireButtonExpanded(true);
          } else {
            setIsQuestionnaireButtonExpanded(false);
            setShowQuestionnaireModal(true);
          }
        }}
        className="absolute top-5 -right-2 z-20 bg-gradient-warm text-white px-4 py-2 pr-6 rounded-l-full shadow-elegant hover:shadow-hover transition-shadow duration-300 flex items-center gap-2 text-sm font-semibold overflow-hidden"
      >
        <BookOpen className="w-4 h-4 flex-shrink-0" />
        <motion.span
          initial={{ opacity: 0, width: 0 }}
          animate={{
            opacity: isQuestionnaireButtonExpanded ? 1 : 0,
            width: isQuestionnaireButtonExpanded ? 'auto' : 0
          }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="whitespace-nowrap"
        >
          Glaubensprüfung
        </motion.span>
      </motion.button>

      {/* Gebetsfluss Button */}
      <motion.button
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 1.7, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        onClick={() => {
          if (!isPrayerButtonExpanded) {
            setIsPrayerButtonExpanded(true);
          } else {
            setIsPrayerButtonExpanded(false);
            setShowPrayerModal(true);
          }
        }}
        className="absolute top-16 -right-2 z-20 bg-gradient-warm text-white px-4 py-2 pr-6 rounded-l-full shadow-elegant hover:shadow-hover transition-shadow duration-300 flex items-center gap-2 text-sm font-semibold overflow-hidden"
      >
        <Heart className="w-4 h-4 flex-shrink-0" />
        <motion.span
          initial={{ opacity: 0, width: 0 }}
          animate={{
            opacity: isPrayerButtonExpanded ? 1 : 0,
            width: isPrayerButtonExpanded ? 'auto' : 0
          }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="whitespace-nowrap"
        >
          Gebetsfluss
        </motion.span>
      </motion.button>

      <QuestionnaireModal 
        open={showQuestionnaireModal} 
        onOpenChange={setShowQuestionnaireModal} 
      />

      <PrayerModal
        open={showPrayerModal}
        onOpenChange={setShowPrayerModal}
      />

      {/* Bibelverse Picker Button */}
      <motion.button
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 1.9, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        onClick={() => {
          if (!isBibleButtonExpanded) {
            setIsBibleButtonExpanded(true);
          } else {
            setIsBibleButtonExpanded(false);
            setShowBibleModal(true);
          }
        }}
        className="absolute top-[108px] -right-2 z-20 bg-gradient-warm text-white px-4 py-2 pr-6 rounded-l-full shadow-elegant hover:shadow-hover transition-shadow duration-300 flex items-center gap-2 text-sm font-semibold overflow-hidden"
      >
        <Dices className="w-4 h-4 flex-shrink-0" />
        <motion.span
          initial={{ opacity: 0, width: 0 }}
          animate={{
            opacity: isBibleButtonExpanded ? 1 : 0,
            width: isBibleButtonExpanded ? 'auto' : 0
          }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="whitespace-nowrap"
        >
          Bibelverse Picker
        </motion.span>
      </motion.button>

      <BibleVerseModal
        open={showBibleModal}
        onOpenChange={setShowBibleModal}
      />

      {/* Decorative Background Elements */}
      <div className="absolute inset-0 z-0">
        <img src={heroImage} alt="Spirituelle Landschaft" className="w-full h-full object-cover scale-110" />
        <div className="absolute bottom-0 left-0 right-0 h-[60vh] bg-gradient-to-t from-background via-background/70 to-transparent" />
      </div>

      {/* Floating Orbs */}
      <motion.div animate={{
      y: [0, -30, 0],
      opacity: [0.3, 0.6, 0.3]
    }} transition={{
      duration: 8,
      repeat: Infinity,
      ease: "easeInOut"
    }} className="absolute top-20 right-[10%] w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
      <motion.div animate={{
      y: [0, 40, 0],
      opacity: [0.2, 0.5, 0.2]
    }} transition={{
      duration: 10,
      repeat: Infinity,
      ease: "easeInOut",
      delay: 1
    }} className="absolute bottom-20 left-[15%] w-80 h-80 bg-accent/20 rounded-full blur-3xl" />

      {/* Content */}
      <div className="container relative z-10 px-6 md:px-12 py-20">
        <motion.div initial={{
        opacity: 0,
        y: 40
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 1,
        ease: [0.22, 1, 0.36, 1]
      }} className="max-w-5xl mx-auto text-center">
          <motion.div initial={{
          opacity: 0,
          scale: 0.9
        }} animate={{
          opacity: 1,
          scale: 1
        }} transition={{
          duration: 1.2,
          delay: 0.3,
          ease: [0.22, 1, 0.36, 1]
        }} className="mb-12">
            <motion.div initial={{
            width: 0
          }} animate={{
            width: "100px"
          }} transition={{
            duration: 0.8,
            delay: 0.5
          }} className="h-1 bg-gradient-warm mx-auto mb-8 rounded-full" style={{
            filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.8))'
          }} />
            
            <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-[1.1] text-white tracking-tight lg:text-6xl" style={{
            filter: 'drop-shadow(0 2px 20px rgba(0, 0, 0, 0.9)) drop-shadow(0 0 40px rgba(0, 0, 0, 0.5))'
          }}>
              „Ich habe dich bei deinem <span className="text-transparent bg-clip-text bg-gradient-warm">Namen gerufen</span>, du bist mein."
            </h1>
            
            <p className="text-xl md:text-2xl text-white font-light tracking-wide" style={{
            filter: 'drop-shadow(0 2px 15px rgba(0, 0, 0, 0.8)) drop-shadow(0 0 30px rgba(0, 0, 0, 0.5))'
          }}>– Jesaja 43,1</p>
          </motion.div>

          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.8,
          delay: 0.7
        }} className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-warm opacity-5 blur-2xl rounded-3xl" />
            <p className="text-lg md:text-2xl text-white max-w-3xl mx-auto leading-relaxed font-light relative  backdrop-blur-none px-6 py-4 rounded-xl" style={{
            textShadow: '0 2px 16px rgba(0, 0, 0, 0.9), 0 0 20px rgba(0, 0, 0, 0.3)'
          }}>
              Wir sind eine Gemeinschaft von Jüngern, die dem Herrn Jesus nachfolgen möchten – im Geiste, mit all unserer Kraft und von ganzem Herzen.
            </p>
          </motion.div>

          <motion.div initial={{
          opacity: 0,
          scale: 0.8
        }} animate={{
          opacity: 1,
          scale: 1
        }} transition={{
          duration: 0.6,
          delay: 1
        }} className="mt-16 flex flex-wrap gap-4 justify-center items-center">
            <motion.div whileHover={{
            scale: 1.05
          }} whileTap={{
            scale: 0.95
          }}>
              <a href="#community" className="group relative inline-flex items-center gap-3 bg-background/80 backdrop-blur-sm text-foreground px-8 py-4 rounded-full text-lg font-semibold shadow-elegant hover:shadow-hover transition-all duration-300 border border-border/30 hover:border-primary/30">
                <span className="relative z-10">Mehr Information</span>
                <span className="relative z-10 flex items-center">
                  {/* Down Arrow Icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" className="ml-2 group-hover:translate-y-1 transition-transform duration-300">
                    <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 10l6 6 6-6" />
                  </svg>
                </span>
              </a>
            </motion.div>
            
            {showJoinButton && (
              <motion.div whileHover={{
                scale: 1.05
              }} whileTap={{
                scale: 0.95
              }}>
                <a href="#signup" className="group relative inline-flex items-center gap-3 bg-gradient-warm text-white px-10 py-5 rounded-full text-lg font-semibold shadow-elegant hover:shadow-hover transition-all duration-300 overflow-hidden">
                  <span className="relative z-10">Jetzt Nachfolgen</span>
                  <motion.span animate={{
                  x: [0, 5, 0]
                }} transition={{
                  duration: 1.5,
                  repeat: Infinity
                }} className="relative z-10">
                    →
                  </motion.span>
                  <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </a>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>;
};
export default Hero;