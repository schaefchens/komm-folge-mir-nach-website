import { motion } from "framer-motion";
import communityDiverse from "@/assets/community-diverse.jpg";
import communityPath from "@/assets/community-path.jpg";
import communityUnity from "@/assets/community-unity.jpg";
import communityEncourage from "@/assets/community-encourage.jpg";
import communityPaths from "@/assets/community-paths.jpg";
import communityPrayer from "@/assets/community-prayer.jpg";
import communitySpirit from "@/assets/community-spirit.jpg";
const CommunityInfo = () => {
  const paragraphs = [{
    highlight: "Wir kommen aus verschiedenen",
    text: "Konfessionen und Gruppen zusammen um im Herrn",
    highlight2: "gemeinsam Nachfolge zu leben",
    text2: ". Ob Protestant, Katholik, Baptist, Charismatiker, alles dazwischen oder auch ganz ohne Kirchenzugehörigkeit ist nicht wichtig, solange dem Herrn wie Er in der Heiligen Schrift verkündet wird nachgefolgt und alles",
    highlight3: "Ihm",
    text3: "unter geordnet wird.",
    image: communityDiverse
  }, {
    highlight: "Das Ziel",
    text: "ist nicht gemeinsame Theologie und Schriftverständnis, sondern",
    highlight2: "Nachfolge in Tat und Wahrheit und im Wort ganz im Geiste des Herrn so wie Er in der Heiligen Schrift verkündet wird.",
    image: communityPath
  }, {
    highlight: "Und auch",
    text: "wenn es theologische Differenzen geben mag,",
    highlight2: "so sind wir doch alle Glieder eines Leibes nämlich unseres Herrn Jesus Christus",
    text2: ". Statt Diskussion über Schriftauslegungen und Tradition und Kirchengeschichte widmen wir uns in Liebe",
    highlight3: "gemeinsamen Gebet, Gesang, Abendmahl, Studium und lebendiger Gemeinschaft.",
    image: communityUnity
  }, {
    highlight: "Wir ermutigen uns",
    text: "in der Nachfolge, fangen uns auf wenn wir angefochten werden und bekräftigen uns mit Erbauung und Segen.",
    image: communityEncourage
  }, {
    highlight: "Jeder von uns",
    text: "hat seinen eigenen Weg zum Herrn und seine eigenen Glaubenssätze und Theologien, doch es ist wichtig das wir unseren Willen nicht zum Willen der anderen machen.",
    image: communityPaths
  }, {
    text: "Statt Belehrungen setzen wir auf Gebet und bitten unseren Vater uns auf den richtigen Weg zu bringen.",
    image: communityPrayer
  }, {
    text: "Statt persönlichem Eifer vertrauen wir in Gebet darauf das der Heilige Geist des Herrn uns und unsere Brüder auf den richtigen Weg bringen wird.",
    image: communitySpirit
  }];
  return <section id="community" className="py-24 md:py-40 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0" style={{
        backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }} />
      </div>

      <div className="container px-6 md:px-12 relative">
        <motion.div initial={{
        opacity: 0,
        y: 30
      }} whileInView={{
        opacity: 1,
        y: 0
      }} viewport={{
        once: true
      }} transition={{
        duration: 0.8
      }} className="text-center mb-16">
          <motion.div initial={{
          width: 0
        }} whileInView={{
          width: "80px"
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.8,
          delay: 0.2
        }} className="h-1 bg-gradient-warm mx-auto mb-8 rounded-full" />
          
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-foreground tracking-tight">
            Unsere Gemeinschaft
          </h2>
        </motion.div>

        {/* Content Blocks */}
        <div className="max-w-5xl mx-auto space-y-6">
          {paragraphs.map((para, index) => <motion.div key={index} initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.6,
          delay: index * 0.1
        }} className="group relative bg-card rounded-2xl shadow-soft border border-border/50 hover:border-primary/20 hover:shadow-elegant transition-all duration-500 overflow-hidden">
              {/* Gradient Overlay on Hover */}
              <div className="absolute inset-0 bg-gradient-hero opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
              
              {/* Accent Line */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-warm rounded-l-2xl" />
              
              <div className="relative z-10 flex flex-col md:flex-row">
                {/* Image */}
                <div className="md:w-1/3 flex-shrink-0">
                  <img src={para.image} alt="" className="w-full h-48 md:h-full object-cover rounded-t-2xl md:rounded-t-none md:rounded-l-2xl" />
                </div>
                
                {/* Text Content */}
                <div className="flex-1 p-8 md:p-10 flex items-center">
                  <p className="text-lg md:text-xl text-foreground/90 leading-relaxed">
                    {para.highlight && <><strong className="text-foreground">{para.highlight}</strong> </>}{para.text}
                    {para.highlight2 && <> <strong className="text-foreground">{para.highlight2}</strong></>}
                    {para.text2 && <> {para.text2}</>}
                    {para.highlight3 && <> <strong className="text-foreground">{para.highlight3}</strong></>}
                    {para.text3 && <> {para.text3}</>}
                  </p>
                </div>
              </div>

              {/* Decorative Element */}
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-gradient-warm opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity duration-500" />
            </motion.div>)}
        </div>

        {/* Closing Bible Quote */}
        <motion.div initial={{
        opacity: 0,
        y: 30
      }} whileInView={{
        opacity: 1,
        y: 0
      }} viewport={{
        once: true
      }} transition={{
        duration: 0.8,
        delay: 0.4
      }} className="mt-16 max-w-4xl mx-auto">
          <div className="relative group">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-warm opacity-5 blur-3xl rounded-3xl group-hover:opacity-10 transition-opacity duration-500" />
            
            {/* Card */}
            <div className="relative bg-gradient-soft backdrop-blur-sm rounded-3xl p-10 md:p-16 border border-border/50 shadow-soft">
              <div className="absolute top-8 left-8 w-16 h-16 border-l-2 border-t-2 border-primary/30 rounded-tl-2xl" />
              <div className="absolute bottom-8 right-8 w-16 h-16 border-r-2 border-b-2 border-primary/30 rounded-br-2xl" />
              
              <motion.div initial={{
              scale: 0.9,
              opacity: 0
            }} whileInView={{
              scale: 1,
              opacity: 1
            }} viewport={{
              once: true
            }} transition={{
              duration: 0.6,
              delay: 0.5
            }} className="text-center">
                <p className="text-xl md:text-2xl text-foreground/90 italic mb-8 leading-relaxed font-light">
                  „Was siehst du aber den Splitter im Auge deines Bruders, und den Balken in deinem eigenen Auge bemerkst du nicht?"
                </p>
                <p className="text-lg text-muted-foreground font-medium">
                  – Matthäus 7,3–5
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Blessing Statement */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} whileInView={{
        opacity: 1,
        y: 0
      }} viewport={{
        once: true
      }} transition={{
        duration: 0.8,
        delay: 0.6
      }} className="mt-16 text-center">
          <motion.div initial={{
          width: 0
        }} whileInView={{
          width: "60px"
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.6,
          delay: 0.7
        }} className="h-0.5 bg-gradient-warm mx-auto mb-8 rounded-full opacity-60" />
          
          <p className="font-blessing text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-warm leading-relaxed">
            Unser Herr segne euch,
          </p>
          <p className="font-blessing text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-warm leading-relaxed">liebe Brüder und Schwestern
🙏</p>
          
          <motion.div initial={{
          width: 0
        }} whileInView={{
          width: "60px"
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.6,
          delay: 0.8
        }} className="h-0.5 bg-gradient-warm mx-auto mt-8 rounded-full opacity-60" />
        </motion.div>
      </div>
    </section>;
};
export default CommunityInfo;