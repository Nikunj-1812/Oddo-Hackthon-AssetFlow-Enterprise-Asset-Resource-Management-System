"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { 
  ArrowRight, ShieldCheck, Zap, Box, 
  Terminal, ClipboardCheck
} from "lucide-react";
import { motion } from "framer-motion";
import Lenis from "lenis";

// --- FadeIn Scroll Animation Wrapper ---
const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 200, damping: 20 } }
};

export default function Home() {
  // Smooth Scrolling (Lenis)
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#111827] font-sans antialiased selection:bg-[#53ba8d]/30 selection:text-black">
      
      {/* ── 1. PREMIUM HEADER / NAVIGATION ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#E5E7EB] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#53ba8d] flex items-center justify-center shadow-sm">
              <Zap size={16} className="text-white fill-white" />
            </div>
            <span className="font-bold text-base tracking-tight text-[#111827]">AssetFlow</span>
          </Link>
          
          <div className="flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-[#6B7280]">
            <a href="#problem" className="hover:text-[#53ba8d] transition-colors">What We Solve</a>
            <a href="#workflow" className="hover:text-[#53ba8d] transition-colors">How It Works</a>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-xs font-bold text-[#6B7280] hover:text-[#111827] transition-colors px-4 py-2">
              Login
            </Link>
            <Link href="/login" className="text-xs font-bold bg-[#53ba8d] text-white px-5 py-2.5 rounded-full hover:bg-[#47a37a] transition-all">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── 2. SAAS HERO SECTION ── */}
      <section className="relative pt-44 pb-20 overflow-hidden bg-white border-b border-[#E5E7EB]">
        {/* Decorative Grid Pattern */}
        <div 
          className="absolute inset-0 pointer-events-none" 
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(83, 186, 141, 0.28) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(83, 186, 141, 0.28) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
            maskImage: "radial-gradient(circle at center, black, transparent 80%)",
            WebkitMaskImage: "radial-gradient(circle at center, black, transparent 80%)",
            opacity: 1,
          }}
        />
        <div className="max-w-4xl mx-auto px-6 flex flex-col items-center text-center relative z-10">
          
          {/* Accent badge */}
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#53ba8d]/20 bg-[#53ba8d]/5 text-[10px] font-extrabold uppercase tracking-widest text-[#53ba8d] mb-8">
              <span className="flex h-1.5 w-1.5 rounded-full bg-[#53ba8d] animate-pulse"></span>
              IMMEDIATE_DATA_SYNCHRONIZATION
            </div>
          </FadeIn>

          {/* Heading */}
          <FadeIn delay={0.1}>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[1.05] text-[#111827]">
              Manage every asset.<br />
              <span className="text-[#53ba8d]">
                Optimize every resource.
              </span>
            </h1>
          </FadeIn>

          {/* Subtext */}
          <FadeIn delay={0.2}>
            <p className="text-base md:text-lg text-[#6B7280] max-w-xl leading-relaxed mt-6 mb-10">
              The high-fidelity enterprise control deck unifying hardware registries, room bookings, repair Kanbans, and automated compliance audits.
            </p>
          </FadeIn>

          {/* CTAs */}
          <FadeIn delay={0.3}>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/login">
                <motion.button 
                  whileHover={{ scale: 1.025 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="group flex items-center gap-2 bg-[#53ba8d] text-white px-8 py-4 rounded-full font-bold hover:bg-[#47a37a] hover:shadow-[0_8px_25px_rgba(83,186,141,0.2)] transition-all cursor-pointer"
                >
                  Launch Workspace Free <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </motion.button>
              </Link>
            </div>
          </FadeIn>

        </div>
      </section>

      {/* ── 3. WHAT WE ARE SOLVING ── */}
      <section id="problem" className="py-24 bg-white border-b border-[#E5E7EB]">
        <div className="max-w-5xl mx-auto px-6">
          
          <FadeIn className="text-center mb-16">
            <span className="text-[10px] font-extrabold text-[#53ba8d] uppercase tracking-wider block mb-3">WHAT WE SOLVE</span>
            <h2 className="text-3xl font-extrabold tracking-tight text-[#111827] mb-4">
              Stop losing capital to physical leakage.
            </h2>
            <p className="text-[#6B7280] text-sm max-w-xl mx-auto">
              Spreadsheets fall apart under operational scale. AssetFlow consolidates your registries, allocations, and audits into a single source of truth.
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-8">
            {/* The Problem: Spreadsheet Chaos */}
            <motion.div 
              whileHover={{ y: -4, borderColor: "rgba(17, 24, 39, 0.15)" }}
              transition={{ duration: 0.25 }}
              className="bg-white border border-[#E5E7EB] rounded-3xl p-8 text-left transition-all duration-300"
            >
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-neutral-400 mb-6">Legacy spreadsheet registries</h3>
              <motion.ul 
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="space-y-4 text-xs font-semibold text-[#6B7280]"
              >
                {[
                  "Manual double entry invoice data errors",
                  "No live checks to prevent booking collisions",
                  "Fragmented, unchecked chains of custodian custody",
                  "Static depreciation rates with zero tax calculations",
                  "Zero system permissions or access logs"
                ].map((text, i) => (
                  <motion.li key={i} variants={itemVariants} className="flex items-center gap-3">
                    <span className="text-neutral-300 text-sm">✕</span> {text}
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>
            
            {/* The Solution: AssetFlow ERP Engine */}
            <motion.div 
              whileHover={{ y: -4, borderColor: "rgba(83, 186, 141, 0.45)" }}
              transition={{ duration: 0.25 }}
              className="bg-[#53ba8d]/5 border border-[#53ba8d]/25 rounded-3xl p-8 text-left relative overflow-hidden transition-all duration-300"
            >
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#53ba8d] mb-6">AssetFlow ERP Engine</h3>
              <motion.ul 
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="space-y-4 text-xs font-bold text-[#111827]"
              >
                {[
                  "Automated cloud inventory database logging",
                  "Conflict-free booking locks for rooms and vehicles",
                  "Secure sign-offs for transparent custodian custody",
                  "Auto tax & residual lifecycle depreciation counters",
                  "Role-based permission controls and audit security logs"
                ].map((text, i) => (
                  <motion.li key={i} variants={itemVariants} className="flex items-center gap-3">
                    <span className="text-[#53ba8d] text-sm">✓</span> {text}
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 4. HOW IT WORKS (THE WORKFLOW) ── */}
      <section id="workflow" className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          
          <FadeIn className="text-center mb-16">
            <span className="text-[10px] font-extrabold text-[#53ba8d] uppercase tracking-wider block mb-3">HOW IT WORKS</span>
            <h2 className="text-3xl font-extrabold tracking-tight text-[#111827] mb-4">
              Your assets. Fully automated.
            </h2>
            <p className="text-[#6B7280] text-sm max-w-xl mx-auto">
              From acquisition to retirement. AssetFlow manages each step of the resource lifecycle.
            </p>
          </FadeIn>
          
          <div className="relative border-l-2 border-[#E5E7EB] text-left pl-8 space-y-12">
            {[
              { step: "01", title: "Procure & Catalog", desc: "Log procurement details, upload invoices, generate structured QR labels, and establish default depreciation metrics." },
              { step: "02", title: "Custodian Custody", desc: "Allocate hardware directly to teams. Access automated digital sign-offs for clear chain of custody." },
              { step: "03", title: "Reserve & Utilize", desc: "Book meeting rooms, company EV fleets, or lab gear with collision-prevention security." },
              { step: "04", title: "Maintain & Audit", desc: "Request fast repairs via Kanban queues and complete mobile-first barcode sweeps to audit inventory." },
              { step: "05", title: "Depreciate & Retire", desc: "Monitor residual book value, compute tax writes, and securely retire assets when usage completes." }
            ].map((item, idx) => (
              <div key={idx} className="relative">
                {/* Dot */}
                <motion.div 
                  initial={{ scale: 0.6, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ type: "spring", stiffness: 300, damping: 15, delay: idx * 0.05 }}
                  className="absolute -left-[41px] top-1.5 w-6 h-6 rounded-full bg-white border-2 border-[#53ba8d] flex items-center justify-center"
                >
                  <span className="w-2 h-2 rounded-full bg-[#53ba8d]" />
                </motion.div>
                <div>
                  <span className="text-[10px] font-mono text-[#53ba8d] font-bold block mb-1">STAGE {item.step}</span>
                  <h4 className="text-base font-extrabold text-[#111827]">{item.title}</h4>
                  <p className="text-xs text-[#6B7280] mt-1.5 leading-relaxed max-w-xl">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. SIMPLE CTA SECTION ── */}
      <section className="py-24 relative overflow-hidden bg-[#FAFAFA] border-t border-[#E5E7EB]">
        {/* Decorative Grid Pattern */}
        <div 
          className="absolute inset-0 pointer-events-none" 
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(83, 186, 141, 0.24) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(83, 186, 141, 0.24) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
            maskImage: "radial-gradient(circle at center, black, transparent 85%)",
            WebkitMaskImage: "radial-gradient(circle at center, black, transparent 85%)",
            opacity: 1,
          }}
        />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10 space-y-6">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-[#111827]">
              Ready to modernize your resource logs?
            </h2>
            <p className="text-sm text-[#6B7280] max-w-md mx-auto mt-4">
              Deploy the AssetFlow ecosystem in minutes. Claim complete visibility over your organization's physical and digital inventory.
            </p>
            
            <div className="flex flex-wrap justify-center items-center gap-4 mt-8">
              <Link href="/login" className="bg-[#53ba8d] text-white px-8 py-4 rounded-full font-bold hover:bg-[#47a37a] transition-all hover:shadow-[0_12px_30px_rgba(83,186,141,0.2)] hover:-translate-y-0.5">
                Launch Workspace Free
              </Link>
            </div>
            
            <span className="text-[10px] text-neutral-400 block mt-6">
              Free tier includes up to 50 assets. No credit card required.
            </span>
          </FadeIn>
        </div>
      </section>

      {/* ── 6. FOOTER ── */}
      <footer className="bg-white py-12 border-t border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-[#6B7280]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#53ba8d] flex items-center justify-center">
              <Zap size={12} className="text-white fill-white" />
            </div>
            <span className="font-bold text-sm tracking-tight text-[#111827]">AssetFlow</span>
          </div>
          <p>© 2026 AssetFlow Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-[#111827] transition-colors">Admin Login</Link>
            <a href="#" className="hover:text-[#111827] transition-colors">GitHub</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
