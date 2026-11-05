
import './Sections.css';

const experiences = [
  {
    role: 'Senior Software Engineer',
    company: 'HCLTech',
    period: 'September 2026 – Present',
    type: 'Full-time',
    description:
      'Building technical capabilities through enterprise technology training and continuous upskilling in Python, SQL, REST APIs and Generative AI.',
    points: [
      'Strengthening Python, SQL and API development fundamentals.',
      'Learning Generative AI and Microsoft Azure AI Foundry.',
      'Exploring LangChain, FastAPI and AI application development.',
    ],
  },
  {
    role: 'Data Analyst Intern',
    company: 'Null Class',
    period: 'Internship',
    type: 'Internship',
    description:
      'Worked on data analysis activities involving large-scale job market datasets and business intelligence reporting.',
    points: [
      'Analyzed 100K+ job-related records to identify useful trends.',
      'Created interactive Tableau dashboards and visual reports.',
      'Prepared analytical reports and presentations to communicate insights.',
    ],
  },
];

function Experience() {
  return (
    <section className="section" id="experience">
      <div className="section-heading">
        <span className="section-label">MY PROFESSIONAL JOURNEY</span>
        <h2>Experience & <span>Internships</span></h2>
        <p>My professional experience and learning journey.</p>
      </div>

      <div className="timeline">
        {experiences.map((item) => (
          <article className="experience-card" key={item.company}>
            <div className="timeline-dot"></div>

            <div className="experience-header">
              <div>
                <h3>{item.role}</h3>
                <h4>{item.company}</h4>
              </div>
              <span className="experience-type">{item.type}</span>
            </div>

            <span className="experience-period">{item.period}</span>

            <p className="experience-description">{item.description}</p>

            <ul>
              {item.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Experience;
