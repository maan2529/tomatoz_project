import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import "./Loader.css";

type LoaderCard = {
  modifier: "one" | "two" | "three";
  number: string;
  hashtag: string;
  title: string;
  summary: string;
  details: string;
};

const CARDS: LoaderCard[] = [
  {
    modifier: "one",
    number: "",
    hashtag: "#Trend-to-Text",
    title: "Instant Blogs from Real-Time Insights",
    summary:
      "hunts the web for the latest updates, extracts the key insights, and instantly turns them into fresh, ready-to-read blogs. No writing, no waiting — just data turned into content.",
    details: "",
  },
  {
    modifier: "two",
    number: "",
    hashtag: "#HearItAll",
    title: "Voices That Bring Content to Life",
    summary: "Turn your blogs into captivating audio experiences. Our AI transforms content into podcasts and audiobooks, giving your audience a fresh, engaging way to consume every story.",
    details: "",
  },
  {
    modifier: "three",
    number: "",
    hashtag: "#VisualizeIt",
    title: "Visual Insights Made Simple",
    summary: "See your content come alive with AI-generated visualizations and flow diagrams. Complex ideas become clear, trends are easy to follow, and every story is instantly understandable at a glance.",
    details: "",
  },
];

const AUTO_SLIDE_INTERVAL = 2300;
const PROGRESS_INTERVAL = 60;
const INITIAL_PROGRESS_CAP = 95;
const COMPLETION_UNLOCK_INDEX = 2;

const Loader: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const hasCompletedRef = useRef<boolean>(false);
  const [activeCard, setActiveCard] = useState<number>(0);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [allowCompletion, setAllowCompletion] = useState<boolean>(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: "power3.out", duration: 0.6 } });

      timeline
        .from(".loader-progress", { autoAlpha: 0, y: 24 })
        .from(".loader-left-title div", { autoAlpha: 0, y: 32, stagger: 0.12 }, "-=0.3")
        .from(".loader-left-subtitle", { autoAlpha: 0, y: 16 }, "-=0.2")
        .from(
          ".loader-left-line",
          { autoAlpha: 0, scaleX: 0, transformOrigin: "left center", duration: 0.5 },
          "-=0.3"
        )
        .from(".loader-card", { autoAlpha: 0, y: 36, stagger: 0.15, duration: 0.8 }, "-=0.1")
        .from(".loader-indicator", { autoAlpha: 0, scale: 0.7, stagger: 0.1, duration: 0.4 }, "-=0.5");
    }, loaderRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const progressTimer = window.setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          window.clearInterval(progressTimer);
          return 100;
        }

        const cap = allowCompletion ? 100 : INITIAL_PROGRESS_CAP;
        if (prev >= cap) {
          return prev;
        }

        const nextValue = Math.min(prev + 1, cap);

        if (nextValue >= 100) {
          window.clearInterval(progressTimer);
          return 100;
        }

        return nextValue;
      });
    }, PROGRESS_INTERVAL);

    return () => window.clearInterval(progressTimer);
  }, [allowCompletion]);

  useEffect(() => {
    const slideTimer = window.setInterval(() => {
      setActiveCard((prev) => (prev + 1) % CARDS.length);
    }, AUTO_SLIDE_INTERVAL);

    return () => window.clearInterval(slideTimer);
  }, []);

  useEffect(() => {
    if (activeCard >= COMPLETION_UNLOCK_INDEX) {
      setAllowCompletion(true);
    }
  }, [activeCard]);

  useEffect(() => {
    if (loadingProgress < 100 || hasCompletedRef.current || !loaderRef.current) {
      return;
    }

    hasCompletedRef.current = true;

    const ctx = gsap.context(() => {
      const root = loaderRef.current;
      if (!root) {
        return;
      }

      const timeline = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        onComplete: () => {
          setTimeout(() => {
            setIsVisible(false)
          }, 5000);
        }
      });

      timeline
        .to(".loader-progress", { autoAlpha: 0, y: -16, duration: 0.35 })
        .to(
          ".loader-left-title div",
          { autoAlpha: 0, y: -24, stagger: 0.08, duration: 0.35 },
          "<0.05"
        )
        .to(".loader-left-subtitle", { autoAlpha: 0, y: -24, duration: 0.35 }, "<0.05")
        .to(".loader-left-line", { scaleX: 0, autoAlpha: 0, duration: 0.3 }, "<")
        .to(".loader-card", { autoAlpha: 0, y: 24, stagger: 0.08, duration: 0.4 }, "<")
        .to(".loader-indicator", { autoAlpha: 0, scale: 0.6, stagger: 0.05, duration: 0.3 }, "<0.05")
        .to(root, { autoAlpha: 0, scale: 0.96, duration: 0.45, ease: "power1.in" }, "-=0.2");
    }, loaderRef);

    return () => ctx.revert();
  }, [loadingProgress]);

  const handleActivateCard = (index: number): void => {
    setActiveCard(index);
  };

  const getCardBackground = (modifier: "one" | "two" | "three"): string => {
    const backgrounds = {
      one: "linear-gradient(145deg, rgba(104, 213, 255, 0.15) 0%, rgba(255, 107, 215, 0.05) 70%), linear-gradient(170deg, rgba(13, 20, 35, 0.9) 0%, rgba(8, 12, 22, 0.3) 100%), url('https://images.unsplash.com/photo-1524230572899-a752b3835840?auto=format&fit=crop&w=800&q=80') center/cover",
      two: "linear-gradient(145deg, rgba(255, 159, 90, 0.16) 0%, rgba(104, 213, 255, 0.08) 70%), linear-gradient(170deg, rgba(13, 18, 33, 0.92) 0%, rgba(8, 12, 22, 0.3) 100%), url('https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=800&q=80') center/cover",
      three: "linear-gradient(145deg, rgba(255, 107, 215, 0.18) 0%, rgba(104, 213, 255, 0.08) 70%), linear-gradient(170deg, rgba(10, 18, 31, 0.92) 0%, rgba(8, 12, 22, 0.3) 100%), url('https://images.unsplash.com/photo-1759675739458-6e5a4a60a117?q=80&w=1188&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D') center/cover",
    };
    return backgrounds[modifier];
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      ref={loaderRef}
      className="loader"
      role="status"
      aria-live="polite"
      aria-label="Page loading"
    >
      {/* Loading Percentage */}

      <div className="loader-container">
        {/* Left Section */}
        <section className="loader-left" aria-label="Brand statement">
          <div className="loader-progress">{loadingProgress}%</div>
          <div aria-hidden="true" className="loader-left-title">
            <div>We.</div>
            <div>Are.</div>
            <div>One.</div>
          </div>
          <p className="loader-left-subtitle">
            A seamless journey is on the way. Hold tight while we prepare an experience made for you.
          </p>
          <span className="loader-left-line" aria-hidden="true" />
        </section>

        {/* Right Section */}
        <section className="loader-right" aria-label="Highlighted points">
          <div
            className="loader-cards"
            style={{ transform: `translateX(-${activeCard * 100}%)` }}
          >
            {CARDS.map((card, index) => {
              const isActive = activeCard === index;
              return (
                <article
                  key={card.modifier}
                  className="loader-card"
                  role="button"
                  tabIndex={0}
                  aria-pressed={isActive}
                  aria-expanded={isActive}
                  aria-label={`${card.title} details`}
                  onClick={() => handleActivateCard(index)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleActivateCard(index);
                    }
                  }}
                  style={{ background: getCardBackground(card.modifier) }}
                >
                  <div className="loader-card-overlay" />
                  <div className="loader-card-content">
                    <p className="loader-card-hashtag">{card.hashtag}</p>
                    <div>
                      <h3 className="loader-card-title">{card.title}</h3>
                      {/* <p className="loader-card-summary">{card.summary}</p> */}
                      {/* <p className="loader-card-details">{card.details}</p> */}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Indicators */}
          <div className="loader-indicators" role="tablist" aria-label="Highlights navigation">
            {CARDS.map((card, index) => {
              const isActive = activeCard === index;
              return (
                <button
                  key={card.modifier}
                  type="button"
                  aria-label={`View ${card.title}`}
                  aria-pressed={isActive}
                  className={`loader-indicator ${isActive ? "active" : ""}`}
                  onClick={() => handleActivateCard(index)}
                />
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Loader;
