
import './Sections.css';

const skillGroups = [
  {
    title: 'Programming & Data Analysis',
    skills: ['Python', 'SQL', 'Pandas', 'NumPy', 'Excel'],
  },
  {
    title: 'Data Visualization',
    skills: ['Power BI', 'Tableau', 'Matplotlib', 'Seaborn'],
  },
  {
    title: 'Machine Learning',
    skills: ['Scikit-learn', 'Regression', 'Classification',
      'Random Forest', 'XGBoost', 'Feature Engineering'],
  },
  {
    title: 'AI & Generative AI',
    skills: ['Generative AI', 'Azure AI Foundry', 'LangChain',
      'LangGraph', 'RAG', 'Agentic AI'],
  },
  {
    title: 'Development & APIs',
    skills: ['FastAPI', 'REST APIs', 'Pydantic', 'Git', 'GitHub'],
  },
  {
    title: 'Cloud & Tools',
    skills: ['Microsoft Azure', 'AZ-900', 'Postman', 'Jupyter Notebook'],
  },
];

function Skills() {
  return (
    <section className="section" id="skills">
      <div className="section-heading">
        <span className="section-label">MY TECHNICAL EXPERTISE</span>
        <h2>Skills & <span>Technologies</span></h2>
        <p>Technologies I use and continue to explore.</p>
      </div>

      <div className="skills-grid">
        {skillGroups.map((group) => (
          <div className="skill-card" key={group.title}>
            <h3>{group.title}</h3>
            <div className="skill-tags">
              {group.skills.map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Skills;
