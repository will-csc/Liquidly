import React from 'react';
import { useNavigate } from 'react-router-dom';
import logoGreen from '../assets/images/logo-green.png';
import heroImage from '../assets/images/hero-image_entry-page.png';
import { Button } from '@/components/ui/button';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col bg-background text-foreground px-6 py-4 md:px-12 md:py-6">
      {/* Header */}
      <header className="flex justify-between items-center flex-shrink-0 h-[13vh] min-h-[80px]">
        <div className="flex items-center gap-4">
          <img src={logoGreen} alt="Liquidly Logo" className="h-11 md:h-14 w-auto object-contain" />
          <div className="flex flex-col justify-center">
            <h1 className="text-2xl md:text-3xl font-bold text-primary leading-tight">Liquidly</h1>
            <p className="text-xs md:text-sm text-muted-foreground font-medium hidden sm:block">
              Designed to help you manage your finance's balance
            </p>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <button 
            onClick={() => navigate('/login')} 
            className="text-primary font-bold text-base md:text-lg hover:underline bg-transparent border-none cursor-pointer"
          >
            Sign In
          </button>
          <Button 
            onClick={() => navigate('/signup')} 
            className="rounded-full px-8 py-6 text-lg"
          >
            Sign Up
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center text-center gap-5 md:gap-8 min-h-0">
        <div className="flex flex-col gap-3 flex-shrink-0">
          <p className="text-lg md:text-2xl text-muted-foreground font-medium">
            Let our system do the heavy work for you
          </p>
          <h2 className="text-5xl md:text-7xl font-extrabold text-primary">
            Take this burden off your <span className="text-primary/80">Shoulders</span>
          </h2>
        </div>
        
        <div className="flex-1 w-full flex items-center justify-center py-2 min-h-0">
          <img 
            src={heroImage} 
            alt="Burden off shoulders" 
            className="h-full w-auto max-h-full max-w-full object-contain" 
          />
        </div>

        <div className="flex-shrink-0 pb-6 md:pb-10">
          <button 
            className="bg-[#d4edda] text-[#004d00] border border-[#c3e6cb] px-6 py-3 md:px-8 md:py-4 rounded-lg text-sm md:text-base font-bold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            onClick={() => navigate('/signup')}
          >
            Sign up now and manage your finance's balance better
          </button>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
