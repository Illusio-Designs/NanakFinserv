import React from 'react';
import '../../styles/components/StatCard.css';

const StatCard = ({ 
  title, 
  count, 
  description, 
  color, 
  isActive, 
  onClick 
}) => {
  return (
    <div 
      className={`stat-card ${isActive ? 'active' : ''}`}
      style={{ '--card-color': color }}
      onClick={onClick}
    >
      <div className="stat-card-count">{count}</div>
      <div className="stat-card-content">
        <div className="stat-card-title">
          {title} {isActive && <span className="check-mark">✓</span>}
        </div>
        <div className="stat-card-description">{description}</div>
      </div>
    </div>
  );
};

export default StatCard;

