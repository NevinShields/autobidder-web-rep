import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useScrollProgress } from "@/hooks/use-scroll-progress";

type ProgressSnakeProps = {
  containerRef: React.RefObject<HTMLDivElement>;
  sectionRefs: React.RefObject<HTMLDivElement>[];
};

const buildSerpentinePath = (
  container: HTMLDivElement,
  sections: HTMLDivElement[],
  isMobile: boolean
) => {
  const rect = container.getBoundingClientRect();
  const scrollY = window.scrollY || window.pageYOffset;
  const containerTop = rect.top + scrollY;
  const containerLeft = rect.left;
  const containerWidth = rect.width;

  const getY = (el: HTMLDivElement) => {
    const r = el.getBoundingClientRect();
    return r.top + scrollY - containerTop + r.height / 2;
  };

  if (sections.length === 0) return "";

  if (isMobile) {
    const first = sections[0];
    const last = sections[sections.length - 1];
    const yStart = getY(first) - first.getBoundingClientRect().height / 2;
    const yEnd = getY(last) + last.getBoundingClientRect().height / 2;
    const x = 18;
    return `M ${x} ${yStart} L ${x} ${yEnd}`;
  }

  const xLeft = 32;
  const xRight = Math.max(containerWidth - 32, xLeft + 40);

  const ys = sections.map(getY);
  let path = `M ${xLeft} ${ys[0]} L ${xRight} ${ys[0]}`;
  let currentX = xRight;

  for (let i = 1; i < ys.length; i += 1) {
    const nextY = ys[i];
    path += ` L ${currentX} ${nextY}`;
    currentX = currentX === xRight ? xLeft : xRight;
    path += ` L ${currentX} ${nextY}`;
  }

  return path;
};

export default function ProgressSnake({ containerRef, sectionRefs }: ProgressSnakeProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const coreRef = useRef<SVGPathElement | null>(null);
  const [path, setPath] = useState("");
  const [pathLength, setPathLength] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const progress = useScrollProgress(containerRef);

  useLayoutEffect(() => {
    const updatePath = () => {
      if (!containerRef.current) return;
      const sections = sectionRefs
        .map((ref) => ref.current)
        .filter((el): el is HTMLDivElement => Boolean(el));

      const nextIsMobile = window.innerWidth < 768;
      setIsMobile(nextIsMobile);
      const nextPath = buildSerpentinePath(containerRef.current, sections, nextIsMobile);
      const { width, height } = containerRef.current.getBoundingClientRect();
      setSize({ width, height });
      setPath(nextPath);
    };

    updatePath();
    window.addEventListener("resize", updatePath);
    window.addEventListener("scroll", updatePath, { passive: true });

    return () => {
      window.removeEventListener("resize", updatePath);
      window.removeEventListener("scroll", updatePath);
    };
  }, [containerRef, sectionRefs]);

  useEffect(() => {
    if (!pathRef.current) return;
    try {
      const length = pathRef.current.getTotalLength();
      setPathLength(length);
    } catch {
      setPathLength(0);
    }
  }, [path]);

  useEffect(() => {
    if (!pathRef.current || !coreRef.current || pathLength === 0) return;
    const offset = pathLength * (1 - progress);
    [pathRef.current, coreRef.current].forEach((el) => {
      el.style.strokeDasharray = `${pathLength}`;
      el.style.strokeDashoffset = `${offset}`;
    });
  }, [progress, pathLength]);

  return (
    <svg
      ref={svgRef}
      className="setup-progress"
      aria-hidden="true"
      viewBox={`0 0 ${size.width} ${size.height}`}
      preserveAspectRatio="none"
    >
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d={path}
        className={`setup-progress-path ${isMobile ? "is-mobile" : ""}`}
        ref={pathRef}
      />
      <path
        d={path}
        className={`setup-progress-path-core ${isMobile ? "is-mobile" : ""}`}
        ref={coreRef}
      />
    </svg>
  );
}
