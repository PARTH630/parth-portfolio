
import { Mail, ArrowUpRight, Send } from 'lucide-react';
import './Sections.css';

function Contact() {
  const email = 'parthpatkar169@gmail.com';

  return (
    <section className="section contact-section" id="contact">
      <div className="section-heading">
        <span className="section-label">GET IN TOUCH</span>
        <h2>Let's Work <span>Together</span></h2>
        <p>
          Have an opportunity, project idea or just want to connect?
          I'd love to hear from you.
        </p>
      </div>

      <div className="contact-card">
        <div className="contact-message">
          <h3>Let's build something meaningful.</h3>
          <p>
            I'm interested in opportunities involving Data Science,
            Machine Learning, Generative AI and software development.
            Feel free to reach out.
          </p>

          <a className="contact-email" href={`mailto:${email}`}>
            <Mail size={19} />
            {email}
            <ArrowUpRight size={17} />
          </a>
        </div>

        <div className="contact-socials">
          <a
            href="https://github.com/PARTH630"
            target="_blank"
            rel="noreferrer"
          >
            GitHub ↗
            <ArrowUpRight size={17} />
          </a>

          <a
            href="https://www.linkedin.com/in/parth-patkar-108519314/"
            target="_blank"
            rel="noreferrer"
        >
            LinkedIn ↗
            <ArrowUpRight size={17} />
           </a>

          <a href={`mailto:${email}`}>
            <Send size={20} />
            Send an Email
            <ArrowUpRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}

export default Contact;

