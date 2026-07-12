"use client";

import Link from "next/link";
import { 
  ArrowRight, ShieldCheck, Zap, Activity, Building, Calendar, 
  Wrench, Users, CheckCircle2, ChevronRight, BarChart3, 
  Box, Smartphone, Globe, Lock, Cpu
} from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

// --- Components ---

const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.6, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    className={className}
  >
    {children}
  </motion.div>
);

const GlassCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white border border-[#E5E7EB] rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden relative ${className}`}>
    {children}
  </div>
);

// --- Sections ---

export default function Home() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#111827] font-sans selection:bg-[#92E4BA] selection:text-black">
      {/* 1. Sticky Navigation */}
      <nav className="sticky top-0 z-50 bg-[#FAFAFA]/80 backdrop-blur-xl border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#92E4BA] flex items-center justify-center shadow-sm">
              <Zap size={18} className="text-[#111827] fill-[#111827]" />
            </div>
            <span className="font-bold text-lg tracking-tight">AssetFlow</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#6B7280]">
            <a href="#features" className="hover:text-[#111827] transition-colors">Features</a>
            <a href="#workflow" className="hover:text-[#111827] transition-colors">Workflow</a>
            <a href="#analytics" className="hover:text-[#111827] transition-colors">Analytics</a>
            <a href="#roles" className="hover:text-[#111827] transition-colors">Solutions</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden sm:block text-sm font-medium text-[#6B7280] hover:text-[#111827] transition-colors">
              Login
            </Link>
            <Link href="/login" className="text-sm font-medium bg-[#111827] text-white px-5 py-2.5 rounded-full hover:bg-black transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 duration-200">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section ref={heroRef} className="relative pt-32 pb-20 overflow-hidden">
        {/* Subtle animated background shapes */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#92E4BA]/20 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            style={{ opacity, y }}
            className="flex flex-col items-start text-left space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#E5E7EB] bg-white shadow-sm text-xs font-semibold text-[#6B7280]">
              <span className="flex h-2 w-2 rounded-full bg-[#92E4BA] animate-pulse"></span>
              Enterprise Asset Intelligence Platform
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tighter leading-[1.1] text-[#111827]">
              Manage Every Asset.<br/>
              <span className="text-[#6B7280]">Optimize Every Resource.</span>
            </h1>
            
            <p className="text-xl text-[#6B7280] max-w-xl leading-relaxed">
              The all-in-one ERP to track resources, manage maintenance, perform audits, and gain deep operational insights. Built for modern enterprises.
            </p>
            
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link href="/login" className="group flex items-center gap-2 bg-[#92E4BA] text-[#111827] px-6 py-3.5 rounded-full font-semibold hover:bg-[#7cd4a5] transition-all hover:shadow-[0_8px_30px_rgba(146,228,186,0.4)] hover:-translate-y-0.5">
                Start Managing Assets <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="#features" className="flex items-center gap-2 bg-white border border-[#E5E7EB] text-[#111827] px-6 py-3.5 rounded-full font-semibold hover:bg-[#FAFAFA] transition-all hover:shadow-sm">
                View Demo
              </Link>
            </div>
          </motion.div>

          {/* Hero Dashboard Preview (Right Side) */}
          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-tr from-[#92E4BA]/20 to-transparent blur-2xl rounded-3xl -z-10" />
            <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.08)] p-2 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#92E4BA] to-transparent opacity-50" />
              
              <div className="border border-[#E5E7EB]/50 rounded-xl bg-[#FAFAFA] overflow-hidden">
                <div className="h-10 bg-white border-b border-[#E5E7EB] flex items-center px-4 gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#E5E7EB]"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-[#E5E7EB]"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-[#E5E7EB]"></div>
                  </div>
                </div>
                {/* Mock UI */}
                <div className="p-6 grid grid-cols-12 gap-6 h-[400px]">
                  <div className="col-span-3 space-y-3">
                    <div className="h-8 bg-[#E5E7EB]/50 rounded-lg w-full mb-6"></div>
                    <div className="h-6 bg-[#92E4BA]/20 rounded-md w-full"></div>
                    <div className="h-6 bg-[#E5E7EB]/30 rounded-md w-3/4"></div>
                    <div className="h-6 bg-[#E5E7EB]/30 rounded-md w-5/6"></div>
                    <div className="h-6 bg-[#E5E7EB]/30 rounded-md w-full"></div>
                  </div>
                  <div className="col-span-9 space-y-6">
                    <div className="flex justify-between items-center">
                      <div className="h-8 bg-[#E5E7EB]/50 rounded-lg w-48"></div>
                      <div className="h-8 bg-[#111827] rounded-full w-24"></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {[1,2,3].map(i => (
                        <div key={i} className="bg-white border border-[#E5E7EB] p-4 rounded-xl shadow-sm flex flex-col gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#92E4BA]/20"></div>
                          <div className="h-4 bg-[#E5E7EB]/50 rounded w-1/2"></div>
                          <div className="h-6 bg-[#111827]/20 rounded w-3/4"></div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-white border border-[#E5E7EB] h-32 rounded-xl shadow-sm p-4 relative overflow-hidden">
                      {/* Fake graph lines */}
                      <svg className="absolute bottom-0 w-full h-full preserve-aspect-ratio-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M0,100 L0,50 Q25,30 50,60 T100,20 L100,100 Z" fill="rgba(146, 228, 186, 0.1)" stroke="#92E4BA" strokeWidth="2" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <motion.div 
                animate={{ y: [0, -10, 0] }} 
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute -right-6 top-24 bg-white border border-[#E5E7EB] p-4 rounded-2xl shadow-xl flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#111827]">Audit Passed</div>
                  <div className="text-xs text-[#6B7280]">MacBook Pro AF-001</div>
                </div>
              </motion.div>
              
              <motion.div 
                animate={{ y: [0, 10, 0] }} 
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                className="absolute -left-6 bottom-16 bg-white border border-[#E5E7EB] p-4 rounded-2xl shadow-xl flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                  <Wrench size={20} />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#111827]">Maintenance</div>
                  <div className="text-xs text-[#6B7280]">HVAC Unit requires service</div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. Trusted By */}
      <section className="py-12 border-y border-[#E5E7EB] bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider mb-8">Trusted by innovative teams worldwide</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale">
            {['Acme Corp', 'GlobalHealth', 'TechNova', 'State University', 'BuildCo'].map((logo, i) => (
              <div key={i} className="text-xl md:text-2xl font-bold tracking-tight text-[#111827] flex items-center gap-2">
                <div className="w-6 h-6 bg-[#111827] rounded-sm"></div> {logo}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Feature Bento Grid */}
      <section id="features" className="py-32 max-w-7xl mx-auto px-6">
        <FadeIn className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-[#111827] mb-4">Everything you need to scale</h2>
          <p className="text-lg text-[#6B7280]">Powerful enterprise features wrapped in an intuitive, consumer-grade interface.</p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Bento 1: Registry */}
          <FadeIn delay={0.1} className="md:col-span-2">
            <GlassCard className="h-full p-8 md:p-12 hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] transition-shadow group bg-gradient-to-br from-white to-[#FAFAFA]">
              <div className="w-14 h-14 rounded-2xl bg-[#92E4BA]/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Box size={28} className="text-[#207a4a]" />
              </div>
              <h3 className="text-2xl font-bold text-[#111827] mb-3">Asset Registry</h3>
              <p className="text-[#6B7280] text-lg max-w-md">Maintain a single source of truth for all hardware, software, and physical resources across departments.</p>
              
              <div className="mt-8 border border-[#E5E7EB] rounded-xl bg-white p-4 flex items-center justify-between shadow-sm group-hover:-translate-y-1 transition-transform">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg"></div>
                  <div>
                    <div className="font-semibold text-sm">MacBook Pro 16"</div>
                    <div className="text-xs text-gray-500">Tag: AF-4892 • Status: Allocated</div>
                  </div>
                </div>
                <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Active</div>
              </div>
            </GlassCard>
          </FadeIn>

          {/* Bento 2: Bookings */}
          <FadeIn delay={0.2}>
            <GlassCard className="h-full p-8 md:p-12 hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] transition-shadow group bg-gradient-to-br from-white to-[#FAFAFA]">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Calendar size={28} className="text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-[#111827] mb-3">Resource Bookings</h3>
              <p className="text-[#6B7280]">Reserve meeting rooms, shared equipment, and vehicles with real-time conflict prevention.</p>
            </GlassCard>
          </FadeIn>

          {/* Bento 3: Maintenance */}
          <FadeIn delay={0.3}>
            <GlassCard className="h-full p-8 md:p-12 hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] transition-shadow group bg-gradient-to-br from-white to-[#FAFAFA]">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Wrench size={28} className="text-amber-600" />
              </div>
              <h3 className="text-2xl font-bold text-[#111827] mb-3">Maintenance</h3>
              <p className="text-[#6B7280]">Jira-style Kanban boards to track repairs, schedule preventive maintenance, and minimize downtime.</p>
            </GlassCard>
          </FadeIn>

          {/* Bento 4: Analytics */}
          <FadeIn delay={0.4} className="md:col-span-2">
            <GlassCard className="h-full p-8 md:p-12 hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] transition-shadow group bg-gradient-to-br from-white to-[#FAFAFA] relative overflow-hidden">
              <div className="absolute right-0 bottom-0 w-64 h-64 bg-[#92E4BA]/20 blur-[80px] rounded-full group-hover:bg-[#92E4BA]/30 transition-colors"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <BarChart3 size={28} className="text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-[#111827] mb-3">Executive Analytics</h3>
                <p className="text-[#6B7280] text-lg max-w-md">Make data-driven decisions with real-time heatmaps, utilization metrics, and predictive lifecycle tracking.</p>
              </div>
            </GlassCard>
          </FadeIn>
        </div>
      </section>

      {/* 5. Interactive Workflow Timeline */}
      <section id="workflow" className="py-24 bg-white border-y border-[#E5E7EB]">
        <div className="max-w-5xl mx-auto px-6">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-[#111827] mb-4">The Asset Lifecycle</h2>
            <p className="text-[#6B7280]">Manage the entire journey from acquisition to retirement.</p>
          </FadeIn>

          <div className="relative border-l-2 border-[#E5E7EB] ml-4 md:ml-1/2 space-y-12 pb-8">
            {[
              { title: "1. Register Asset", desc: "Add details, generate QR codes, and assign initial value.", icon: PlusCircle },
              { title: "2. Allocate & Deploy", desc: "Assign to departments or specific employees.", icon: Users },
              { title: "3. Book & Utilize", desc: "Enable shared resource booking and track usage.", icon: Calendar },
              { title: "4. Maintain & Repair", desc: "Log issues, assign technicians, and track resolution.", icon: Wrench },
              { title: "5. Audit & Verify", desc: "Scan QR codes during scheduled audit cycles to ensure compliance.", icon: ShieldCheck },
              { title: "6. Analyze & Retire", desc: "Review lifecycle cost and safely dispose of depreciated assets.", icon: BarChart3 }
            ].map((step, i) => (
              <FadeIn key={i} delay={i * 0.1} className="relative pl-8 md:pl-12">
                <div className="absolute w-8 h-8 bg-white border-2 border-[#92E4BA] rounded-full -left-[17px] top-0 flex items-center justify-center text-[#92E4BA] shadow-sm">
                  <div className="w-2.5 h-2.5 bg-[#92E4BA] rounded-full"></div>
                </div>
                <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <h4 className="text-xl font-bold text-[#111827] mb-2">{step.title}</h4>
                  <p className="text-[#6B7280]">{step.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Role Showcase */}
      <section id="roles" className="py-32 max-w-7xl mx-auto px-6">
        <FadeIn className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-[#111827] mb-4">Tailored for Every Role</h2>
          <p className="text-lg text-[#6B7280]">Unique dashboards designed specifically for how you work.</p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { role: "Executive Admin", icon: Globe, desc: "Global overview, cross-department analytics, and system configuration.", color: "bg-purple-100 text-purple-700" },
            { role: "Asset Manager", icon: Box, desc: "Inventory control, maintenance queues, and audit cycle management.", color: "bg-[#92E4BA]/30 text-[#1a4a2e]" },
            { role: "Department Head", icon: Users, desc: "Team allocations, department budgets, and resource approval.", color: "bg-blue-100 text-blue-700" },
            { role: "Employee", icon: Smartphone, desc: "Personal workspace to view assigned items, book resources, and log issues.", color: "bg-amber-100 text-amber-700" }
          ].map((role, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div className="bg-white border border-[#E5E7EB] rounded-3xl p-8 hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-all h-full group">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${role.color} group-hover:scale-110 transition-transform`}>
                  <role.icon size={24} />
                </div>
                <h3 className="text-xl font-bold text-[#111827] mb-3">{role.role}</h3>
                <p className="text-[#6B7280] text-sm leading-relaxed">{role.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* 8. Feature Comparison */}
      <section className="py-24 bg-[#111827] text-white">
        <div className="max-w-5xl mx-auto px-6">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Why upgrade to AssetFlow?</h2>
            <p className="text-neutral-400">Stop managing millions in assets on static spreadsheets.</p>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-8">
            <FadeIn delay={0.1} className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
              <h3 className="text-xl font-bold mb-6 text-neutral-400">Traditional Spreadsheets</h3>
              <ul className="space-y-4 text-neutral-300">
                <li className="flex items-center gap-3"><span className="text-red-400">✕</span> Manual data entry</li>
                <li className="flex items-center gap-3"><span className="text-red-400">✕</span> No real-time availability</li>
                <li className="flex items-center gap-3"><span className="text-red-400">✕</span> Untracked maintenance history</li>
                <li className="flex items-center gap-3"><span className="text-red-400">✕</span> Painful compliance audits</li>
                <li className="flex items-center gap-3"><span className="text-red-400">✕</span> No role-based access control</li>
              </ul>
            </FadeIn>
            <FadeIn delay={0.2} className="bg-gradient-to-br from-[#92E4BA]/20 to-transparent border border-[#92E4BA]/30 rounded-3xl p-8 backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#92E4BA]/20 blur-[50px]"></div>
              <h3 className="text-xl font-bold mb-6 text-[#92E4BA]">AssetFlow ERP</h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-3"><span className="text-[#92E4BA]">✓</span> Automated lifecycle tracking</li>
                <li className="flex items-center gap-3"><span className="text-[#92E4BA]">✓</span> Live booking and collision prevention</li>
                <li className="flex items-center gap-3"><span className="text-[#92E4BA]">✓</span> Jira-style maintenance Kanban</li>
                <li className="flex items-center gap-3"><span className="text-[#92E4BA]">✓</span> One-click digital QR audits</li>
                <li className="flex items-center gap-3"><span className="text-[#92E4BA]">✓</span> Granular enterprise permissions</li>
              </ul>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* 10. Technology Section */}
      <section className="py-20 bg-[#FAFAFA] border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider mb-8">Built on a modern stack</p>
          <div className="flex flex-wrap justify-center items-center gap-4">
            {['Next.js 15', 'TypeScript', 'Tailwind CSS', 'Prisma ORM', 'PostgreSQL', 'shadcn/ui', 'Framer Motion'].map((tech, i) => (
              <span key={i} className="px-4 py-2 bg-white border border-[#E5E7EB] rounded-full text-sm font-medium text-[#111827] shadow-sm hover:shadow-md transition-shadow cursor-default">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 11. Call To Action */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#92E4BA]/10"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <FadeIn>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[#111827] mb-6">
              Ready to modernize your asset management?
            </h2>
            <p className="text-xl text-[#6B7280] mb-10">
              Join the enterprises transforming their operations with AssetFlow.
            </p>
            <div className="flex justify-center items-center gap-4">
              <Link href="/login" className="bg-[#111827] text-white px-8 py-4 rounded-full font-semibold hover:bg-black transition-all hover:shadow-lg hover:-translate-y-1">
                Get Started for Free
              </Link>
              <Link href="https://github.com" target="_blank" className="bg-white border border-[#E5E7EB] text-[#111827] px-8 py-4 rounded-full font-semibold hover:bg-[#FAFAFA] transition-all hover:shadow-sm">
                View GitHub
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* 12. Footer */}
      <footer className="bg-white border-t border-[#E5E7EB] py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={20} className="text-[#92E4BA] fill-[#92E4BA]" />
              <span className="font-bold text-lg text-[#111827]">AssetFlow</span>
            </div>
            <p className="text-sm text-[#6B7280]">
              The modern standard for enterprise asset and resource management.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-[#111827]">Product</h4>
            <ul className="space-y-3 text-sm text-[#6B7280]">
              <li><a href="#" className="hover:text-[#111827] transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-[#111827] transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-[#111827] transition-colors">Integrations</a></li>
              <li><a href="#" className="hover:text-[#111827] transition-colors">Changelog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-[#111827]">Company</h4>
            <ul className="space-y-3 text-sm text-[#6B7280]">
              <li><a href="#" className="hover:text-[#111827] transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-[#111827] transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-[#111827] transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-[#111827] transition-colors">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-[#111827]">Legal</h4>
            <ul className="space-y-3 text-sm text-[#6B7280]">
              <li><a href="#" className="hover:text-[#111827] transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-[#111827] transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-[#111827] transition-colors">Security</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-[#E5E7EB] flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[#6B7280]">
          <p>© 2026 AssetFlow Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-[#111827]">Twitter</a>
            <a href="#" className="hover:text-[#111827]">LinkedIn</a>
            <a href="#" className="hover:text-[#111827]">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helper icon component for workflow
function PlusCircle(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10"/>
      <path d="M8 12h8"/>
      <path d="M12 8v8"/>
    </svg>
  );
}
