import './Sections.css';
import {
  GraduationCap,
  Award,
  Trophy,
  TrendingUp,
  BrainCircuit,
  Database,
} from 'lucide-react';

import './Sections.css';

const achievements = [
  {
    icon: GraduationCap,
    title: 'Academic Achievement',
    subtitle: 'MNIT Jaipur',
    description:
      'B.Tech in Metallurgical and Materials Engineering with an 8.3 CGPA.',
    category: 'Education',
  },
];

function Achievements() {
  return (
    <section className="section" id="achievements">
      <div className="section-heading">
        <span className="section-label">MILESTONES & RECOGNITION</span>
        <h2>Achievements & <span>Certifications</span></h2>
        <p>
          Academic milestones, certifications and measurable project outcomes.
        </p>
      </div>

      <div className="achievements-grid">
        {achievements.map((item) => {
          const Icon = item.icon;

          return (
            <article className="achievement-card" key={item.title}>
              <div className="achievement-icon">
                <Icon size={25} />
              </div>

              <span className="achievement-category">
                {item.category}
              </span>

              <h3>{item.title}</h3>
              <h4>{item.subtitle}</h4>
              <p>{item.description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default Achievements;
