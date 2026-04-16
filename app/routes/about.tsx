import type { Route } from "./+types/about";
import { Link } from "react-router";
import BrandLogo from "../components/BrandLogo";

const stats = [
  { label: "Resumes analyzed", value: "12k+" },
  { label: "Average score lift", value: "34%" },
  { label: "Industries covered", value: "40+" },
];

const milestones = [
  {
    title: "The Problem",
    description:
      "Most applicants are rejected before a recruiter reads a single line. We built ATSEngine to make that first filter easier to pass.",
  },
  {
    title: "The Build",
    description:
      "We combined resume parsing, keyword diagnostics, and actionable writing suggestions in one guided flow.",
  },
  {
    title: "The Mission",
    description:
      "Give every job seeker a fair, practical, and data-informed way to improve their resume with confidence.",
  },
];

const values = [
  {
    title: "Clarity Over Buzzwords",
    description:
      "We turn complex ATS logic into concrete recommendations you can apply in minutes.",
  },
  {
    title: "Built For Real Hiring",
    description:
      "Our feedback is grounded in modern screening patterns and recruiter expectations.",
  },
  {
    title: "Privacy As A Default",
    description:
      "Your resume data stays yours. We do not sell personal information and you stay in control.",
  },
  {
    title: "Constantly Improving",
    description:
      "As hiring trends evolve, our analysis evolves too so your resume stays competitive.",
  },
];

export function meta({}: Route.MetaArgs) {
  return [
    { title: "About Us - ATSEngine" },
    {
      name: "description",
      content: "Learn about ATSEngine and how we help job seekers optimize resumes for ATS and recruiters.",
    },
  ];
}

export default function AboutPage() {
  return (
    <div className="about-page">
      <div className="about-bg about-bg-top" aria-hidden="true" />
      <div className="about-bg about-bg-bottom" aria-hidden="true" />

      <nav className="about-nav">
        <div className="about-nav-inner">
          <Link to="/" className="about-logo-link">
            <BrandLogo size="sm" className="about-logo" />
          </Link>
          <Link to="/" className="about-nav-back">
            Back to Home
          </Link>
        </div>
      </nav>

      <main className="about-main">
        <section className="about-hero">
          <p className="about-kicker">Our mission</p>
          <h1 className="about-title">We engineer resumes that get seen.</h1>
          <p className="about-subtitle">
            ATSEngine helps job seekers bridge the gap between submitting applications and getting interviews.
            We combine AI analysis and practical writing guidance so resumes perform for ATS systems and human recruiters.
          </p>
          <div className="about-hero-actions">
            <Link to="/upload" className="about-button about-button-primary">
              Start analysis
            </Link>
            <Link to="/contact" className="about-button about-button-secondary">
              Talk to the team
            </Link>
          </div>
          <div className="about-stats-grid">
            {stats.map((item) => (
              <article key={item.label} className="about-stat-card">
                <p className="about-stat-value">{item.value}</p>
                <p className="about-stat-label">{item.label}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="about-story-panel">
          <div className="about-story-copy">
            <p className="about-section-tag">Why we built it</p>
            <h2>The hiring pipeline changed. Resume advice did not.</h2>
            <p>
              We started ATSEngine after seeing talented candidates disappear in automated filters. Most people were
              still using generic templates and keyword stuffing strategies that no longer worked.
            </p>
            <p>
              Our goal is simple: give job seekers clear, modern, and measurable feedback so every submission has a
              better chance of becoming a real conversation.
            </p>
          </div>
          <div className="about-timeline">
            {milestones.map((item, index) => (
              <article
                key={item.title}
                className="about-timeline-item"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <span className="about-timeline-index">0{index + 1}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="about-values-section">
          <div className="about-values-heading">
            <p className="about-section-tag">Principles</p>
            <h2>How we design every feature</h2>
          </div>
          <div className="about-values-grid">
            {values.map((value, index) => (
              <article key={value.title} className="about-value-card" style={{ animationDelay: `${index * 90}ms` }}>
                <span className="about-value-chip">0{index + 1}</span>
                <h3>{value.title}</h3>
                <p>{value.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="about-cta-panel">
          <p className="about-section-tag">Built with care</p>
          <h2>Ready to make your resume stronger?</h2>
          <p>
            Upload your resume, get an ATS score, and ship your next application with more confidence.
          </p>
          <Link to="/upload" className="about-button about-button-primary">
            Analyze my resume
          </Link>
        </section>
      </main>

      <footer className="about-footer">
        <p>Copyright {new Date().getFullYear()} ATSEngine. All rights reserved.</p>
      </footer>
    </div>
  );
}
