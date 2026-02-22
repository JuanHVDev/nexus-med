"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Calendar, Activity, Shield, Users, CheckCircle2, Stethoscope, FileText } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRef } from "react";

export function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-serif text-lg font-bold">
              H
            </div>
            <span className="text-xl font-serif font-medium tracking-tight">HC Gestor</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" passHref>
              <Button variant="ghost" className="font-medium text-muted-foreground hover:text-foreground">
                Iniciar Sesión
              </Button>
            </Link>
            <Link href="/register" passHref>
              <Button className="font-medium px-6 shadow-soft-sm hover:shadow-soft-md transition-all duration-300">
                Registrarse
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={containerRef} className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[40rem] h-[40rem] rounded-full bg-primary/5 blur-[100px] animate-pulse-slow" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[35rem] h-[35rem] rounded-full bg-secondary/30 blur-[100px] animate-pulse-slow delay-1000" />
        </div>

        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-6 max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/60 bg-secondary/20 text-secondary-foreground text-sm font-medium mb-4 backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
              La evolución de la gestión médica
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-light tracking-tight leading-[1.1] text-foreground">
              Salud con <span className="text-primary italic">Propósito</span>.
              <br />
              Gestión sin <span className="text-muted-foreground/80 decoration-wavy underline decoration-primary/30">Límites</span>.
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Una plataforma unificada que conecta a profesionales de la salud con sus pacientes. 
              Historia clínica digital, telemedicina y gestión administrativa en un solo lugar.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <Link href="/register?role=doctor">
                <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-soft-md hover:shadow-soft-lg hover:scale-105 transition-all duration-300 group">
                  Soy Especialista
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/patient-portal/register">
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-2 hover:bg-secondary/20 hover:text-foreground transition-all duration-300">
                  Soy Paciente
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Hero Visual */}
          <motion.div 
            style={{ y, opacity }}
            className="mt-20 relative mx-auto max-w-5xl rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm shadow-soft-xl overflow-hidden aspect-[16/9] md:aspect-[21/9] flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-transparent to-background/80 z-10" />
            <div className="grid grid-cols-3 gap-4 p-8 w-full h-full opacity-60">
              {/* Abstract UI representation */}
              <div className="col-span-1 space-y-4 pt-12">
                <div className="h-32 w-full rounded-lg bg-muted animate-pulse" />
                <div className="h-24 w-full rounded-lg bg-muted/60" />
                <div className="h-full w-full rounded-lg bg-muted/40" />
              </div>
              <div className="col-span-1 space-y-4">
                <div className="h-full w-full rounded-lg bg-primary/10 border border-primary/20 shadow-sm" />
              </div>
              <div className="col-span-1 space-y-4 pt-8">
                <div className="h-24 w-full rounded-lg bg-muted/60" />
                <div className="h-40 w-full rounded-lg bg-muted" />
                <div className="h-full w-full rounded-lg bg-muted/40" />
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center z-20">
               <span className="text-sm font-mono text-muted-foreground bg-background/80 px-4 py-2 rounded-full border border-border backdrop-blur-md">
                 Interfaz Minimalista & Potente
               </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-secondary/10">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-serif mb-4 text-foreground">Diseñado para la Excelencia</h2>
            <p className="text-muted-foreground text-lg">
              Cada detalle ha sido cuidado para ofrecer una experiencia fluida, segura y humana.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<FileText className="h-8 w-8 text-primary" />}
              title="Historia Clínica Unificada"
              description="Accede a toda la información médica de tus pacientes de forma centralizada, segura y disponible 24/7."
            />
            <FeatureCard 
              icon={<Calendar className="h-8 w-8 text-primary" />}
              title="Agendamiento Inteligente"
              description="Sistema de turnos automatizado que reduce el ausentismo y optimiza tu tiempo de consulta."
            />
            <FeatureCard 
              icon={<Shield className="h-8 w-8 text-primary" />}
              title="Seguridad de Grado Bancario"
              description="Tus datos y los de tus pacientes están protegidos con los más altos estándares de encriptación."
            />
          </div>
        </div>
      </section>

      {/* Split Section: Roles */}
      <section className="py-0">
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[600px]">
          {/* For Doctors */}
          <div className="relative group overflow-hidden bg-background border-b md:border-b-0 md:border-r border-border p-12 flex flex-col justify-center items-start transition-colors hover:bg-secondary/5">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-700">
              <Stethoscope className="w-64 h-64" />
            </div>
            <div className="relative z-10 space-y-6">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                <Stethoscope className="h-6 w-6" />
              </div>
              <h3 className="text-4xl font-serif">Para Especialistas</h3>
              <ul className="space-y-3">
                <ListItem text="Gestión de agenda y recordatorios automáticos" />
                <ListItem text="Facturación electrónica integrada" />
                <ListItem text="Recetas digitales y órdenes de estudio" />
                <ListItem text="Telemedicina HD sin instalar nada" />
              </ul>
              <Link href="/register?role=doctor">
                <Button variant="outline" className="mt-4 rounded-full px-8 border-primary/20 hover:border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                  Comenzar como Médico
                </Button>
              </Link>
            </div>
          </div>

          {/* For Patients */}
          <div className="relative group overflow-hidden bg-primary/5 p-12 flex flex-col justify-center items-start transition-colors hover:bg-primary/10">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-700">
              <Users className="w-64 h-64 text-primary" />
            </div>
            <div className="relative z-10 space-y-6">
              <div className="h-12 w-12 rounded-2xl bg-background flex items-center justify-center text-primary mb-4 shadow-sm">
                <Activity className="h-6 w-6" />
              </div>
              <h3 className="text-4xl font-serif text-primary-foreground/90 mix-blend-multiply dark:mix-blend-normal dark:text-primary">
                Para Pacientes
              </h3>
              <ul className="space-y-3">
                <ListItem text="Agenda turnos en segundos" />
                <ListItem text="Accede a tus resultados y recetas" />
                <ListItem text="Historial médico siempre disponible" />
                <ListItem text="Recordatorios de medicación" />
              </ul>
              <Link href="/patient-portal/register">
                <Button className="mt-4 rounded-full px-8 bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft-md">
                  Comenzar como Paciente
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats / Trust */}
      <section className="py-24 bg-foreground text-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            <Stat number="+500" label="Especialistas" />
            <Stat number="+10k" label="Pacientes Activos" />
            <Stat number="99.9%" label="Disponibilidad" />
            <Stat number="24/7" label="Soporte Médico" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-background border-t border-border">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-serif text-xs font-bold">
              H
            </div>
            <span className="text-lg font-serif font-medium">HC Gestor</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} HC Gestor. Todos los derechos reservados.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-foreground transition-colors">Privacidad</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Términos</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Contacto</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="p-8 rounded-2xl bg-card border border-border/40 shadow-soft-sm hover:shadow-soft-lg transition-all duration-300"
    >
      <div className="mb-6 p-3 w-fit rounded-xl bg-secondary/30 text-primary">
        {icon}
      </div>
      <h3 className="text-xl font-serif font-medium mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}

function ListItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 text-muted-foreground">
      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
      <span>{text}</span>
    </div>
  );
}

function Stat({ number, label }: { number: string, label: string }) {
  return (
    <div className="space-y-2">
      <div className="text-4xl md:text-5xl font-serif font-light">{number}</div>
      <div className="text-sm md:text-base opacity-70 uppercase tracking-widest font-medium">{label}</div>
    </div>
  );
}
