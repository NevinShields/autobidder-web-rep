import { useMemo, useRef } from "react";
import { Link } from "wouter";
import StepSection from "@/components/setup/StepSection";
import ProgressSnake from "@/components/setup/ProgressSnake";
import "@/pages/setup-step-by-step.css";

const steps = [
  {
    step: "01",
    title: "Set up your calculators",
    videoUrl: "https://www.youtube.com/embed/IKir-Vxi0XM",
    bullets: [
      "Add a calculator for each of the services that you want to offer",
      "Add the necessary variables for each service",
      "Use the variables to create a pricing formula",
      "Decide if you want to include upsells for each service",
      "Setup the measure tools if necessary",
      "Test over and over to ensure that the pricing makes sense",
    ],
  },
  {
    step: "02",
    title: "Optimize your form logic",
    videoUrl: "https://www.youtube.com/embed/_cBjLvCJ4ak",
    intro: "This includes:",
    bullets: [
      "Setting taxes",
      "Setting discount options",
      "Data collection fields",
      "Route booking optimization",
      "Guide videos",
      "Travel fee",
      "Other smaller details",
    ],
  },
  {
    step: "03",
    title: "Customize the design",
    videoUrl: "https://www.youtube.com/embed/s-eJFmDtqlk",
    bullets: [
      "Use the visual editor to edit the form to your liking",
      "Use the AI + CSS editor to create truly unique and deeply detailed designs",
    ],
  },
  {
    step: "04",
    title: "Setup Calendar",
    videoUrl: "https://www.youtube.com/embed/P_4F6LjYTD4",
    bullets: [
      "Setup your availability times",
      "Setup route booking optimization",
      "Integrate Google Calendar",
    ],
  },
  {
    step: "05",
    title: "Integrate With Website",
    videoUrl: "https://www.youtube.com/embed/Uj4L69U17Ek",
    bullets: [
      "Use the integration tool to setup the form on your site",
      "Setup the primary form with all your services or setup individual forms for each of your services on their own pages",
    ],
  },
  {
    step: "06",
    title: "Setup Automations",
    bullets: [
      "Integrate with your crm and marketing tools using zapier",
      "Customize email automation templates",
    ],
  },
];

export default function SetupStepByStepPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useMemo(
    () => steps.map(() => ({ current: null as HTMLDivElement | null })),
    []
  );

  return (
    <div className="setup-page">
      <header className="setup-hero">
        <div className="setup-hero-inner">
          <p className="setup-hero-tag">Guided onboarding</p>
          <h1>Autobidder Setup Step-by-Step</h1>
          <p className="setup-hero-sub">
            A premium, guided setup path that turns your pricing system live in days, not weeks.
          </p>
          <div className="setup-hero-cta">
            <a href="#step-1" className="setup-cta">Start Step 1</a>
            <Link href="/onboarding" className="setup-cta ghost">Create account</Link>
          </div>
        </div>
      </header>

      <div className="setup-main" ref={containerRef}>
        <ProgressSnake containerRef={containerRef} sectionRefs={sectionRefs} />

        <nav className="setup-rail">
          <div className="setup-rail-inner">
            <div className="setup-rail-title">Steps</div>
            {steps.map((step, index) => (
              <a key={step.step} href={`#step-${index + 1}`} className="setup-rail-link">
                <span className="setup-rail-chip">{step.step}</span>
                <span>{step.title}</span>
              </a>
            ))}
          </div>
        </nav>

        <div className="setup-steps">
          {steps.map((step, index) => (
            <div key={step.step} id={`step-${index + 1}`} className="setup-step-wrapper">
              <StepSection
                ref={sectionRefs[index]}
                step={step.step}
                title={step.title}
                intro={(step as any).intro}
                bullets={step.bullets}
                proTip={index === 0 ? "Use real pricing data from past jobs for the first formula." : undefined}
                videoUrl={(step as any).videoUrl}
                videoTitle={`${step.title} video`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
