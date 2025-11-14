import React from 'react';
import '../../styles/components/common/Stepper.css';

const Stepper = ({ steps, currentStep, onStepClick }) => {
  return (
    <div className="common-stepper">
      {steps.map((step, idx) => (
        <div
          key={idx}
          className={`step ${idx === currentStep ? 'active' : ''} ${idx < currentStep ? 'completed' : ''}`}
          onClick={() => onStepClick && onStepClick(idx)}
        >
          <div className="step-icon">
            {step.icon || <span>{idx + 1}</span>}
          </div>
          <div className="step-label">{step.label}</div>
          {idx < steps.length - 1 && <div className="step-connector" />}
        </div>
      ))}
    </div>
  );
};

export default Stepper; 