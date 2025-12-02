import { motion } from "framer-motion";

const CommunityInfo = () => {
  return (
    <section id="community" className="py-24 md:py-40 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="container px-6 md:px-12 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          {/* Opening Bible Quote */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="relative inline-block">
              <div className="absolute -left-4 -top-2 text-6xl text-primary/20 font-serif">"</div>
              <p className="text-xl md:text-2xl text-foreground/90 italic leading-relaxed font-light px-8">
                „Ich habe dich bei deinem Namen gerufen, du bist mein."
              </p>
              <div className="absolute -right-4 -bottom-4 text-6xl text-primary/20 font-serif">"</div>
            </div>
            <p className="text-lg text-muted-foreground mt-4 font-medium">
              – Jesaja 43,1
            </p>
          </motion.div>

          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: "80px" }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="h-1 bg-gradient-warm mx-auto mb-16 rounded-full"
          />

          {/* Main Content */}
          <div className="space-y-10 text-lg md:text-xl text-foreground/90 leading-relaxed">
            {/* Paragraph 1 */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <strong className="text-foreground">Wir sind eine Gemeinschaft</strong> von Jüngern die dem Herrn Jesus nachfolgen möchten im Geiste mit all unserer Kraft, unserem Geist und von ganzem Herzen.
            </motion.p>

            {/* Paragraph 2 */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <strong className="text-foreground">Wir kommen aus verschiedenen</strong> Konfessionen und Gruppen zusammen um im Herrn <strong className="text-foreground">gemeinsam Nachfolge zu leben</strong>. Ob Protestant, Katholik, Baptist, Charismatiker, alles dazwischen oder auch ganz ohne Kirchenzugehörigkeit ist nicht wichtig, solange dem Herrn wie Er in der Heiligen Schrift verkündet wird nachgefolgt und alles <strong className="text-foreground">Ihm</strong> unter geordnet wird.
            </motion.p>

            {/* Paragraph 3 */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <strong className="text-foreground">Das Ziel</strong> ist nicht gemeinsame Theologie und Schriftverständnis, sondern <strong className="text-foreground">Nachfolge in Tat und Wahrheit und im Wort ganz im Geiste des Herrn so wie Er in der Heiligen Schrift verkündet wird.</strong>
            </motion.p>

            {/* Paragraph 4 */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.25 }}
            >
              <strong className="text-foreground">Und auch</strong> wenn es theologische Differenzen geben mag, <strong className="text-foreground">so sind wir doch alle Glieder eines Leibes nämlich unseres Herrn Jesus Christus</strong>. Statt Diskussion über Schriftauslegungen und Tradition und Kirchengeschichte widmen wir uns in Liebe <strong className="text-foreground">gemeinsamen Gebet, Gesang, Abendmahl, Studium und lebendiger Gemeinschaft.</strong>
            </motion.p>

            {/* Paragraph 5 */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <strong className="text-foreground">Wir ermutigen uns</strong> in der Nachfolge, fangen uns auf wenn wir angefochten werden und bekräftigen uns mit Erbauung und Segen.
            </motion.p>

            {/* Paragraph 6 */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.35 }}
            >
              <strong className="text-foreground">Jeder von uns</strong> hat seinen eigenen Weg zum Herrn und seine eigenen Glaubenssätze und Theologien, doch es ist wichtig das wir unseren Willen nicht zum Willen der anderen machen.
              <br /><br />
              Statt Belehrungen setzen wir auf Gebet und bitten unseren Vater uns auf den richtigen Weg zu bringen.
              <br /><br />
              Statt persönlichem Eifer vertrauen wir in Gebet darauf das der Heilige Geist des Herrn uns und unsere Brüder auf den richtigen Weg bringen wird.
            </motion.p>
          </div>

          {/* Closing Bible Quote */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-20"
          >
            <div className="relative group">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-warm opacity-5 blur-3xl rounded-3xl group-hover:opacity-10 transition-opacity duration-500" />
              
              {/* Card */}
              <div className="relative bg-gradient-soft backdrop-blur-sm rounded-3xl p-10 md:p-16 border border-border/50 shadow-soft">
                <div className="absolute top-8 left-8 w-16 h-16 border-l-2 border-t-2 border-primary/30 rounded-tl-2xl" />
                <div className="absolute bottom-8 right-8 w-16 h-16 border-r-2 border-b-2 border-primary/30 rounded-br-2xl" />
                
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="text-center"
                >
                  <p className="text-xl md:text-2xl text-foreground/90 italic mb-8 leading-relaxed font-light">
                    „Was siehst du aber den Splitter im Auge deines Bruders, und den Balken in deinem eigenen Auge bemerkst du nicht?"
                  </p>
                  <p className="text-lg text-muted-foreground mb-10 font-medium">
                    – Matthäus 7,3–5
                  </p>
                  
                  <div className="h-px w-32 bg-gradient-warm mx-auto mb-10 opacity-50" />
                  
                  <p className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-warm">
                    Unser Herr segne euch, liebe Brüder und Schwestern 🙏
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default CommunityInfo;
