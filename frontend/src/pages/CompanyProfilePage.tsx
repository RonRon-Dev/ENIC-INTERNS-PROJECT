import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, ExternalLink, Mail, MapPin, Phone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  email: z.string().min(1, 'Email is required.').email('Enter a valid email.'),
  message: z.string().min(10, 'Message must be at least 10 characters.'),
})

type ContactFormValues = z.infer<typeof formSchema>
// ── Types ─────────────────────────────────────────────────────────────────────

type ContactInfo = { icon: React.ElementType; label: string; value: string }
type ServiceItem = { num: string; name: string; desc: string }
type ExpertiseItem = { name: string; desc: string }
type InvolvementItem = { tag: string; name: string; desc: string; href: string }
type VisionMissionItem = { label: string; text: string }
type StatItem = { num: string; label: string }

// ── Static Data ───────────────────────────────────────────────────────────────

const STATS: StatItem[] = [
  { num: "20+", label: "Years Active" },
  { num: "12+", label: "Major Clients" },
  { num: "3", label: "Core Services" },
]

const SERVICES: ServiceItem[] = [
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
]

const EXPERTISE: ExpertiseItem[] = [
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
]

const EXPERTISE_TAGS = ["Government", "Healthcare", "Finance", "Smart Card", "Transport", "CRM"]

const INVOLVEMENTS: InvolvementItem[] = [
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
]

const CLIENTS = [
  "UNDP Philippines", "Bureau of Immigration", "DOTR", "LTO",
  "PhilHealth", "BIR", "SSS", "City of San Juan",
  "Metrobank", "Blue Cross PH", "Uni-Orient", "BSP",
]

const VISION_MISSION: VisionMissionItem[] = [
  {
    label: "Vision",
    text: "We envision ourselves to be a leading IT company who understands the future trends and provides practical solutions to bring a positive impact to society.",
  },
  {
    label: "Mission",
    text: "We aim to harness human potentials by empowering individuals and cultivating teamwork among employees to produce an ideal IT-based environment for clients and stakeholders.",
  },
]

const CONTACT_INFO: ContactInfo[] = [
  {
    icon: MapPin,
    label: "Address",
    value: "Suite 2101 East Tektite Tower\nPhilippine Stock Exchange Building\nExchange Road, Ortigas, Pasig City",
  },
  { icon: Phone, label: "Phone", value: "(02) 687 9999" },
  { icon: Mail, label: "Email", value: "eurolink.website@gmail.com" },
]

const FOOTER_LINKS = ["Privacy Policy", "Terms & Conditions", "Cookie Policy", "Data Privacy Manual"]

const NAV_LINKS = [
  { label: "Services", href: "#services" },
  { label: "Expertise", href: "#expertise" },
  { label: "Involvements", href: "#involvements" },
  { label: "Clients", href: "#clients" },
  { label: "About Us", href: "#about" },
  { label: "Contact Us", href: "#contact" },
]


// ── Hooks ─────────────────────────────────────────────────────────────────────

function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.unobserve(el)
        }
      },
      { threshold: 0.12 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { ref, visible }
}

// ── Primitives ────────────────────────────────────────────────────────────────

function Reveal({ children, delay = 0, className }: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const { ref, visible } = useReveal()
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
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="w-6 h-px bg-[#0e4888]/70" />
      <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-[#0e4888]/80">
        {children}
      </span>
    </div>
  )
}

function SectionTitle({ children, className }: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <h2 className={cn("font-serif text-3xl md:text-4xl font-semibold leading-[1.15] tracking-tight text-black", className)}>
      {children}
    </h2>
  )
}

function Section({ id, className, children }: {
  id?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className={cn("px-16 py-24", className)}>
      {children}
    </section>
  )
}

function SectionHeader({ eyebrow, title, desc }: {
  eyebrow: string
  title: React.ReactNode
  desc?: string
}) {
  return (
    <>
      <Reveal><Eyebrow>{eyebrow}</Eyebrow></Reveal>
      <Reveal delay={100}><SectionTitle className="mb-3">{title}</SectionTitle></Reveal>
      {desc && (
        <Reveal delay={200}>
          <p className="text-sm font-light text-black mb-12 max-w-md leading-relaxed">{desc}</p>
        </Reveal>
      )}
    </>
  )
}

function ContactItem({ icon: Icon, label, value }: ContactInfo) {
  return (
    <div className="flex gap-4">
      <Icon className="h-4 w-4 text-[#0e4888]/60 mt-0.5 shrink-0" />
      <div>
        <div className="text-[10px] font-medium tracking-[0.18em] uppercase text-[#0e4888]/70 mb-1">
          {label}
        </div>
        <p className="text-sm font-light text-black whitespace-pre-line leading-relaxed">
          {value}
        </p>
      </div>
    </div>
  )
}

// ── Sections ──────────────────────────────────────────────────────────────────

function NavBar() {
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState("")

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    const ids = NAV_LINKS.map((l) => l.href.replace("#", ""))
    const observers: IntersectionObserver[] = []

    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(id) },
        { threshold: 0.6 }
      )
      obs.observe(el)
      observers.push(obs)
    })

    return () => observers.forEach((o) => o.disconnect())
  }, [])

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-4",
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm h-20"
          : "bg-transparent h-24"
      )}
    >

      <div className="px-56 flex items-center justify-between">
        {/* Logo */}
        <a href="/profile" className={cn("transition-all duration-300", scrolled ? "h-14" : "h-20") + " items-center"}>
          <img src="company-profile/eurolinklogo.png" className="h-full w-auto" alt="eurolink logo" />
        </a>

        {/* Links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const id = link.href.replace("#", "")
            const isActive = active === id
            const isContact = link.label === "Contact Us"
            return isContact ? (
              <a
                key={link.href}
                href={link.href}
                className="ml-3 inline-flex items-center gap-1.5 bg-[#0e4888] hover:bg-[#1a5fa0] text-white text-[10px] font-medium tracking-[0.12em] uppercase px-5 py-2.5 rounded-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(14,72,136,0.3)]"
              >
                {link.label}
              </a>
            ) : (
              <a
                key={link.href}
                href={link.href}
                className={cn(
                  "relative px-4 py-2 text-[10px] font-medium tracking-[0.12em] uppercase transition-colors duration-200",
                  isActive
                    ? "text-[#0e4888]"
                    : "text-black hover:text-black text-black"
                )}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-4 right-4 h-px bg-[#0e4888]" />
                )}
              </a>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

function HeroSection() {
  return (
    <section className="relative min-h-[88vh] flex items-center overflow-hidden px-[15%]">
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      {/* Glows */}
      <div className="absolute top-[-200px] right-[-150px] w-[600px] h-[600px] rounded-full bg-[#0e4888]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-200px] left-[-100px] w-[500px] h-[500px] rounded-full bg-[#0e4888]/4 blur-[120px] pointer-events-none" />

      <div className="relative w-full">
        <div className="flex items-center gap-2.5 mb-7" style={{ animation: "fadeUp 0.8s ease 0.1s both" }}>
          <div className="w-8 h-px bg-[#0e4888]" />
          <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-[#0e4888]">
            Established 2002 · Pasig City, Philippines
          </span>
        </div>

        <h1
          className="font-serif text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.06] tracking-tight text-black mb-7"
          style={{ animation: "fadeUp 0.8s ease 0.25s both" }}
        >
          We Create.
          <br />
          We Innovate.
          <br />
          <span className="italic text-[#1a5fa0]">We Succeed.</span>
        </h1>

        <p
          className="text-base font-light text-black max-w-md leading-relaxed mb-10"
          style={{ animation: "fadeUp 0.8s ease 0.4s both" }}
        >
          Eurolink Network International Corporation delivers customized software, systems
          integration, and IT consultancy to government and private sector clients across the Philippines.
        </p>

        <div className="flex items-center gap-4" style={{ animation: "fadeUp 0.8s ease 0.55s both" }}>
          <a
            href="#services"
            className="inline-flex items-center gap-2 bg-[#0e4888] hover:bg-[#1a5fa0] text-white text-[11px] font-medium tracking-[0.1em] uppercase px-7 py-3.5 rounded-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(14,72,136,0.25)]
"
          >
            Explore Services
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.1em] uppercase px-6 py-3.5 border rounded-sm text-black text-black hover:border-border/60 transition-all duration-200"
          >
            Get in Touch
          </a>
        </div>
      </div>

      <div
        className="flex flex-col gap-10 w-full flex-end justify-between h-full items-center"
        style={{ animation: "fadeUp 0.8s ease 0.7s both" }}
      >
        <div>
          <img src="company-profile/images/1.jpg" className="h-84 w-auto rounded-lg" alt="eurolink logo" />
        </div>
        <div className="flex gap-12">
          {STATS.map((s) => (
            <div key={s.label} className="text-right">
              <div className="font-serif text-4xl font-semibold text-[#1a5fa0] leading-none">{s.num}</div>
              <div className="text-[10px] tracking-[0.14em] uppercase text-black/60 mt-1.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ServicesSection() {
  return (
    <Section id="services">
      <div className="flex justify-between items-end mb-14 gap-10 flex-wrap">
        <div>
          <Reveal><Eyebrow>Our Services</Eyebrow></Reveal>
          <Reveal delay={100}><SectionTitle>What We Deliver</SectionTitle></Reveal>
        </div>
        <Reveal delay={200} className="max-w-sm">
          <p className="text-sm font-light text-black leading-relaxed">
            Tailored IT solutions built to integrate seamlessly with your existing systems and scale with your business.
          </p>
        </Reveal>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 border border-border divide-x divide-border">
        {SERVICES.map((s, i) => (
          <Reveal key={s.num} delay={i * 100}>
            <div className="group relative p-10 md:p-12 overflow-hidden hover:bg-muted/20 transition-colors duration-300 h-full bg-white">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#0e4888] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              <div className="font-serif text-5xl font-bold text-[#0e4888] group-hover:text-[#0e4888]/60 transition-colors leading-none mb-6">
                {s.num}
              </div>
              <div className="text-[11px] font-medium tracking-[0.15em] uppercase text-black mb-3">{s.name}</div>
              <p className="text-sm font-light text-black leading-relaxed">{s.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}

function ExpertiseSection() {
  return (
    <Section id="expertise">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-start">
        <div>
          <Reveal><Eyebrow>Our Expertise</Eyebrow></Reveal>
          <Reveal delay={100}>
            <SectionTitle className="mb-10">Deep Domain<br />Knowledge</SectionTitle>
          </Reveal>

          <div className="flex flex-col divide-y divide-border border-t border-border">
            {EXPERTISE.map((e, i) => (
              <Reveal key={e.name} delay={i * 100}>
                <div className="group flex gap-5 py-6 hover:pl-2 transition-all duration-200">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#0e4888] mt-2 shrink-0 group-hover:scale-150 transition-transform" />
                  <div>
                    <div className="text-sm font-medium text-black mb-1.5 tracking-wide">{e.name}</div>
                    <p className="text-sm font-light text-black leading-relaxed">{e.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal delay={200} className="sticky top-24">
          <div className="bg-muted/20 border border-border p-10 rounded-sm">
            <p className="font-serif text-xl font-semibold italic text-black leading-snug mb-5">
              Trusted by government agencies and{" "}
              <span className="text-[#1a5fa0]">private sector</span> leaders across the Philippines.
            </p>
            <p className="text-sm font-light text-black leading-relaxed mb-8">
              With a wide network of affiliates and global partners, we provide reliable solutions
              that have delivered proven results in both government and private sector engagements.
            </p>
            <div className="flex flex-wrap gap-2">
              {EXPERTISE_TAGS.map((t) => (
                <Badge
                  key={t}
                  variant="outline"
                  className="text-[10px] font-medium tracking-[0.1em] uppercase text-[#0e4888]/70 border-[#0e4888]/25 rounded-sm px-2.5 py-0.5"
                >
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  )
}

function InvolvementsSection() {
  return (
    <Section id="involvements" className="bg-muted/10">
      <SectionHeader
        eyebrow="Our Involvements"
        title="Key Projects"
        desc="Initiatives we've designed, built, and continue to operate across critical sectors."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {INVOLVEMENTS.map((item, i) => (
          <Reveal key={item.name} delay={i * 100}>
            <a
              href={item.href}
              target={item.href !== "#" ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="group relative block bg-white border border-border hover:border-[#0e4888]/25 p-10 transition-all duration-250 hover:-translate-y-1"
            >
              <ExternalLink className="absolute top-8 right-8 h-4 w-4 text-[#0e4888] opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-[#0e4888]/70 mb-4 block">
                {item.tag}
              </span>
              <div className="font-serif text-2xl font-semibold text-black mb-3 leading-snug">{item.name}</div>
              <p className="text-sm font-light text-black leading-relaxed">{item.desc}</p>
            </a>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}

function ClientsSection() {
  return (
    <Section id="clients">
      <SectionHeader
        eyebrow="Our Clients"
        title="Trusted Partners"
        desc="From government agencies to major financial institutions, we deliver results that earn long-term trust."
      />
      <div className="grid grid-cols-3 md:grid-cols-6 border border-border divide-x divide-y divide-border">
        {CLIENTS.map((client, i) => (
          <Reveal key={client} delay={(i % 6) * 60}>
            <div className="group flex items-center justify-center p-6 hover:bg-muted/20 transition-colors duration-200 h-full min-h-[72px]">
              <span className="text-[10px] font-medium tracking-[0.1em] uppercase text-black/40 group-hover:text-black/70 transition-colors text-center leading-relaxed">
                {client}
              </span>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}

function AboutSection() {
  return (
    <Section id="about" className="bg-muted/10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-start">
        <div>
          <Reveal><Eyebrow>About Us</Eyebrow></Reveal>
          <Reveal delay={100}><SectionTitle className="mb-10">Who We Are</SectionTitle></Reveal>
          <div className="flex flex-col gap-5">
            {VISION_MISSION.map((vm, i) => (
              <Reveal key={vm.label} delay={i * 100}>
                <div className="bg-white border border-border border-l-2 border-l-[#0e4888] pl-6 pr-6 py-6 rounded-r-sm">
                  <div className="text-[10px] font-medium tracking-[0.2em] uppercase text-[#0e4888] mb-2.5">{vm.label}</div>
                  <p className="text-sm font-light text-black leading-relaxed">{vm.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal delay={200} className="pt-0 md:pt-14">
          <blockquote className="relative pl-5 mb-7 border-l-2 border-[#0e4888]">
            <p className="font-serif text-xl font-semibold italic text-black leading-snug">
              "Our proven track record, technical expertise, and skilled professionals will guarantee you and your business success."
            </p>
          </blockquote>
          <p className="text-sm font-light text-black leading-relaxed mb-8">
            Eurolink Network International Corporation is an information technology solution provider based in Pasig City, Philippines.
            Established in 2002, our services include software development, business solution integration, and IT consultancy.
            <br /><br />
            With a wide network of affiliates and global partners, we provide customized and reliable solutions in both government
            and private sector — here in the Philippines and overseas.
          </p>
          <div className="inline-flex items-center gap-3 border border-border px-4 py-3 text-[10px] tracking-[0.15em] uppercase text-black/50">
            <span className="text-[#0e4888]">Est. 2002</span>· Pasig City, Philippines · IT Solutions Provider
          </div>
        </Reveal>
      </div>
    </Section>
  )
}

function ContactForm() {
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { firstName: '', lastName: '', email: '', message: '' },
  })

  const onSubmit = (values: ContactFormValues) => {
    console.log(values)
    // TODO: wire up to API / email service
  }

  return (
    <div className="bg-muted/10 border p-10">
      <div className="font-serif text-xl font-semibold text-black mb-7">Send a Message</div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-medium tracking-[0.12em] uppercase text-black">
                    First Name
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Juan" className="rounded-sm h-10 text-black bg-white" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-medium tracking-[0.12em] uppercase text-black">
                    Last Name
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="dela Cruz" className="rounded-sm h-10 text-black bg-white" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-medium tracking-[0.12em] uppercase text-black">
                  Email
                </FormLabel>
                <FormControl>
                  <Input placeholder="you@company.com" className="rounded-sm h-10 text-black bg-white" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-medium tracking-[0.12em] uppercase text-black">
                  Message
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us about your project or inquiry..."
                    className="rounded-sm min-h-[110px] resize-none text-black bg-white"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full bg-[#0e4888] hover:bg-[#1a5fa0] text-white text-[11px] font-medium tracking-[0.1em] uppercase rounded-sm h-11"
          >
            Send Message
          </Button>
        </form>
      </Form>
    </div>
  )
}


function ContactSection() {
  return (
    <Section id="contact">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-start">
        <div>
          <Reveal><Eyebrow>Contact Us</Eyebrow></Reveal>
          <Reveal delay={100}><SectionTitle className="mb-3">Let's Work Together</SectionTitle></Reveal>
          <Reveal delay={200}>
            <p className="text-sm font-light text-black mb-10 max-w-sm leading-relaxed">
              Have a project in mind or need IT consultancy? Reach out and we'll get back to you promptly.
            </p>
          </Reveal>
          <div className="flex flex-col gap-7">
            {CONTACT_INFO.map((c, i) => (
              <Reveal key={c.label} delay={i * 80}>
                <ContactItem {...c} />
              </Reveal>
            ))}
          </div>
        </div>
        <Reveal delay={150}>
          <ContactForm />
        </Reveal>
      </div>
    </Section>
  )
}

function FooterSection() {
  return (
    <footer className="px-16 py-8 flex flex-col items-center gap-2 justify-between flex-wrap bg-[#0e4888]">
      {/* <div className="font-serif text-sm font-medium text-black">
        Eurolink <span className="text-[#0e4888]">Network</span> International Corporation
      </div> */}
      <div className="flex gap-5 flex-wrap">
        {FOOTER_LINKS.map((l) => (
          <a
            key={l}
            href="#"
            className="text-xs tracking-[0.1em] uppercase text-white hover:text-white/80 transition-colors"
          >
            {l}
          </a>
        ))}
      </div>
      <div className="text-[10px] text-white/80">
        © 2026 Eurolink Network International Corporation
      </div>
    </footer>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EurolinkPage() {
  return (
    <div className="bg-white">
      <title>Eurolink Network International Corporation</title>
      <div >
        <NavBar />
        <HeroSection />
      </div>

      <div className="min-h-screen flex flex-col px-56">
        <ServicesSection />
        <Separator className="opacity-50" />
        <ExpertiseSection />
        <Separator className="opacity-50" />
        <InvolvementsSection />
        <Separator className="opacity-50" />
        <ClientsSection />
        <Separator className="opacity-50" />
        <AboutSection />
        <Separator className="opacity-50" />
        <ContactSection />
        <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: none; }
        }
      `}</style>
      </div>
      <FooterSection />

    </div>
  )
}