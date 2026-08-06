import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'the-canvas', label: 'The Canvas' },
  { id: 'input', label: 'Input' },
  { id: 'export', label: 'Export' },
  { id: 'faq', label: 'FAQ' },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('overview');

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
            Documentation
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
        <div className="max-w-[680px] mx-auto pb-32">
          
          <h1 className="text-[64px] font-medium leading-[0.8] tracking-[-0.64px] mb-12 text-[#141414]">
            Documentation
          </h1>

          <section id="overview" className="mb-16 scroll-mt-24">
            <h2 className="text-[32px] font-medium leading-[1.3] tracking-[-0.32px] mb-6 text-[#141414]">Overview</h2>
            <p className="text-[19px] leading-[1.4] mb-4 text-[#292929]">
              Kleos is a spatial AI canvas for structured thinking work. Instead of a chat thread, ideas become typed nodes on an infinite canvas. Drop a PDF, type a thought, or speak — the AI compiles it into a graph of ideas, assumptions, and evidence.
            </p>
            <p className="text-[19px] leading-[1.4] text-[#292929]">
              This is the workspace reference. For why Kleos was designed this way, see the <Link to="/research" className="text-[#4cc02b] hover:underline">Research</Link> page.
            </p>
          </section>

          <section id="getting-started" className="mb-16 scroll-mt-24">
            <h2 className="text-[32px] font-medium leading-[1.3] tracking-[-0.32px] mb-6 text-[#141414]">Getting Started</h2>
            <ol className="list-decimal pl-5 space-y-3 text-[19px] leading-[1.4] text-[#292929] mb-6">
              <li className="pl-2">Open <Link to="/workspace" className="text-[#4cc02b] hover:underline">/workspace</Link>. The canvas loads and creates a new session.</li>
              <li className="pl-2">The <strong>Mode Selector</strong> appears — choose the mode that matches your task (Analytical / Creative / Critical / Strategic).</li>
              <li className="pl-2">The canvas opens. Four suggestion chips appear on the empty canvas — the quickest way to start is <strong>"Say something"</strong> (voice) or <strong>"Type an idea"</strong> (text input bar at the bottom).</li>
              <li className="pl-2">The <strong>Status Pill</strong> in the header shows your current state at all times: <code>Ready</code>, <code>Listening</code>, or <code>Working...</code></li>
            </ol>
            <div className="bg-[#ffffff] border-l-2 border-[#4cc02b] p-4 text-[16px] leading-[1.5] text-[#6f6f6e] shadow-sm">
              <strong className="text-[#141414]">Note:</strong> The Mode Selector only appears on first use. On return visits, the canvas opens directly with the last active mode.
            </div>
          </section>

          <section id="the-canvas" className="mb-16 scroll-mt-24">
            <h2 className="text-[32px] font-medium leading-[1.3] tracking-[-0.32px] mb-6 text-[#141414]">The Canvas</h2>
            
            <h3 className="text-[23px] font-medium leading-[1.35] tracking-[-0.23px] mb-4 mt-8 text-[#141414]">Nodes & Edges</h3>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-[14px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#d0d0c8]">
                    <th className="py-2 pr-4 font-medium text-[#141414]">Node Type</th>
                    <th className="py-2 font-medium text-[#141414]">What it represents</th>
                  </tr>
                </thead>
                <tbody className="text-[#6f6f6e]">
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4">Idea</td><td className="py-2">A concept or possibility</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4">Evidence</td><td className="py-2">A sourced claim from a dropped document</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4">Assumption</td><td className="py-2">A belief the AI made without direct sourcing — dashed border</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4">Question</td><td className="py-2">An open question on the canvas</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4">Constraint</td><td className="py-2">A hard limit or requirement</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4">Insight</td><td className="py-2">A synthesized conclusion across multiple nodes</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4">Decision</td><td className="py-2">A committed choice, created on Branch Commit</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4">Source</td><td className="py-2">A dropped artifact, parent of extracted nodes</td></tr>
                </tbody>
              </table>
            </div>

            <p className="text-[19px] leading-[1.4] mb-4 text-[#292929]">Every node carries a <strong>Provenance Badge</strong> — a color-coded indicator of where the information came from:</p>
            
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-[14px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#d0d0c8]">
                    <th className="py-2 pr-4 font-medium text-[#141414]">Badge</th>
                    <th className="py-2 pr-4 font-medium text-[#141414]">Color</th>
                    <th className="py-2 font-medium text-[#141414]">Meaning</th>
                  </tr>
                </thead>
                <tbody className="text-[#6f6f6e]">
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4">Document</td><td className="py-2 pr-4 text-[#292929]">Blue</td><td className="py-2">From a dropped file. Hover to see page reference.</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4">Core Memory</td><td className="py-2 pr-4 text-[#292929]">Green</td><td className="py-2">From a Tier 0 memory you ratified.</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4">AI Inference</td><td className="py-2 pr-4 text-[#292929]">Yellow</td><td className="py-2">Derived from canvas context.</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4">Parametric</td><td className="py-2 pr-4 text-[#e84040] font-medium">Red</td><td className="py-2">AI training data — no document source. Treat with skepticism.</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4">User-Created</td><td className="py-2 pr-4 text-[#292929]">White</td><td className="py-2">Created by you directly.</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4">Voice Input</td><td className="py-2 pr-4 text-[#292929]">Lime</td><td className="py-2">Spoken via voice input. Distinct from AI Inference.</td></tr>
                </tbody>
              </table>
            </div>

            <div className="bg-[#ffffff] border-l-2 border-[#141414] p-4 text-[16px] leading-[1.5] text-[#6f6f6e] shadow-sm mb-8">
              <strong className="text-[#141414]">Important:</strong> The red Parametric badge is the primary trust signal. It means the AI has no source document for this claim.
            </div>

            <h3 className="text-[23px] font-medium leading-[1.35] tracking-[-0.23px] mb-4 mt-8 text-[#141414]">Memory System</h3>
            <p className="text-[19px] leading-[1.4] mb-4 text-[#292929]">Kleos uses a four-tier memory system. Nothing is remembered without your explicit consent.</p>
            
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-[14px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#d0d0c8]">
                    <th className="py-2 pr-4 font-medium text-[#141414]">Tier</th>
                    <th className="py-2 pr-4 font-medium text-[#141414]">Name</th>
                    <th className="py-2 pr-4 font-medium text-[#141414]">Scope</th>
                    <th className="py-2 font-medium text-[#141414]">Lifecycle</th>
                  </tr>
                </thead>
                <tbody className="text-[#6f6f6e]">
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4">Tier 0</td><td className="py-2 pr-4">Core</td><td className="py-2 pr-4">Global</td><td className="py-2">Permanent — you ratified it</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4">Tier 1</td><td className="py-2 pr-4">Workspace</td><td className="py-2 pr-4">Workspace</td><td className="py-2">Persists across sessions for this project</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4">Tier 1</td><td className="py-2 pr-4">Session</td><td className="py-2 pr-4">Session</td><td className="py-2">Expires when the canvas closes</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4">Tier 2</td><td className="py-2 pr-4">Inferred</td><td className="py-2 pr-4">Session</td><td className="py-2">AI-proposed; quarantined until you accept it</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4">Tier 3</td><td className="py-2 pr-4">Source</td><td className="py-2 pr-4">Source</td><td className="py-2">Tied to a dropped artifact</td></tr>
                </tbody>
              </table>
            </div>
            
            <div className="bg-[#ffffff] border-l-2 border-[#141414] p-4 text-[16px] leading-[1.5] text-[#6f6f6e] shadow-sm mb-6">
              <strong className="text-[#141414]">Critical:</strong> Tier 2 memories are completely excluded from AI context until accepted. The Memory Panel Pending tab shows: <em>"These have not influenced any response yet."</em>
            </div>

            <p className="text-[19px] leading-[1.4] mb-3 text-[#292929]"><strong>Memory Panel:</strong> Open with the memory icon. Four tabs: Core / Session / Pending / Source. Each item shows text, provenance, and last-used time. Inline actions: Edit, Archive, Promote, Demote. Search filters across all tabs.</p>
            <p className="text-[19px] leading-[1.4] mb-3 text-[#292929]"><strong>Memory Negotiation Card:</strong> Appears at natural pause points when the AI detects a recurring preference. The card shows what was observed, then offers four scope options. Nothing is stored before you choose.</p>
            <p className="text-[19px] leading-[1.4] mb-3 text-[#292929]"><strong>Session Memory Audit:</strong> When you close the canvas, Kleos lists everything it inferred during the session. Per-item controls: Accept (set scope), Reject (permanent exclusion), Edit. Rejected items never influence a future response.</p>
            <p className="text-[19px] leading-[1.4] mb-8 text-[#292929]"><strong>Incognito Mode:</strong> Toggle from the header icon. While active: dark border surrounds the canvas, "Incognito" badge appears, nothing is saved to any memory tier, Session Audit is skipped.</p>

            <h3 className="text-[23px] font-medium leading-[1.35] tracking-[-0.23px] mb-4 mt-8 text-[#141414]">Explainable AI</h3>
            <p className="text-[19px] leading-[1.4] mb-6 text-[#292929]">Every AI action on the canvas is visible, inspectable, and reversible.</p>

            <p className="text-[19px] leading-[1.4] mb-3 text-[#292929]"><strong>Reasoning Ribbon:</strong> A thin strip at the canvas bottom, visible only during compilation. Narrates each AI step in plain language. Steps are clickable. When the AI is uncertain, it says so inline. Fades 2 seconds after compilation completes.</p>
            <p className="text-[19px] leading-[1.4] mb-3 text-[#292929]"><strong>Assumption Audit Panel:</strong> Open with the help icon. Lists every assumption the AI made. Per assumption: statement, confidence bar, provenance badge, action buttons. When you override an assumption, only the dependent subgraph recomputes.</p>
            <p className="text-[19px] leading-[1.4] mb-3 text-[#292929]"><strong>Impact Halo:</strong> Hover any assumption in the Assumption Audit Panel. Every node that depends on it pulses amber simultaneously. Pre-computed at node creation — no API call on hover.</p>
            <p className="text-[19px] leading-[1.4] mb-8 text-[#292929]"><strong>Contradiction Flags:</strong> Auto-detected during compilation. Both conflicting nodes pulse red for 1 second; a red edge with a lightning symbol persists between them. Hover the edge for the explanation.</p>

            <h3 className="text-[23px] font-medium leading-[1.35] tracking-[-0.23px] mb-4 mt-8 text-[#141414]">Branches & Compare</h3>
            <p className="text-[19px] leading-[1.4] mb-3 text-[#292929]">Branches let you explore an alternative line of reasoning without losing your current work. The Branch Rail shows all branches as tabs.</p>
            <p className="text-[19px] leading-[1.4] mb-3 text-[#292929]"><strong>Creating a branch:</strong> Press <code>B</code>, click the fork icon in the Branch Rail, or say "Branch on [topic]" by voice.</p>
            <p className="text-[19px] leading-[1.4] mb-3 text-[#292929]"><strong>Comparing branches:</strong> Press <code>C</code> or click Compare in the Branch Rail. Two branches appear side by side. Changed nodes are highlighted in amber.</p>
            <p className="text-[19px] leading-[1.4] mb-8 text-[#292929]"><strong>Committing a branch:</strong> Click Commit in the Branch Rail. The branch merges into main and creates a Decision node recording the commit. Committed branches cannot be further edited.</p>
          </section>

          <section id="input" className="mb-16 scroll-mt-24">
            <h2 className="text-[32px] font-medium leading-[1.3] tracking-[-0.32px] mb-6 text-[#141414]">Input</h2>
            <div className="overflow-x-auto mb-8">
              <table className="w-full text-[14px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#d0d0c8]">
                    <th className="py-2 pr-4 font-medium text-[#141414]">Method</th>
                    <th className="py-2 font-medium text-[#141414]">How</th>
                  </tr>
                </thead>
                <tbody className="text-[#6f6f6e]">
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4">Text</td><td className="py-2">Type in the input bar at the bottom of the canvas. <code>Ctrl+Enter</code> to submit.</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4">Voice</td><td className="py-2">Click the mic icon in the header or use the "Say something" chip. All 12 verbs are voice-addressable.</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4">PDF</td><td className="py-2">Drop onto the canvas. Up to 20MB. Page references preserved in badges.</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4">DOCX</td><td className="py-2">Drop onto the canvas. Up to 10MB.</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4">Image</td><td className="py-2">Drop onto the canvas. Analyzed via Vision.</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4">Plain text</td><td className="py-2">Paste directly into the text input bar.</td></tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-[23px] font-medium leading-[1.35] tracking-[-0.23px] mb-4 mt-8 text-[#141414]">12 Interaction Verbs</h3>
            <p className="text-[19px] leading-[1.4] mb-4 text-[#292929]">Available via right-click, toolbar, or keyboard. <code>Esc</code> dismisses any open panel.</p>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-[14px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#d0d0c8]">
                    <th className="py-2 pr-4 font-medium text-[#141414]">Verb</th>
                    <th className="py-2 pr-4 font-medium text-[#141414]">Key</th>
                    <th className="py-2 font-medium text-[#141414]">What it does</th>
                  </tr>
                </thead>
                <tbody className="text-[#6f6f6e]">
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4">Branch</td><td className="py-2 pr-4"><code>B</code></td><td className="py-2">Forks the canvas into a parallel branch</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4">Merge</td><td className="py-2 pr-4"><code>M</code></td><td className="py-2">Synthesizes 2+ selected nodes into one</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4">Compare</td><td className="py-2 pr-4"><code>C</code></td><td className="py-2">Two branches side by side</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4">Trace</td><td className="py-2 pr-4"><code>T</code></td><td className="py-2">Dims canvas; shows reasoning path to a node</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4">Pin</td><td className="py-2 pr-4"><code>P</code></td><td className="py-2">Locks a node position; AI respects it in layouts</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4">Drop</td><td className="py-2 pr-4">—</td><td className="py-2">Compiles a file or text into typed nodes</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4">Split</td><td className="py-2 pr-4">—</td><td className="py-2">Decomposes a node into sub-nodes</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4">Collapse</td><td className="py-2 pr-4">—</td><td className="py-2">Folds a cluster into one summary node</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4">Commit</td><td className="py-2 pr-4">—</td><td className="py-2">Merges a branch into main</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4">Rewind</td><td className="py-2 pr-4">—</td><td className="py-2">Restores canvas to a previous keyframe</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4">Counterfactual</td><td className="py-2 pr-4">—</td><td className="py-2">Removes an assumption; AI recompiles the subgraph</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4">Anchor</td><td className="py-2 pr-4">—</td><td className="py-2">Manually assigns a node to a cluster</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section id="export" className="mb-16 scroll-mt-24">
            <h2 className="text-[32px] font-medium leading-[1.3] tracking-[-0.32px] mb-6 text-[#141414]">Export</h2>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-[14px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#d0d0c8]">
                    <th className="py-2 pr-4 font-medium text-[#141414]">Type</th>
                    <th className="py-2 font-medium text-[#141414]">Contents</th>
                  </tr>
                </thead>
                <tbody className="text-[#6f6f6e]">
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4">Full Canvas</td><td className="py-2">All nodes, edges, assumptions, decisions, memory context</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4">Decision Summary</td><td className="py-2">Problem, assumptions, evidence, decisions</td></tr>
                  <tr className="border-b border-[#d0d0c8]"><td className="py-2 pr-4">Research Notes</td><td className="py-2">Evidence, open questions, reasoning summary, memory context</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-[19px] leading-[1.4] mb-4 text-[#292929]">Formats: Markdown (instant) or PDF (2–6 seconds). Machine-readable JSON available from Settings.</p>
          </section>

          <section id="faq" className="mb-16 scroll-mt-24">
            <h2 className="text-[32px] font-medium leading-[1.3] tracking-[-0.32px] mb-6 text-[#141414]">FAQ</h2>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-[19px] font-medium text-[#141414] mb-2">Does Kleos remember me across sessions?</h4>
                <p className="text-[19px] leading-[1.4] text-[#292929]">Only if you allow it. Core and Workspace memories persist. Session memories expire when the canvas closes. Nothing is remembered without your explicit consent.</p>
              </div>
              <div>
                <h4 className="text-[19px] font-medium text-[#141414] mb-2">What happens to memories I reject in the Session Audit?</h4>
                <p className="text-[19px] leading-[1.4] text-[#292929]">They are permanently excluded from all future AI context. They will never influence a response.</p>
              </div>
              <div>
                <h4 className="text-[19px] font-medium text-[#141414] mb-2">Why is the canvas not loading?</h4>
                <p className="text-[19px] leading-[1.4] text-[#292929]">The AI service may be starting up — wait 10–15 seconds and reload. Voice requires Chrome; Safari is not supported.</p>
              </div>
              <div>
                <h4 className="text-[19px] font-medium text-[#141414] mb-2">Why is voice not connecting?</h4>
                <p className="text-[19px] leading-[1.4] text-[#292929]">Ensure Chrome has microphone permission. Reload the page to re-establish the connection.</p>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
