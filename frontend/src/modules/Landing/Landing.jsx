import React from 'react';
import LandingHeader from './components/LandingHeader';
import LandingHero from './components/LandingHero';
import LandingBentoGrid from './components/LandingBentoGrid';
import LandingFooter from './components/LandingFooter';
import './Landing.css';

export default function Landing({ onNavigate }) {
  return (
    <div className="landing-container">
      <LandingHeader />
      <LandingHero onNavigate={onNavigate} />
      <LandingBentoGrid />
      <LandingFooter />
    </div>
  );
}
