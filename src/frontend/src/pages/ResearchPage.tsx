import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const SECTIONS = [
  { id: 'why-kleos', label: 'Why Kleos' },
  { id: 'design-principles', label: 'Design Principles' },
  { id: 'research-foundations', label: 'Research Foundations' },
  { id: 'key-design-decisions', label: 'Key Design Decisions' },
  { id: 'roadmap', label: 'Roadmap' },
];

export default function ResearchPage() {
  const [activeSection, setActiveSection] = useState('why-kleos');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );

    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex min-h-screen bg-[#edede8] text-[#292929] font-['Switzer',sans-serif]">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-[220px] bg-[#ffffff] border-r border-[#d0d0c8] flex flex-col z-10 overflow-y-auto">
        <div className="p-6 pb-32">
          <Link to="/" className="text-[16px] font-medium text-[#141414] hover:opacity-70 transition-opacity">
            ← Home
          </Link>
          <div className="mt-8 text-[11px] uppercase tracking-wider text-[#6f6f6e] mb-4 font-medium">
            Research
          </div>
          <nav className="flex flex-col gap-1">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={`text-left px-3 py-1.5 text-[14px] transition-colors ${
                  activeSection === s.id
                    ? 'border-l-2 border-[#4cc02b] text-[#141414] font-medium bg-[#edede8]/50'
                    : 'border-l-2 border-transparent text-[#6f6f6e] hover:text-[#141414]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-[220px] p-12 lg:p-20 overflow-y-auto">
        <div className="max-w-[640px] mx-auto pb-32">
          
          <h1 className="text-[64px] font-medium leading-[0.8] tracking-[-0.64px] mb-12 text-[#141414]">
            Research
          </h1>

          <section id="why-kleos" className="mb-16 scroll-mt-24">
            <h2 className="text-[32px] font-medium leading-[1.3] tracking-[-0.32px] mb-6 text-[#141414]">Why Kleos</h2>
            <p className="text-[19px] leading-[1.4] mb-4 text-[#292929]">
              Chat was designed for conversation, not thinking work. When applied to tasks where the output is a decision or recommendation — literature synthesis, architecture decisions, strategic planning — it produces consistent, structural failures that better models cannot fix.
            </p>
            <p className="text-[19px] leading-[1.4] mb-4 text-[#292929]">
              The problem is not quality. It is structure. Chat has no persistent object model (ideas live in paragraphs, not as manipulable things), no spatial memory (humans think by arranging; chat only has time), and no parallel exploration (one thread, one line of reasoning). Reasoning is invisible, memory is opaque, and explanations are post-hoc rationalizations, not live narration.
            </p>
            <p className="text-[19px] leading-[1.4] mb-4 text-[#292929]">
              Kleos was built around a different premise: the interface is a semantic canvas to navigate, reshape, and fork — not a thread to scroll. The AI's job is not to answer messages; it is to continuously compile whatever you provide into a living canvas, and keep it coherent as you manipulate it directly.
            </p>
            <p className="text-[19px] leading-[1.4] text-[#292929]">
              <Link to="/docs" className="text-[#4cc02b] hover:underline font-medium">→ Documentation: See the canvas in practice</Link>
            </p>
          </section>

          <section id="design-principles" className="mb-16 scroll-mt-24">
            <h2 className="text-[32px] font-medium leading-[1.3] tracking-[-0.32px] mb-6 text-[#141414]">Design Principles</h2>
            <p className="text-[19px] leading-[1.4] mb-4 text-[#292929]">
              Every Kleos feature passed two filters before shipping. Features that fail either do not exist in the product.
            </p>
            <div className="bg-[#ffffff] border-l-2 border-[#141414] p-4 text-[16px] leading-[1.5] text-[#292929] shadow-sm mb-4">
              <strong>The Reframing Filter:</strong> Ask not "what can an LLM do?" but "what interaction has become possible because LLMs exist?" This eliminates features that are LLM-wrapped versions of existing tools.
            </div>
            <div className="bg-[#ffffff] border-l-2 border-[#141414] p-4 text-[16px] leading-[1.5] text-[#292929] shadow-sm mb-8">
              <strong>The Cognitive Load Filter:</strong> Does this component reduce cognitive friction, or add it? If it adds friction without proportional benefit, it does not ship. This is why the Trust Lens overlay is a toggle, why the Reasoning Ribbon fades after 2 seconds, and why the toolbar is icon-only.
            </div>
            
            <h3 className="text-[23px] font-medium leading-[1.35] tracking-[-0.23px] mb-4 mt-8 text-[#141414]">Ten binding principles</h3>
            <p className="text-[19px] leading-[1.4] mb-4 text-[#292929]">These are not guidelines. Every feature is evaluated against all ten.</p>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-[14px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#d0d0c8]">
                    <th className="py-2 pr-4 font-medium text-[#141414]">#</th>
                    <th className="py-2 pr-4 font-medium text-[#141414]">Principle</th>
                    <th className="py-2 font-medium text-[#141414]">Practical meaning</th>
                  </tr>
                </thead>
                <tbody className="text-[#6f6f6e]">
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4 text-[#141414] font-medium">P1</td><td className="py-2 pr-4">Thoughts are objects</td><td className="py-2">Ideas are typed nodes with identity, not sentences in a transcript</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4 text-[#141414] font-medium">P2</td><td className="py-2 pr-4">Everything is manipulable</td><td className="py-2">Every AI output can be grabbed, overridden, or deleted</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4 text-[#141414] font-medium">P3</td><td className="py-2 pr-4">AI never hides reasoning</td><td className="py-2">No compilation without a Ribbon; no assumption without an audit trail</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4 text-[#141414] font-medium">P4</td><td className="py-2 pr-4">Context is spatial</td><td className="py-2">Position carries semantic meaning</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4 text-[#141414] font-medium">P5</td><td className="py-2 pr-4">Exploration is parallel</td><td className="py-2">Branching is a first-class verb, not an advanced feature</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4 text-[#141414] font-medium">P6</td><td className="py-2 pr-4">Everything is reversible</td><td className="py-2">Merges, deletions, and branches can be rewound</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4 text-[#141414] font-medium">P7</td><td className="py-2 pr-4">Provenance is permanent</td><td className="py-2">Every node remembers its source — voice gets a distinct badge</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4 text-[#141414] font-medium">P8</td><td className="py-2 pr-4">Convergence is first-class</td><td className="py-2">Merge and Collapse are named verbs, not edge cases</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4 text-[#141414] font-medium">P9</td><td className="py-2 pr-4">Memory is negotiated</td><td className="py-2">Nothing stored before consent; Tier 2 quarantine is a hard constraint</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4 text-[#141414] font-medium">P10</td><td className="py-2 pr-4">Minimize cognitive load</td><td className="py-2">When in doubt, cut it</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section id="research-foundations" className="mb-16 scroll-mt-24">
            <h2 className="text-[32px] font-medium leading-[1.3] tracking-[-0.32px] mb-6 text-[#141414]">Research Foundations</h2>
            
            <h3 className="text-[23px] font-medium leading-[1.35] tracking-[-0.23px] mb-4 text-[#141414]">Spatial interfaces</h3>
            <ul className="list-disc pl-5 space-y-2 text-[16px] leading-[1.5] text-[#292929] mb-6">
              <li><strong>MindTrellis (DIS 2026):</strong> Graph representations enhance critical thinking over linear text in complex knowledge work.</li>
              <li><strong>ImaginationVellum (UIST 2025):</strong> Spatial canvas as prompt space — temporal replay of ideation on canvas produces richer reflection than chat history.</li>
              <li><strong>Orality (Li et al., CHI 2026):</strong> Speech-first canvas interfaces produce better reasoning outputs than ChatGPT with speech-to-text for complex thought.</li>
            </ul>

            <h3 className="text-[23px] font-medium leading-[1.35] tracking-[-0.23px] mb-4 text-[#141414]">Explainable AI</h3>
            <ul className="list-disc pl-5 space-y-2 text-[16px] leading-[1.5] text-[#292929] mb-6">
              <li><strong>Armstrong et al. MAVS (Visible Language 2025):</strong> Visual weight communicates uncertainty more effectively than numerical percentages — the basis for confidence bars over raw scores.</li>
              <li><strong>Hippo (Pang et al., CHI 2025):</strong> Interactive reasoning trees significantly increase assumption awareness over static explanations — the basis for the Assumption Audit Panel.</li>
              <li><strong>Counterfactual XAI (VISIGRAPP 2025 / CHI 2026):</strong> Users prefer counterfactual + feature-importance combination — the basis for Counterfactual Branches paired with Impact Halo.</li>
            </ul>

            <h3 className="text-[23px] font-medium leading-[1.35] tracking-[-0.23px] mb-4 text-[#141414]">Memory and consent</h3>
            <ul className="list-disc pl-5 space-y-2 text-[16px] leading-[1.5] text-[#292929] mb-6">
              <li><strong>"Relational Gains, Privacy Strains" (CHI 2026):</strong> Users prefer agency before information is stored, not after — the direct basis for Memory Negotiation Card and Tier 2 quarantine.</li>
              <li><strong>"Ghost of the Past" (CHI 2025):</strong> Proactive framing (explain the observation first, then propose storage) produces better trust than retroactive disclosure.</li>
              <li><strong>PersonaTree / "Inside Out" (Zhao et al., ACL 2026):</strong> Hierarchical memory architectures outperform flat vector stores for personalized long-term AI interactions.</li>
            </ul>
          </section>

          <section id="key-design-decisions" className="mb-16 scroll-mt-24">
            <h2 className="text-[32px] font-medium leading-[1.3] tracking-[-0.32px] mb-8 text-[#141414]">Key Design Decisions</h2>
            
            <div className="mb-10">
              <div className="pl-4 border-l-2 border-[#c0c0c0] mb-4">
                <h3 className="text-[23px] font-medium leading-[1.35] tracking-[-0.23px] text-[#141414]">Why four memory tiers, not a flat store</h3>
              </div>
              <p className="text-[19px] leading-[1.4] mb-3 text-[#292929]">
                Memory is not binary. A preference about communication style ("always use bullet points") has a different appropriate scope than a project-specific constraint ("this project has a $50k budget"). A flat store with metadata tags requires users to reason about a taxonomy before they can reason about their problem.
              </p>
              <p className="text-[19px] leading-[1.4] text-[#292929] font-medium">
                Four tiers impose the taxonomy as a structural constraint: Tier 0 is permanent, Tier 1 scopes to a session or workspace, Tier 2 is quarantined until accepted, Tier 3 is artifact-scoped. The user chooses tier by choosing a lifecycle, not by managing metadata.
              </p>
            </div>

            <div className="mb-10">
              <div className="pl-4 border-l-2 border-[#c0c0c0] mb-4">
                <h3 className="text-[23px] font-medium leading-[1.35] tracking-[-0.23px] text-[#141414]">Why Tier 2 is quarantined structurally, not just labeled</h3>
              </div>
              <p className="text-[19px] leading-[1.4] mb-3 text-[#292929]">
                If an inferred memory is present in context with a "pending" label, users have no way to verify whether the label is being respected at the prompt level. Trust requires structural enforcement. The alternative — including Tier 2 memories in context with a system prompt label — asks users to trust that the AI correctly interprets a label. That is fragile and untestable.
              </p>
              <p className="text-[19px] leading-[1.4] text-[#292929] font-medium">
                Quarantine is implemented as a filter in the context service, applied before any prompt is assembled. This makes it verifiable, not aspirational.
              </p>
            </div>

            <div className="mb-10">
              <div className="pl-4 border-l-2 border-[#c0c0c0] mb-4">
                <h3 className="text-[23px] font-medium leading-[1.35] tracking-[-0.23px] text-[#141414]">Why workspace modes instead of configurable parameters</h3>
              </div>
              <p className="text-[19px] leading-[1.4] mb-3 text-[#292929]">
                Different tasks require different reasoning postures. A literature review needs evidence-first reasoning with immediate flagging of unsourced claims. A creative brainstorm needs the opposite. A parameters approach (e.g., a skepticism slider) requires users to reason about AI configuration before they can reason about their actual problem.
              </p>
              <p className="text-[19px] leading-[1.4] text-[#292929] font-medium">
                Four named modes — Analytical, Creative, Critical, Strategic — each simultaneously set memory weighting and reasoning posture. The user makes one choice (task type) and the system applies the appropriate configuration.
              </p>
            </div>

            <div className="mb-10">
              <div className="pl-4 border-l-2 border-[#c0c0c0] mb-4">
                <h3 className="text-[23px] font-medium leading-[1.35] tracking-[-0.23px] text-[#141414]">Why Impact Halo is pre-computed, not computed on hover</h3>
              </div>
              <p className="text-[19px] leading-[1.4] mb-3 text-[#292929]">
                Showing which nodes depend on an assumption requires traversing the dependency graph. At canvas scale, this traversal cannot happen on hover without perceptible latency — a 200–400ms API round trip creates a broken interaction where the visual lags behind the gesture.
              </p>
              <p className="text-[19px] leading-[1.4] text-[#292929] font-medium">
                <code>impact_nodes</code> is computed at node creation time and stored as a field on each assumption node. The hover interaction is purely client-side: no API call, instant render. The trade-off is that the impact graph reflects the state at compilation time, not at hover time — acceptable because the canvas rarely changes between compilation and hover.
              </p>
            </div>

            <div className="mb-10">
              <div className="pl-4 border-l-2 border-[#c0c0c0] mb-4">
                <h3 className="text-[23px] font-medium leading-[1.35] tracking-[-0.23px] text-[#141414]">Why voice is the primary input channel, not secondary</h3>
              </div>
              <p className="text-[19px] leading-[1.4] mb-3 text-[#292929]">
                The evidence from Orality (CHI 2026) shows that speech-first canvas interfaces produce meaningfully different and higher-quality reasoning outputs — not marginally better ones. Treating voice as a secondary or accessibility feature would underinvest in the primary channel.
              </p>
              <p className="text-[19px] leading-[1.4] text-[#292929] font-medium">
                This decision has two consequences: (1) the onboarding nudge is "Say something," not "Type something"; (2) the Realtime API (gpt-4o-realtime-preview) was required — a separate STT → text → compile pipeline introduces enough latency to break the "thinking out loud" experience that makes voice valuable.
              </p>
            </div>
          </section>

          <section id="roadmap" className="mb-16 scroll-mt-24">
            <h2 className="text-[32px] font-medium leading-[1.3] tracking-[-0.32px] mb-6 text-[#141414]">Roadmap</h2>
            
            <h3 className="text-[19px] font-medium leading-[1.35] tracking-[-0.23px] mb-4 text-[#141414]">Designed, deferred from current build</h3>
            <div className="overflow-x-auto mb-8">
              <table className="w-full text-[14px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#d0d0c8]">
                    <th className="py-2 pr-4 font-medium text-[#141414]">Feature</th>
                    <th className="py-2 font-medium text-[#141414]">Note</th>
                  </tr>
                </thead>
                <tbody className="text-[#6f6f6e]">
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4 text-[#141414] font-medium">Memory Panel — graph view</td><td className="py-2">Visual graph of memory items and relationships</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4 text-[#141414] font-medium">Epistemic Health Check</td><td className="py-2">Automated check before Decision commit — surfaces unresolved assumptions</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4 text-[#141414] font-medium">Cognitive Load Monitor</td><td className="py-2">Collapse suggestion when node density is high but structure is low</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4 text-[#141414] font-medium">Custom workspace modes</td><td className="py-2">User-created modes beyond the four defaults</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4 text-[#141414] font-medium">PPTX, CSV/XLSX input</td><td className="py-2">For slide decks and data tables</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4 text-[#141414] font-medium">Semantic vector retrieval</td><td className="py-2">text-embedding-3-small for production-scale canvases (&gt;200 nodes)</td></tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-[19px] font-medium leading-[1.35] tracking-[-0.23px] mb-4 text-[#141414]">V1 → V2 (production)</h3>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-[14px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#d0d0c8]">
                    <th className="py-2 pr-4 font-medium text-[#141414]">Area</th>
                    <th className="py-2 font-medium text-[#141414]">Features</th>
                  </tr>
                </thead>
                <tbody className="text-[#6f6f6e]">
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4 text-[#141414] font-medium">Collaboration</td><td className="py-2">Multi-user canvases, real-time sync, memory conflict resolution</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4 text-[#141414] font-medium">Enterprise</td><td className="py-2">Organization-wide shared Core Memory with permission tiers</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4 text-[#141414] font-medium">Integrations</td><td className="py-2">Slack, Google Drive, GitHub, Jira as Drop sources</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4 text-[#141414] font-medium">Infrastructure</td><td className="py-2">Neo4j + Pinecone for advanced memory graph and semantic retrieval</td></tr>
                </tbody>
              </table>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
