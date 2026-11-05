
import './Sections.css';

function About() {
  return (
    <section className="section" id="about">
      <div className="section-heading">
        <span className="section-label">GET TO KNOW ME</span>
        <h2>About <span>Me</span></h2>
        <p>A little about my journey, interests and ambitions.</p>
      </div>

      <div className="about-grid">
        <div className="about-content">
          <h3>Turning data into meaningful solutions.</h3>
          <p>
            I'm Parth Patkar, a technology enthusiast with a B.Tech
            background in Metallurgical and Materials Engineering
            from MNIT Jaipur.
          </p>
          <p>
            My interest in analytical problem-solving led me towards
            Data Science, Machine Learning and Artificial Intelligence.
            I enjoy exploring data, building predictive models and
            developing AI-powered applications.
          </p>
          <p>
            I'm continuously strengthening my skills in Python, SQL,
            Machine Learning, Generative AI and application development.
          </p>
        </div>

        <div className="about-details">
          <div className="detail-card">
            <span>Education</span>
            <h3>B.Tech</h3>
            <p>MNIT Jaipur · 2026</p>
          </div>
          <div className="detail-card">
            <span>Current Organization</span>
            <h3>HCLTech</h3>
            <p>Senior Software Engineer</p>
          </div>
          <div className="detail-card">
            <span>Core Interest</span>
            <h3>Data & AI</h3>
            <p>Machine Learning · Generative AI</p>
          </div>
          <div className="detail-card">
            <span>Current Focus</span>
            <h3>Building</h3>
            <p>AI-powered applications</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;
