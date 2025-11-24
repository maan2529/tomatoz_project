import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import gsap from "gsap"
import { useLocation, useNavigation } from "react-router-dom"
import "./GlobalLoader.css"

const EXCLUDED_PATHS = ["/"]

const GlobalLoader = () => {
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const textRef = useRef<HTMLDivElement | null>(null)
  const exitTimelineRef = useRef<gsap.core.Timeline | null>(null)
  const progressValueRef = useRef({ value: 0 })
  const progressTweenRef = useRef<gsap.core.Tween | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [progress, setProgress] = useState(0)

  let location: ReturnType<typeof useLocation> | null = null
  let navigation: ReturnType<typeof useNavigation> | null = null

  try {
    location = useLocation()
    navigation = useNavigation()
  } catch (error) {
    return null
  }

  const isRouting = navigation?.state === "loading" || navigation?.state === "submitting"
  const pendingPathname = navigation?.location?.pathname
  const currentPathname = location?.pathname ?? "/"

  const pathToEvaluate = isRouting ? pendingPathname ?? currentPathname : currentPathname

  const shouldExclude = useMemo(
    () => EXCLUDED_PATHS.includes(pathToEvaluate),
    [pathToEvaluate]
  )

  const shouldRender = Boolean(isRouting && !shouldExclude)

  const runExitAnimation = useCallback(() => {
    if (!overlayRef.current || !textRef.current) {
      setIsVisible(false)
      return
    }

    exitTimelineRef.current?.kill()

    gsap.set(overlayRef.current, { pointerEvents: "none" })

    exitTimelineRef.current = gsap
      .timeline({
        defaults: { ease: "power3.inOut" },
        onComplete: () => {
          setIsVisible(false)
        }
      })
      .to(textRef.current, {
        yPercent: -18,
        autoAlpha: 0,
        filter: "blur(10px)",
        duration: 0.55
      })
      .to(overlayRef.current, { autoAlpha: 0, duration: 0.6 }, 0)
  }, [])

  useEffect(() => {
    if (!shouldRender) {
      if (isVisible && overlayRef.current && textRef.current) {
        exitTimelineRef.current?.kill()

        progressTweenRef.current?.kill()

        if (progressValueRef.current.value < 100) {
          progressTweenRef.current = gsap.to(progressValueRef.current, {
            value: 100,
            duration: 0.6,
            ease: "power2.out",
            onUpdate: () => setProgress(Math.round(progressValueRef.current.value)),
            onComplete: runExitAnimation
          })
        } else {
          runExitAnimation()
        }
      } else {
        progressTweenRef.current?.kill()
        progressValueRef.current.value = 0
        setProgress(0)
        setIsVisible(false)
      }

      return
    }

    exitTimelineRef.current?.kill()
    progressTweenRef.current?.kill()
    progressValueRef.current.value = 0
    setProgress(0)

    progressTweenRef.current = gsap.to(progressValueRef.current, {
      value: 92,
      duration: 1.8,
      ease: "power2.out",
      onUpdate: () => setProgress(Math.round(progressValueRef.current.value))
    })

    setIsVisible(true)
  }, [shouldRender, isVisible, runExitAnimation])

  useLayoutEffect(() => {
    if (!isVisible || !shouldRender || !overlayRef.current || !textRef.current) {
      return
    }

    const ctx = gsap.context(() => {
      gsap.set(overlayRef.current, { autoAlpha: 0, pointerEvents: "auto" })
      gsap.set(textRef.current, { yPercent: 18, autoAlpha: 0, filter: "blur(8px)" })

      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .to(overlayRef.current, { autoAlpha: 1, duration: 0.35 })
        .to(
          textRef.current,
          { yPercent: 0, autoAlpha: 1, filter: "blur(0px)", duration: 0.6 },
          "-=0.15"
        )
    }, overlayRef)

    return () => {
      ctx.revert()
    }
  }, [isVisible, shouldRender])

  useEffect(() => {
    return () => {
      exitTimelineRef.current?.kill()
      progressTweenRef.current?.kill()
    }
  }, [])

  if (!location || !navigation) {
    return null
  }

  if (!isVisible) {
    return null
  }

  return (
    <div
      ref={overlayRef}
      className={`global-loader-overlay${isVisible ? " is-visible" : ""}`}
      role="status"
      aria-live="polite"
    >
      <div ref={textRef} className="global-loader-text">
        Loading...
      </div>
      <div className="global-loader-progress" aria-live="polite">
        {progress}%
      </div>
    </div>
  )
}

export default GlobalLoader