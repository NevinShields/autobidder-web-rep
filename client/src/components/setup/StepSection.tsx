import { forwardRef } from "react";
import { useRevealOnScroll } from "@/hooks/use-reveal-on-scroll";

type StepSectionProps = {
  step: string;
  title: string;
  bullets: string[];
  intro?: string;
  proTip?: string;
};

const StepSection = forwardRef<HTMLDivElement, StepSectionProps>(
  ({ step, title, bullets, intro, proTip }, ref) => {
    const { ref: revealRef, isVisible, hasRevealed } = useRevealOnScroll();

    return (
      <section ref={ref} className="setup-step">
        <div className="setup-step-card">
          <div className="setup-step-header">
            <div className="setup-step-chip">{step}</div>
            <div>
              <h2>{title}</h2>
            </div>
          </div>

          <div className="setup-step-body">
            <div className="setup-step-content">
              {intro && <div className="setup-step-intro">{intro}</div>}
              {bullets.map((bullet) => (
                <div key={bullet} className="setup-step-bullet">• {bullet}</div>
              ))}
              {proTip && (
                <div className="setup-step-tip">
                  <strong>Pro tip:</strong> {proTip}
                </div>
              )}
            </div>

            <div
              ref={revealRef}
              className={`setup-video ${isVisible ? "is-visible" : ""}`}
              data-reveal={hasRevealed}
            >
              <div className="setup-video-frame">
                <div className="setup-video-icon">▶</div>
                <div className="setup-video-label">Video placeholder</div>
                <div className="setup-video-sheen" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }
);

StepSection.displayName = "StepSection";

export default StepSection;
