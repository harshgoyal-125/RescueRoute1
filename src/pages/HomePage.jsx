import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, HeartHandshake, MapPin, ShieldCheck, Truck, UtensilsCrossed } from 'lucide-react';
import logoImg from '../assets/logo.jpeg';
import './HomePage.css';

const steps = [
  { icon: UtensilsCrossed, title: 'Share surplus food', text: 'Food donors post what they can offer and when it is available.' },
  { icon: MapPin, title: 'Connect with a shelter', text: 'RescueRoute suggests nearby shelters when both sides provide locations.' },
  { icon: Truck, title: 'Coordinate a pickup', text: 'A volunteer driver can claim an available delivery and update its progress.' }
];

export default function HomePage() {
  return (
    <main className="home-page">
      <div className="home-shell">
        <header className="home-nav">
          <Link to="/" className="home-brand" aria-label="RescueRoute home">
            <img src={logoImg} alt="" />
            <span>RescueRoute</span>
          </Link>
          <nav aria-label="Main navigation" className="home-nav-links">
            <Link to="/request-food">Request food</Link>
            <Link to="/track-request">Track request</Link>
            <Link to="/login">Sign in</Link>
            <Link className="home-nav-signup" to="/signup">Join the network</Link>
          </nav>
        </header>

        <section className="home-hero" aria-labelledby="home-heading">
          <div>
            <p className="home-eyebrow">Surplus food, shared with care</p>
            <h1 id="home-heading">A clearer path from extra food to people who need it.</h1>
            <p className="home-lede">RescueRoute helps food donors, shelters and volunteer drivers coordinate surplus food pickups. You can also ask for food without creating an account.</p>
            <div className="home-actions">
              <Link className="home-button home-button-primary" to="/request-food">Request food <ArrowRight size={18} aria-hidden="true" /></Link>
              <Link className="home-button home-button-secondary" to="/signup">Join as a donor, shelter or driver</Link>
            </div>
            <p className="home-small">For NGOs, community groups and individuals in need. Requests are reviewed; submitting one does not guarantee food or delivery.</p>
          </div>
          <aside className="home-feature" aria-label="How to request food">
            <div className="home-feature-icon"><HeartHandshake size={34} aria-hidden="true" /></div>
            <p className="home-feature-kicker">Need food?</p>
            <h2>Tell us what you need.</h2>
            <p>Share your contact details, the food needed and a delivery address. No login is required to send a request.</p>
            <Link to="/request-food">Open the food request form <ArrowRight size={17} aria-hidden="true" /></Link>
          </aside>
        </section>

        <section className="home-how" aria-labelledby="home-how-heading">
          <p className="home-eyebrow">How it works</p>
          <h2 id="home-how-heading">A simple way to coordinate food rescue</h2>
          <div className="home-steps">
            {steps.map(({ icon: Icon, title, text }) => (
              <article className="home-step" key={title}>
                <Icon size={27} aria-hidden="true" />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
        <footer className="home-footer"><ShieldCheck size={18} aria-hidden="true" /> Request contact details are not shown on this public page. <Link to="/login">Member sign in</Link></footer>
      </div>
    </main>
  );
}
