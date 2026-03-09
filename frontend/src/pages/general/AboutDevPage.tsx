import { useEffect, useRef, useState } from "react";
import { Github, ExternalLink, Mail, User, Briefcase } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Types

type Contributor = {
  name: string;
  role: string;
  bio: string;
  initials: string;
  github?: string;
  email: string;
  age: number;
  photo: string;
};

type TechCategory = "Frontend" | "Backend" | "DevOps" | "Security";

type TechItem = {
  name: string;
  category: TechCategory;
};

// Data

const contributors: Contributor[] = [
  {
    name: "Justine Lloyd Bautista",
    role: "Lead UI/UX & Frontend Developer",
    bio: "Led the overall UI/UX design and frontend architecture. Built the base component system, design language, and most of the interface from the ground up.",
    initials: "JB",
    github: "https://github.com/AgustinUno",
    email: "justinelloydgbautista.pupsj@email.com",
    age: 22,
    photo: "/developers/justine.png",
  },
  {
    name: "Mark Jason Fulguerinas",
    role: "UI Designer & Frontend Developer",
    bio: "Contributed to the UI design, optimized existing components, and added key features on top of the established frontend foundation.",
    initials: "MK",
    github: "https://github.com/pulge",
    email: "fulguerinasmarkjason0311@gmail.com",
    age: 22,
    photo: "/developers/mark.png",
  },
  {
    name: "Charles Ezra Ilarde",
    role: "Lead Backend Developer",
    bio: "Led backend development, designed the server architecture, business logic, and core API infrastructure powering the system.",
    initials: "CH",
    github: "https://github.com/1101101011",
    email: "charlesezrailarde@gmail.com",
    age: 22,
    photo: "/developers/charles.png",
  },
  {
    name: "Regie San Juan",
    role: "Lead API Developer & Backend",
    bio: "Led API design and integration, and contributed significantly to backend development alongside Charles.",
    initials: "RG",
    github: "https://github.com/RegieSanJuan",
    email: "sanjuanregie@gmail.com",
    age: 22,
    photo: "/developers/regie.png",
  },
];

const techStack: TechItem[] = [
  { name: "React 19", category: "Frontend" },
  { name: "TypeScript", category: "Frontend" },
  { name: "Tailwind CSS", category: "Frontend" },
  { name: "Vite", category: "Frontend" },
  { name: "shadcn/ui", category: "Frontend" },
  { name: "ASP.NET Core 10", category: "Backend" },
  { name: "Entity Framework", category: "Backend" },
  { name: "SQL Server", category: "Backend" },
  { name: "Docker", category: "DevOps" },
  { name: "JWT Auth", category: "Security" },
];

const categoryColor: Record<TechCategory, string> = {
  Frontend:
    "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  Backend:
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  DevOps:
    "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  Security:
    "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
};

// Dot cursor

function DotCursor() {
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const style = document.createElement("style");
    style.id = "dot-cursor-override";
    style.textContent = "* { cursor: none !important; }";
    document.head.appendChild(style);

    const dot = dotRef.current;
    if (!dot) return;
    let x = 0,
      y = 0;
    let raf: number;
    const onMove = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
    };
    const tick = () => {
      dot.style.transform = `translate(${x}px, ${y}px)`;
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
      document.getElementById("dot-cursor-override")?.remove();
    };
  }, []);

  return (
    <div
      ref={dotRef}
      className="pointer-events-none fixed top-0 left-0 z-[99999] w-2.5 h-2.5 rounded-full bg-foreground/60 -translate-x-1/2 -translate-y-1/2"
      style={{ willChange: "transform" }}
    />
  );
}

// FadeIn

function FadeIn({
  delay = 0,
  className,
  children,
}: {
  delay?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// Counter

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const step = Math.ceil(to / (1200 / 16));
          const timer = setInterval(() => {
            start += step;
            if (start >= to) {
              setCount(to);
              clearInterval(timer);
            } else setCount(start);
          }, 16);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [to]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

// Flip Card

function ContributorCard({
  person,
  index,
}: {
  person: Contributor;
  index: number;
}) {
  const [flipped, setFlipped] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    setFlipped(true);
  };

  const handleMouseLeave = () => {
    leaveTimer.current = setTimeout(() => setFlipped(false), 100);
  };

  const avatarSrc = person.photo;

  return (
    <div
      className="relative"
      style={{ perspective: "1000px" }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Flip container */}
      <div
        style={{
          transformStyle: "preserve-3d",
          transition: "transform 0.55s cubic-bezier(0.4, 0.2, 0.2, 1)",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          aspectRatio: "4/5",
          position: "relative",
        }}
      >
        {/* FRONT - photo */}
        <div
          className="absolute inset-0 rounded-xl border border-border bg-card overflow-hidden"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          {/* Photo or initials fallback */}
          <div className="relative w-full h-full bg-muted">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={person.name}
                className="w-full h-full object-cover object-top"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-4xl font-bold text-muted-foreground/40 select-none tracking-widest">
                  {person.initials}
                </span>
              </div>
            )}
            {/* Number badge */}
            <span className="absolute top-2.5 left-2.5 h-5 w-5 rounded-full bg-background/80 backdrop-blur-sm border text-[9px] font-bold flex items-center justify-center text-muted-foreground">
              {index + 1}
            </span>
            {/* Name overlay at bottom */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-3.5 pt-8 pb-3">
              <p className="text-white text-sm font-semibold leading-tight">
                {person.name}
              </p>
              <p className="text-white/70 text-[11px] mt-0.5 leading-tight line-clamp-1">
                {person.role}
              </p>
            </div>
          </div>
        </div>

        {/* BACK - details */}
        <div
          className="absolute inset-0 rounded-xl border border-border bg-card overflow-hidden flex flex-col"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className="flex flex-col gap-3 px-4 pt-4 pb-4 h-full overflow-y-auto">
            {/* Name + role */}
            <div>
              <p className="text-sm font-semibold leading-tight">
                {person.name}
              </p>
              <Badge
                variant="secondary"
                className="mt-1.5 text-[10px] font-normal rounded-md gap-1"
              >
                <Briefcase className="h-2.5 w-2.5" />
                {person.role}
              </Badge>
            </div>

            <Separator />

            {/* Fields */}
            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-medium leading-none mb-0.5">
                    Email
                  </p>
                  <p className="text-xs font-mono text-foreground break-all">
                    {person.email}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <User className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-medium leading-none mb-0.5">
                    Age
                  </p>
                  <p className="text-xs text-foreground">
                    {person.age} years old
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Bio */}
            <p className="text-[11px] text-muted-foreground leading-relaxed italic flex-1">
              "{person.bio}"
            </p>

            {/* GitHub */}
            {person.github && (
              <a
                href={person.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg border bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-[11px] font-mono mt-auto shrink-0"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              >
                <Github className="h-3 w-3" />
                {person.github.replace("https://github.com/", "@")}
                <ExternalLink className="h-2.5 w-2.5 opacity-40" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Page

export default function AboutDevPage() {
  return (
    <div className="flex flex-col gap-8 pb-20 relative">
      <DotCursor />

      {/* Hero */}
      <FadeIn delay={0} className="space-y-5 pt-4">
        <div className="space-y-3">
          <h1 className="text-5xl font-bold tracking-tight leading-none">
            Built by interns.
            <br />
            <span className="text-muted-foreground/50">
              Shipped for everyone.
            </span>
          </h1>
          <p className="text-base text-muted-foreground max-w-2xl leading-relaxed">
            The ENIC Management Information System was designed and developed
            entirely by a team of four interns, from database architecture to
            pixel-perfect UI. This is our work.
          </p>
        </div>
      </FadeIn>

      {/* Stats */}
      <FadeIn delay={100}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px border rounded-xl overflow-hidden bg-border">
          {[
            { label: "Developers", value: 4, suffix: "" },
            { label: "Tech Stack", value: techStack.length, suffix: "+" },
            { label: "Weeks Built", value: 12, suffix: "" },
            { label: "Commits", value: 300, suffix: "+" },
          ].map((stat, i) => (
            <div key={i} className="bg-card px-6 py-5 flex flex-col gap-1 text-center">
              <span className="text-3xl font-bold tabular-nums tracking-tight">
                <Counter to={stat.value} suffix={stat.suffix} />
              </span>
              <span className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </FadeIn>

      {/* <Separator /> */}

      {/* Team */}
      <FadeIn delay={200} className="space-y-8">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">The Original Contributors</h2>
          <p className="text-sm text-muted-foreground">
            Hover any card to meet the developer.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {contributors.map((person, i) => (
            <ContributorCard key={i} person={person} index={i} />
          ))}
        </div>
      </FadeIn>

      <Separator />

      {/* Tech Stack */}
      <FadeIn delay={300} className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Tech Stack</h2>
          <p className="text-sm text-muted-foreground">
            The tools and technologies powering ENIC MIS.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {techStack.map((tech, i) => (
            <span
              key={i}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium",
                categoryColor[tech.category]
              )}
            >
              {tech.name}
            </span>
          ))}
        </div>
      </FadeIn>

      <Separator />

      {/* Footer */}
      <FadeIn delay={400} className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">
          Developed as part of the internship program at Eurolink Network
          International Corporation.
        </p>
        <p className="text-xs text-muted-foreground/50">
          {"\u00A9"} {new Date().getFullYear()} ENIC MIS. All rights reserved.
        </p>
      </FadeIn>
    </div>
  );
}
