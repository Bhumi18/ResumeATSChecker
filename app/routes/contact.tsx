import type { Route } from "./+types/contact";
import { Link } from "react-router";
import { useState, type FormEvent } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Contact Us - ATSEngine" },
    { name: "description", content: "Get in touch with the ATSEngine team" },
  ];
}

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSubmitted(true);
    setIsSubmitting(false);
  };

  return (
    <div className="contact-page">
      <div className="contact-bg contact-bg-top" aria-hidden="true" />
      <div className="contact-bg contact-bg-bottom" aria-hidden="true" />

      <nav className="contact-nav">
        <div className="contact-nav-inner">
          <Link to="/" className="contact-logo-link">
            <span className="contact-logo">ATSEngine</span>
          </Link>
          <Link to="/" className="contact-nav-back">
            Back to Home
          </Link>
        </div>
      </nav>

      <main className="contact-main">
        <section className="contact-hero">
          <p className="contact-kicker">Reach out</p>
          <h1>Let&apos;s build your next interview-winning resume.</h1>
          <p>
            Questions, feedback, or product ideas? Send us a note and we will get back quickly with practical help.
          </p>
        </section>

        <section className="contact-grid">
          <section className="contact-form-panel">
            {submitted ? (
              <div className="contact-success-state">
                <div className="contact-success-icon">
                  <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3>Message sent</h3>
                <p>
                  Thank you for reaching out. We'll get back to you within 24 hours.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: "", email: "", subject: "", message: "" });
                  }}
                  className="contact-reset-btn"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <>
                <div className="contact-form-head">
                  <h2>Send us a message</h2>
                  <p>
                    Share your issue, feedback, or question and we will respond with the best next step.
                  </p>
                </div>
                <form onSubmit={handleSubmit} className="contact-form">
                  <div className="contact-field">
                    <label htmlFor="name">Full Name</label>
                    <input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="contact-field">
                    <label htmlFor="email">Email Address</label>
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      placeholder="john@example.com"
                    />
                  </div>

                  <div className="contact-field">
                    <label htmlFor="subject">Subject</label>
                    <input
                      id="subject"
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                      placeholder="How can we help?"
                    />
                  </div>

                  <div className="contact-field">
                    <label htmlFor="message">Message</label>
                    <textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                      placeholder="Tell us more about your inquiry..."
                      rows={5}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="contact-submit-btn"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Message
                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </section>
        </section>
      </main>

      <footer className="contact-footer">
        <p>Copyright {new Date().getFullYear()} ATSEngine. All rights reserved.</p>
      </footer>
    </div>
  );
}
