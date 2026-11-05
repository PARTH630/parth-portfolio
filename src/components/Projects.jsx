
import ProjectCard from './ProjectCard';
import './Sections.css';

const projects = [
  
  {
    number: '01',
    title: 'AI-Powered ServiceNow Incident Automation',
    category: 'Generative AI · RAG · Automation',
    description:
      'Built an AI-powered incident automation prototype using hybrid classification, RAG-based retrieval, human approval workflows, and ServiceNow API integration.',
    result: '1K+ Synthetic Tickets Evaluated | 12/12 Tests Passed',
    technologies: ['Python', 'FastAPI', 'RAG', 'Ollama', 'ServiceNow API', 'SQLAlchemy', 'Streamlit'],
    githubLink: '',
  liveLink: '',
  },

  {
    number: '02',
    title: 'Vendor Performance Analysis',
    category: 'Python · SQL · Analytics',
    description:
      'Analyzed 85K+ records to evaluate vendor performance and identify inventory inefficiencies.',
    result: '$2.7M Slow-Moving Stock Identified',
    technologies: ['Python', 'SQL', 'Pandas', 'EDA'],
    githubLink: '',
    liveLink: '',
  },

  
  {
    number: '03',
    title: 'Rainfall Prediction using Machine Learning',
    category: 'Machine Learning · Classification',
    description:
    'Developed and compared ML pipelines using Random Forest, Logistic Regression, and XGBoost with SMOTE, PCA, and hyperparameter tuning.',
    result: '77% Test Accuracy | 87% Cross-Validated Accuracy',
    technologies: [
      'Python',
      'Scikit-learn',
      'XGBoost',
      'SMOTE',
      'PCA',
      'GridSearchCV'
    ],
    githubLink: '',
    liveLink: '',
  },

  
  {
    number: '04',
    title: 'Aluminium–Boron Oxide (Al–B₂O₃) Composite',
    category: 'Academic Research · Materials Engineering',
    description:
      'Developed aluminium–boron oxide composites using powder metallurgy and investigated the effects of reinforcement concentration on microstructure, hardness, density, and mechanical strength.',
    result: 'Yield Strength Improved from ~21 MPa to ~175 MPa',
    technologies: [
      'Powder Metallurgy',
      'XRD',
      'DSC',
      'Vickers Hardness',
      'Microstructure Analysis'
    ],
    githubLink: '',
    liveLink: '',
  },
];

function Projects() {
  return (
    <section className="section" id="projects">

      <div className="section-heading">
        <span className="section-label">MY WORK</span>
        <h2>Featured <span>Projects</span></h2>
        <p>Turning data into meaningful solutions.</p>
      </div>

      <div className="projects-grid">
        {projects.map((project) => (
          <ProjectCard
            key={project.number}
            {...project}
          />
        ))}
      </div>

    </section>
  );
}

export default Projects;
