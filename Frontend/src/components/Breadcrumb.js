import React from 'react';
import "./Breadcrumb.css";

const Breadcrumb = ({ breadcrumbs = [] }) => {
    return (
        <div className='breadcrumbs'>
            <div className="breadcrumb-container">
                <nav className="breadcrumb-nav" aria-label="breadcrumb">
                    <ol className="breadcrumb-list">
                        <li className="breadcrumb-item">
                            <a href="/" className="breadcrumb-link">
                                <svg className="home-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                                </svg>
                                <span>Home</span>
                            </a>
                        </li>
                        {breadcrumbs.map((crumb, index) => (
                            <li key={index} className="breadcrumb-item">
                                {index === breadcrumbs.length - 1 ? (
                                    <span className="breadcrumb-current">{crumb.label}</span>
                                ) : (
                                    <a href={crumb.path} className="breadcrumb-link">{crumb.label}</a>
                                )}
                            </li>
                        ))}
                    </ol>
                </nav>
            </div>
        </div>
    );
}

export default Breadcrumb;