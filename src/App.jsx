import React from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Services from './components/Services';
import CallToAction from './components/CallToAction';
import About from './components/About';
import ContactForm from './components/ContactForm';
import Footer from './components/Footer';

function App() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-orange-500 selection:text-white">
      <Header />
      <main>
        <Hero />
        <Services />
        <CallToAction />
        <About />
        <ContactForm />
      </main>
      <Footer />
    </div>
  );
}

export default App;
