import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const frictionCards = [
  { icon: 'data_object', title: 'No persistent object model', desc: 'Every idea lives inside a paragraph, not as a manipulable thing with identity.' },
  { icon: 'map', title: 'No spatial memory', desc: 'Humans think by arranging things in space; chat has no space, only time.' },
  { icon: 'linear_scale', title: 'Single-threaded exploration', desc: 'Chat holds only one line of reasoning at once.' },
  { icon: 'compress', title: 'Multimodal inputs flattened', desc: 'A PDF, voice memo, and screenshot all compress into the same text box.' },
  { icon: 'visibility_off', title: 'Reasoning is invisible', desc: 'Assumptions and contradictions are buried in prose.' },
  { icon: 'undo', title: 'No reversibility', desc: 'There is no undo for a line of thinking.' },
  { icon: 'lock', title: 'Memory is opaque', desc: 'Users cannot see what the AI learned or control what persists.' },
  { icon: 'psychology', title: 'Explanations are post-hoc', desc: 'AI reasoning is rationalized after the fact.' },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="pt-[120px] pb-[80px] px-6 max-w-[1200px] mx-auto w-full">
        <motion.h1 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-[64px] md:text-[80px] font-medium leading-[1.0] tracking-[-1.6px] text-center mb-6 text-[#292929]"
        >
          Ideas are objects.<br/>Not messages.
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-[20px] md:text-[27px] text-[#6f6f6e] text-center max-w-[720px] mx-auto mb-10 leading-[1.3]"
        >
          A spatial canvas for complex thinking work.<br/>
          Voice-first. AI-transparent. Memory you control.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
          className="flex items-center justify-center gap-4"
        >
          <Link to="/workspace" className="bg-[#141414] text-[#ffffff] px-6 py-3 rounded-full text-[16px] font-medium no-underline hover:bg-[#292929] transition-colors">
            Open Workspace
          </Link>
          <Link to="/docs" className="bg-[#e4e4e0] text-[#292929] px-6 py-3 rounded-full text-[16px] font-medium no-underline hover:bg-[#d0d0c8] transition-colors">
            Read Docs
          </Link>
        </motion.div>
      </section>

      {/* The Problem Section */}
      <section className="py-[100px] px-6 bg-[#edede8]">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-[48px]">
          <div className="md:col-span-5 relative">
            <div className="sticky top-[100px]">
              <h2 className="text-[36px] md:text-[45px] font-medium leading-[1.1] text-[#292929] mb-4">
                Chat was the placeholder.<br/>Not the destination.
              </h2>
              <p className="text-[19px] text-[#6f6f6e]">
                We've been forcing complex, non-linear thought into a single vertical timeline.
              </p>
            </div>
          </div>
          
          <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {frictionCards.map((card, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: idx * 0.05, ease: "easeOut" }}
                className="bg-[#ffffff] rounded-[12px] p-[18px] border border-[#0000001f] shadow-sm flex flex-col gap-3"
              >
                <div className="w-[36px] h-[36px] rounded-full bg-[#c0c0c0] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px] text-[#353535]">{card.icon}</span>
                </div>
                <h3 className="text-[16px] font-medium text-[#292929]">{card.title}</h3>
                <p className="text-[14px] text-[#6f6f6e] leading-[1.4]">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* WOW 1 Section */}
      <section className="py-[100px] px-6">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-[48px] items-center">
          <div>
            <div className="inline-block px-3 py-1 bg-[#e4e4e0] rounded-full text-[12px] font-medium text-[#6f6f6e] mb-6">
              PS01 — Explainable AI Reasoning
            </div>
            <h2 className="text-[36px] md:text-[45px] font-medium leading-[1.1] text-[#292929] mb-4">
              See the blast radius<br/>of a single belief.
            </h2>
            <p className="text-[19px] text-[#6f6f6e] leading-[1.4] mb-8">
              Hover any assumption. Watch every node that depends on it pulse amber simultaneously. The AI's reasoning isn't buried in prose — it's drawn on the canvas, touchable and overridable in real time.
            </p>
            <ul className="flex flex-col gap-3 mb-8 text-[14px] text-[#292929]">
              <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px] text-[#8f8f8e]">check</span> Assumption Audit Panel — every AI assumption in plain language</li>
              <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px] text-[#8f8f8e]">check</span> Impact Halo — hover to reveal the dependency graph instantly</li>
              <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px] text-[#8f8f8e]">check</span> Override any assumption — only the affected subgraph recomputes</li>
              <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px] text-[#8f8f8e]">check</span> Confidence bars — Low / Medium / High, no raw percentages</li>
            </ul>
            <Link to="/workspace" className="inline-block bg-[#e4e4e0] text-[#292929] px-6 py-3 rounded-full text-[14px] font-medium no-underline hover:bg-[#d0d0c8] transition-colors">
              Try it in Workspace →
            </Link>
          </div>
          <div className="bg-[#dbdbd2] rounded-[16px] aspect-square flex items-center justify-center p-8 border border-[#c0c0c0]">
            {/* Placeholder for visual */}
            <div className="text-[#8f8f8e] text-center">
              <span className="material-symbols-outlined text-[48px] mb-2">account_tree</span>
              <p>Assumption Graph Visual</p>
            </div>
          </div>
        </div>
      </section>

      {/* WOW 2 Section */}
      <section className="py-[100px] px-6 bg-[#dbdbd2]">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-[48px] items-center">
          <div className="order-2 md:order-1 bg-[#edede8] rounded-[16px] aspect-square flex items-center justify-center p-8 border border-[#c0c0c0]">
            {/* Placeholder for visual */}
            <div className="text-[#8f8f8e] text-center">
              <span className="material-symbols-outlined text-[48px] mb-2">memory</span>
              <p>Memory Negotiation UI</p>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <div className="inline-block px-3 py-1 bg-[#edede8] rounded-full text-[12px] font-medium text-[#6f6f6e] mb-6">
              PS06 — Negotiated AI Memory
            </div>
            <h2 className="text-[36px] md:text-[45px] font-medium leading-[1.1] text-[#292929] mb-4">
              Memory is a negotiation,<br/>not a background process.
            </h2>
            <p className="text-[19px] text-[#6f6f6e] leading-[1.4] mb-8">
              Before anything is stored, Kleos asks. You choose the scope — this session, this project, or always. The AI waits for your consent. Nothing is silently learned.
            </p>
            <ul className="flex flex-col gap-3 mb-8 text-[14px] text-[#292929]">
              <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px] text-[#8f8f8e]">check</span> Memory Negotiation Card — consent before every storage event</li>
              <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px] text-[#8f8f8e]">check</span> Four memory tiers — each with a distinct lifecycle</li>
              <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px] text-[#8f8f8e]">check</span> Tier 2 quarantine — inferred memories never influence responses until accepted</li>
              <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px] text-[#8f8f8e]">check</span> Session Memory Audit — explicit per-item consent ledger at session close</li>
            </ul>
            <Link to="/workspace" className="inline-block bg-[#edede8] text-[#292929] px-6 py-3 rounded-full text-[14px] font-medium no-underline hover:bg-[#e4e4e0] transition-colors">
              Open Workspace →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
