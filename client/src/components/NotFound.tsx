import { Link } from "react-router-dom"
import { AlertTriangle } from "lucide-react"
import "./NotFound.css"

const NotFound = () => {
  return (
    <main className="not-found" aria-labelledby="not-found-title">
      <div className="not-found__background" aria-hidden="true" />

      <div className="not-found__content">
        <div className="not-found__status" aria-hidden="true">
          <span className="not-found__status-code">404</span>
          <AlertTriangle className="not-found__status-icon" aria-hidden="true" />
        </div>

        <header className="not-found__header">
          <h1 id="not-found-title" className="not-found__title">
            We couldn’t locate that page
          </h1>
          <p className="not-found__subtitle">
            The address might be outdated, the content may have moved, or you mistyped the link. Let’s help
            you get back on track.
          </p>
        </header>

        <section className="not-found__callouts" aria-label="Navigation options">
          <article className="not-found__callout">
            <h2 className="not-found__callout-title">Continue exploring</h2>
            <p className="not-found__callout-body">
              Return to the homepage to browse our latest highlights and recommended destinations.
            </p>
            <Link to="/" className="not-found__cta-primary">
              Back to homepage
            </Link>
          </article>

          <article className="not-found__callout">
            <h2 className="not-found__callout-title">Need assistance?</h2>
            <p className="not-found__callout-body">
              Our team can point you to the right place or restore the page if it went missing.
            </p>
            <div className="not-found__cta-group">
              <a
                className="not-found__cta-secondary"
                href="mailto:support@example.com?subject=Page%20not%20found"
              >
                Email support
              </a>
              <a className="not-found__cta-secondary" href="/support/faq">
                View help center
              </a>
            </div>
          </article>
        </section>
      </div>
    </main>
  )
}

export default NotFound