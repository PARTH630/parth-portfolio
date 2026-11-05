
import { GitBranch, ExternalLink, ArrowUpRight } from 'lucide-react';
import './Sections.css';

function ProjectCard({
  number,
  title,
  category,
  description,
  result,
  technologies = [],
  githubLink,
  liveLink,
}) {
  return (
    <article className="project-card">

      <div className="project-card-top">
        <span className="project-number">
          {number}
        </span>

        <ArrowUpRight
          className="project-arrow"
          size={21}
        />
      </div>

      <div className="project-card-content">

        <span className="project-category">
          {category}
        </span>

        <h3 className="project-title">
          {title}
        </h3>

        <p className="project-description">
          {description}
        </p>

        {result && (
          <div className="project-result">
            <span className="project-result-label">
              KEY RESULT
            </span>

            <strong>{result}</strong>
          </div>
        )}

        <div className="project-technologies">
          {technologies.map((tech) => (
            <span
              className="project-tech"
              key={tech}
            >
              {tech}
            </span>
          ))}
        </div>

        {(githubLink || liveLink) && (
          <div className="project-links">

            {githubLink && (
              <a
                href={githubLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`View ${title} on GitHub`}
              >
                <GitBranch size={18} />
                GitHub
              </a>
            )}

            {liveLink && (
              <a
                href={liveLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`View live demo of ${title}`}
              >
                <ExternalLink size={18} />
                Live Demo
              </a>
            )}

          </div>
        )}

      </div>
    </article>
  );
}

export default ProjectCard;
