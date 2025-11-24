import "./styles.css"

const AppShowcase = () => {
  return (
    <div className="app-demo">
      <section className="app-demo__hero">
        <p className="app-demo__eyebrow">Cascade OS</p>
        <h1 className="app-demo__title">Operational intelligence for modern agri-commerce</h1>
        <p className="app-demo__subtitle">
          Monitor crops, orchestrate supply chains, and respond to market shifts in real time with an AI-first
          command center.
        </p>
        <div className="app-demo__cta-group">
          <button className="app-demo__cta">Book a walkthrough</button>
          <button className="app-demo__cta app-demo__cta--secondary">Download brochure</button>
        </div>
      </section>

      <section className="app-demo__grid">
        <article className="app-demo__card">
          <h2>Dynamic crop telemetry</h2>
          <p>
            Satellite imagery, IoT sensors, and predictive climate modeling converge to surface actionable
            alerts in minutes, not days.
          </p>
        </article>
        <article className="app-demo__card">
          <h2>Supply automation</h2>
          <p>
            Intelligent routing keeps perishable goods moving. Optimize loads, routing windows, and partner SLAs
            automatically.
          </p>
        </article>
        <article className="app-demo__card">
          <h2>Market watch</h2>
          <p>
            Cross-check regional demand signals against your inventory health and price dynamically with
            AI-assisted recommendations.
          </p>
        </article>
      </section>

      <section className="app-demo__panel">
        <div>
          <h3>What the walkthrough includes</h3>
          <ul>
            <li>30-minute guided tour tailored to your workflows</li>
            <li>Hands-on exploration in a sandbox environment</li>
            <li>ROI playbook customized to your operations</li>
          </ul>
        </div>
        <div>
          <h3>Who joins the call</h3>
          <ul>
            <li>Solution architect</li>
            <li>Crop intelligence strategist</li>
            <li>Implementation concierge</li>
          </ul>
        </div>
      </section>
    </div>
  )
}

export default AppShowcase
