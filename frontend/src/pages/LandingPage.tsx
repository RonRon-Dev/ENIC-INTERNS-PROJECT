import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ArrowRight, ExternalLink, Mail, MapPin, Phone } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// ── Scroll Reveal Hook ────────────────────────────────────────────────────────

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

// ── Reveal Wrapper ────────────────────────────────────────────────────────────

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={cn("transition-all duration-700 ease-out", className)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : "translateY(20px)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ── Eyebrow ───────────────────────────────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="w-6 h-px bg-amber-500/70" />
      <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-amber-500/80">
        {children}
      </span>
    </div>
  );
}

// ── Section Title ─────────────────────────────────────────────────────────────

function SectionTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "font-serif text-3xl md:text-4xl font-semibold leading-[1.15] tracking-tight text-foreground",
        className
      )}
    >
      {children}
    </h2>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EurolinkPage() {
  return (
    <div className="min-h-screen bg-background text-foreground -mt-10 -mx-[100px]">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative min-h-[88vh] flex items-center px-16 py-24 overflow-hidden border-b border-border">
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        {/* Glow */}
        <div className="absolute top-[-200px] right-[-150px] w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-200px] left-[-100px] w-[500px] h-[500px] rounded-full bg-blue-500/4 blur-[120px] pointer-events-none" />

        <div className="relative max-w-2xl">
          {/* Eyebrow */}
          <div
            className="flex items-center gap-2.5 mb-7"
            style={{ animation: "fadeUp 0.8s ease 0.1s both" }}
          >
            <div className="w-8 h-px bg-amber-500" />
            <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-amber-500">
              Established 2002 · Pasig City, Philippines
            </span>
          </div>

          {/* Headline */}
          <h1
            className="font-serif text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.06] tracking-tight text-foreground mb-7"
            style={{ animation: "fadeUp 0.8s ease 0.25s both" }}
          >
            We Create.
            <br />
            We Innovate.
            <br />
            <span className="italic text-amber-400">We Succeed.</span>
          </h1>

          <p
            className="text-base font-light text-muted-foreground max-w-md leading-relaxed mb-10"
            style={{ animation: "fadeUp 0.8s ease 0.4s both" }}
          >
            Eurolink Network International Corporation delivers customized
            software, systems integration, and IT consultancy to government and
            private sector clients across the Philippines.
          </p>

          <div
            className="flex items-center gap-4"
            style={{ animation: "fadeUp 0.8s ease 0.55s both" }}
          >
            <a
              href="#services"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-background text-[11px] font-medium tracking-[0.1em] uppercase px-7 py-3.5 rounded-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(245,158,11,0.25)]"
            >
              Explore Services
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.1em] uppercase px-6 py-3.5 border rounded-sm text-muted-foreground hover:text-foreground hover:border-border/60 transition-all duration-200"
            >
              Get in Touch
            </a>
          </div>
        </div>

        {/* Stats */}
        <div
          className="absolute bottom-12 right-16 flex gap-12"
          style={{ animation: "fadeUp 0.8s ease 0.7s both" }}
        >
          {[
            { num: "20+", label: "Years Active" },
            { num: "12+", label: "Major Clients" },
            { num: "3", label: "Core Services" },
          ].map((s) => (
            <div key={s.label} className="text-right">
              <div className="font-serif text-4xl font-semibold text-amber-400 leading-none">
                {s.num}
              </div>
              <div className="text-[10px] tracking-[0.14em] uppercase text-muted-foreground/60 mt-1.5">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Services ─────────────────────────────────────────────── */}
      <section id="services" className="px-16 py-24 bg-muted/10">
        <div className="flex justify-between items-end mb-14 gap-10 flex-wrap">
          <div>
            <Reveal>
              <Eyebrow>Our Services</Eyebrow>
            </Reveal>
            <Reveal delay={100}>
              <SectionTitle>What We Deliver</SectionTitle>
            </Reveal>
          </div>
          <Reveal delay={200} className="max-w-sm">
            <p className="text-sm font-light text-muted-foreground leading-relaxed">
              Tailored IT solutions built to integrate seamlessly with your
              existing systems and scale with your business.
            </p>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 border border-border divide-x divide-border">
          {[
            {
              num: "01",
              name: "Software Development",
              desc: "We offer software solutions designed to seamlessly work with existing systems, built to your exact specifications.",
            },
            {
              num: "02",
              name: "System Integration",
              desc: "We use the latest technologies to create integrated systems customized to your needs, connecting platforms across your organization.",
            },
            {
              num: "03",
              name: "Business Consultancy",
              desc: "We offer consultancy services that can maximize your potential, providing strategic guidance and technology roadmaps.",
            },
          ].map((s, i) => (
            <Reveal key={s.num} delay={i * 100}>
              <div className="group relative p-10 md:p-12 overflow-hidden hover:bg-muted/20 transition-colors duration-300 h-full">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-amber-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                <div className="font-serif text-5xl font-bold text-amber-500/10 group-hover:text-amber-500/20 transition-colors leading-none mb-6">
                  {s.num}
                </div>
                <div className="text-[11px] font-medium tracking-[0.15em] uppercase text-foreground mb-3">
                  {s.name}
                </div>
                <p className="text-sm font-light text-muted-foreground leading-relaxed">
                  {s.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <Separator className="mx-16 opacity-50" />

      {/* ── Expertise ────────────────────────────────────────────── */}
      <section id="expertise" className="px-16 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-start">
          <div>
            <Reveal>
              <Eyebrow>Our Expertise</Eyebrow>
            </Reveal>
            <Reveal delay={100}>
              <SectionTitle className="mb-10">
                Deep Domain
                <br />
                Knowledge
              </SectionTitle>
            </Reveal>

            <div className="flex flex-col divide-y divide-border border-t border-border">
              {[
                {
                  name: "Smart Card Solutions",
                  desc: "E-Coupons, E-Vouchers, Loyalty and Rewards programs, and Smart Card-based transaction systems.",
                },
                {
                  name: "Healthcare Systems",
                  desc: "Electronic Claims Systems and Medical Records (EMR) platforms for healthcare institutions and government agencies.",
                },
                {
                  name: "Customer Relations",
                  desc: "Comprehensive Customer Care Support solutions designed to enhance client engagement and service delivery.",
                },
              ].map((e, i) => (
                <Reveal key={e.name} delay={i * 100}>
                  <div className="group flex gap-5 py-6 hover:pl-2 transition-all duration-200">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0 group-hover:scale-150 transition-transform" />
                    <div>
                      <div className="text-sm font-medium text-foreground mb-1.5 tracking-wide">
                        {e.name}
                      </div>
                      <p className="text-sm font-light text-muted-foreground leading-relaxed">
                        {e.desc}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <Reveal delay={200} className="sticky top-24">
            <div className="bg-muted/20 border border-border p-10 rounded-sm">
              <p className="font-serif text-xl font-semibold italic text-foreground leading-snug mb-5">
                Trusted by government agencies and{" "}
                <span className="text-amber-400">private sector</span> leaders
                across the Philippines.
              </p>
              <p className="text-sm font-light text-muted-foreground leading-relaxed mb-8">
                With a wide network of affiliates and global partners, we
                provide reliable solutions that have delivered proven results in
                both government and private sector engagements.
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Government",
                  "Healthcare",
                  "Finance",
                  "Smart Card",
                  "Transport",
                  "CRM",
                ].map((t) => (
                  <Badge
                    key={t}
                    variant="outline"
                    className="text-[10px] font-medium tracking-[0.1em] uppercase text-amber-500/70 border-amber-500/25 rounded-sm px-2.5 py-0.5"
                  >
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Separator className="mx-16 opacity-50" />

      {/* ── Involvements ─────────────────────────────────────────── */}
      <section id="involvements" className="px-16 py-24 bg-muted/10">
        <Reveal>
          <Eyebrow>Our Involvements</Eyebrow>
        </Reveal>
        <Reveal delay={100}>
          <SectionTitle className="mb-3">Key Projects</SectionTitle>
        </Reveal>
        <Reveal delay={200}>
          <p className="text-sm font-light text-muted-foreground mb-12 max-w-md leading-relaxed">
            Initiatives we've designed, built, and continue to operate across
            critical sectors.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            {
              tag: "Healthcare · PhilHealth",
              name: "Easy Claims",
              desc: "We designed and continue to handle the Easy Claims System used by PhilHealth to monitor and process their members' transactions nationwide.",
              href: "https://www.easyclaimsph.com/",
            },
            {
              tag: "Transport · Emission Testing",
              name: "PETC Network",
              desc: "We serve as the IT service provider for regulated private emission testing centers (PETC) across the Philippines, ensuring compliance and system reliability.",
              href: "#",
            },
          ].map((item, i) => (
            <Reveal key={item.name} delay={i * 100}>
              <a
                href={item.href}
                target={item.href !== "#" ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="group relative block bg-background border border-border hover:border-amber-500/25 p-10 transition-all duration-250 hover:-translate-y-1"
              >
                <ExternalLink className="absolute top-8 right-8 h-4 w-4 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-amber-500/70 mb-4 block">
                  {item.tag}
                </span>
                <div className="font-serif text-2xl font-semibold text-foreground mb-3 leading-snug">
                  {item.name}
                </div>
                <p className="text-sm font-light text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </a>
            </Reveal>
          ))}
        </div>
      </section>

      <Separator className="mx-16 opacity-50" />

      {/* ── Clients ──────────────────────────────────────────────── */}
      <section id="clients" className="px-16 py-24">
        <Reveal>
          <Eyebrow>Our Clients</Eyebrow>
        </Reveal>
        <Reveal delay={100}>
          <SectionTitle className="mb-3">Trusted Partners</SectionTitle>
        </Reveal>
        <Reveal delay={200}>
          <p className="text-sm font-light text-muted-foreground mb-12 max-w-md leading-relaxed">
            From government agencies to major financial institutions, we deliver
            results that earn long-term trust.
          </p>
        </Reveal>

        <div className="grid grid-cols-3 md:grid-cols-6 border border-border divide-x divide-y divide-border">
          {[
            "UNDP Philippines",
            "Bureau of Immigration",
            "DOTR",
            "LTO",
            "PhilHealth",
            "BIR",
            "SSS",
            "City of San Juan",
            "Metrobank",
            "Blue Cross PH",
            "Uni-Orient",
            "BSP",
          ].map((client, i) => (
            <Reveal key={client} delay={(i % 6) * 60}>
              <div className="group flex items-center justify-center p-6 hover:bg-muted/20 transition-colors duration-200 h-full min-h-[72px]">
                <span className="text-[10px] font-medium tracking-[0.1em] uppercase text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors text-center leading-relaxed">
                  {client}
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <Separator className="mx-16 opacity-50" />

      {/* ── About ────────────────────────────────────────────────── */}
      <section id="about" className="px-16 py-24 bg-muted/10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-start">
          <div>
            <Reveal>
              <Eyebrow>About Us</Eyebrow>
            </Reveal>
            <Reveal delay={100}>
              <SectionTitle className="mb-10">Who We Are</SectionTitle>
            </Reveal>

            <div className="flex flex-col gap-5">
              {[
                {
                  label: "Vision",
                  text: "We envision ourselves to be a leading IT company who understands the future trends and provides practical solutions to bring a positive impact to society.",
                },
                {
                  label: "Mission",
                  text: "We aim to harness human potentials by empowering individuals and cultivating teamwork among employees to produce an ideal IT-based environment for clients and stakeholders.",
                },
              ].map((vm, i) => (
                <Reveal key={vm.label} delay={i * 100}>
                  <div className="bg-background border border-border border-l-2 border-l-amber-500 pl-6 pr-6 py-6 rounded-r-sm">
                    <div className="text-[10px] font-medium tracking-[0.2em] uppercase text-amber-500 mb-2.5">
                      {vm.label}
                    </div>
                    <p className="text-sm font-light text-muted-foreground leading-relaxed">
                      {vm.text}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <Reveal delay={200} className="pt-0 md:pt-14">
            <blockquote className="relative pl-5 mb-7 border-l-2 border-amber-500">
              <p className="font-serif text-xl font-semibold italic text-foreground leading-snug">
                "Our proven track record, technical expertise, and skilled
                professionals will guarantee you and your business success."
              </p>
            </blockquote>
            <p className="text-sm font-light text-muted-foreground leading-relaxed mb-8">
              Eurolink Network International Corporation is an information
              technology solution provider based in Pasig City, Philippines.
              Established in 2002, our services include software development,
              business solution integration, and IT consultancy.
              <br />
              <br />
              With a wide network of affiliates and global partners, we provide
              customized and reliable solutions in both government and private
              sector — here in the Philippines and overseas.
            </p>
            <div className="inline-flex items-center gap-3 border border-border px-4 py-3 text-[10px] tracking-[0.15em] uppercase text-muted-foreground/50">
              <span className="text-amber-500">Est. 2002</span>· Pasig City,
              Philippines · IT Solutions Provider
            </div>
          </Reveal>
        </div>
      </section>

      <Separator className="mx-16 opacity-50" />

      {/* ── Contact ──────────────────────────────────────────────── */}
      <section id="contact" className="px-16 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-start">
          <div>
            <Reveal>
              <Eyebrow>Contact Us</Eyebrow>
            </Reveal>
            <Reveal delay={100}>
              <SectionTitle className="mb-3">Let's Work Together</SectionTitle>
            </Reveal>
            <Reveal delay={200}>
              <p className="text-sm font-light text-muted-foreground mb-10 max-w-sm leading-relaxed">
                Have a project in mind or need IT consultancy? Reach out and
                we'll get back to you promptly.
              </p>
            </Reveal>

            <div className="flex flex-col gap-7">
              {[
                {
                  icon: MapPin,
                  label: "Address",
                  value:
                    "Suite 2101 East Tektite Tower\nPhilippine Stock Exchange Building\nExchange Road, Ortigas, Pasig City",
                },
                { icon: Phone, label: "Phone", value: "(02) 687 9999" },
                {
                  icon: Mail,
                  label: "Email",
                  value: "eurolink.website@gmail.com",
                },
              ].map((c, i) => (
                <Reveal key={c.label} delay={i * 80}>
                  <div className="flex gap-4">
                    <c.icon className="h-4 w-4 text-amber-500/60 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-[10px] font-medium tracking-[0.18em] uppercase text-amber-500/70 mb-1">
                        {c.label}
                      </div>
                      <p className="text-sm font-light text-muted-foreground whitespace-pre-line leading-relaxed">
                        {c.value}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <Reveal delay={150}>
            <div className="bg-muted/10 border p-10">
              <div className="font-serif text-xl font-semibold text-foreground mb-7">
                Send a Message
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-medium tracking-[0.12em] uppercase text-muted-foreground">
                    First Name
                  </label>
                  <Input
                    placeholder="Juan"
                    className="bg-background border-border text-sm font-light rounded-sm h-10"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-medium tracking-[0.12em] uppercase text-muted-foreground">
                    Last Name
                  </label>
                  <Input
                    placeholder="dela Cruz"
                    className="bg-background border-border text-sm font-light rounded-sm h-10"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5 mb-4">
                <label className="text-[10px] font-medium tracking-[0.12em] uppercase text-muted-foreground">
                  Email
                </label>
                <Input
                  placeholder="you@company.com"
                  className="bg-background border-border text-sm font-light rounded-sm h-10"
                />
              </div>
              <div className="flex flex-col gap-1.5 mb-6">
                <label className="text-[10px] font-medium tracking-[0.12em] uppercase text-muted-foreground">
                  Message
                </label>
                <Textarea
                  placeholder="Tell us about your project or inquiry..."
                  className="bg-background border-border text-sm font-light rounded-sm min-h-[110px] resize-none"
                />
              </div>
              <Button className="w-full bg-amber-500 hover:bg-amber-400 text-background text-[11px] font-medium tracking-[0.1em] uppercase rounded-sm h-11">
                Send Message
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="px-16 py-8 border-t border-border flex items-center justify-between flex-wrap gap-4 bg-muted/5">
        <div className="font-serif text-sm font-medium text-muted-foreground">
          Eurolink <span className="text-amber-500">Network</span> International
          Corporation
        </div>
        <div className="flex gap-5 flex-wrap">
          {[
            "Privacy Policy",
            "Terms & Conditions",
            "Cookie Policy",
            "Data Privacy Manual",
          ].map((l) => (
            <a
              key={l}
              href="#"
              className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
            >
              {l}
            </a>
          ))}
        </div>
        <div className="text-[11px] text-muted-foreground/30">
          © 2026 Eurolink Network International Corporation
        </div>
      </footer>

      {/* ── Animation keyframes ───────────────────────────────────── */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
}
