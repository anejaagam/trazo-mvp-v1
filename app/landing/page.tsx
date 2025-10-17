'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useScrollAnimation } from '@/hooks/use-scroll-animation';

export default function LandingPage() {
  // Scroll animation refs
  const heroText = useScrollAnimation({ threshold: 0.2 });
  const heroImage = useScrollAnimation({ threshold: 0.2 });
  const feature1 = useScrollAnimation({ threshold: 0.3 });
  const feature2 = useScrollAnimation({ threshold: 0.3 });
  const feature3 = useScrollAnimation({ threshold: 0.3 });
  const featuresGrid = useScrollAnimation({ threshold: 0.2 });
  const ctaSection = useScrollAnimation({ threshold: 0.3 });
  const faqSection = useScrollAnimation({ threshold: 0.3 });
  return (
    <div className="min-h-screen bg-black text-white font-[var(--font-instrument-sans)]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 relative">
                <Image 
                  src="/trazo-ag/Monogram_White.svg" 
                  alt="Trazo" 
                  fill
                  className="object-contain"
                />
              </div>
              <div className="text-lg font-bold tracking-wide">TRAZO</div>
            </Link>

            {/* CTA Buttons */}
            <div className="flex items-center gap-4">
              <Link 
                href="/auth/login"
                className="inline-flex items-center justify-center px-6 py-3 text-white font-medium hover:text-[#b2ff00] transition-all duration-200"
              >
                Log In
              </Link>
              <Link 
                href="/auth/sign-up"
                className="inline-flex items-center justify-center px-6 py-3 bg-[#b2ff00] text-black font-medium rounded-lg hover:bg-[#dff8a6] transition-all duration-200"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 pb-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <h1 className="text-[9cqw] font-[family-name:var(--font-lexend)] font-medium leading-[1.04] tracking-tight uppercase text-white">
            Unify every container farm workflow
            </h1>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div 
              ref={heroText.ref}
              className={`space-y-8 transition-all duration-1000 ${
                heroText.isVisible 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-10'
              }`}
            >
             
              
              <div className="max-w-lg space-y-6">
                <p className="text-[1.13rem] leading-[1.6] text-white/80">
                  Integrate compliance, automate controls, and monitor all zones from a single dashboard. Replace manual tasks, reduce errors, and access real-time insights to optimize yield and efficiency across your entire operation.
                </p>
                <Link 
                  href="/auth/sign-up"
                  className="inline-flex items-center justify-center px-8 py-4 bg-[#b2ff00] text-black font-medium rounded-lg hover:bg-[#dff8a6] transition-all duration-200 text-base"
                >
                  Get Started
                </Link>
              </div>
            </div>
            
            <div 
              ref={heroImage.ref}
              className={`relative h-[500px] lg:h-[600px] rounded-2xl overflow-hidden transition-all duration-1000 delay-200 ${
                heroImage.isVisible 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-20'
              }`}
            >
              <Image
                src="/trazo-ag/istockphoto-1289045968-612x612.jpg"
                alt="Controlled environment agriculture"
                fill
                className="object-cover transition-transform duration-700 hover:scale-105"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section - Sticky Scroll */}
      <section className="py-24 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-24">
            {/* Card 1 - Unified Operations Dashboard */}
            <div 
              ref={feature1.ref}
              className={`bg-white/5 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-white/10 hover:border-white/20 transition-all duration-700 group ${
                feature1.isVisible 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-20'
              }`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="relative h-[400px] rounded-xl overflow-hidden">
                  <Image
                    src="/trazo-ag/Desktop.png"
                    alt="Unified operations dashboard"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="space-y-4">
                  <div className="text-[0.9rem] uppercase tracking-[0.01em] leading-[1.3] text-[#b2ff00] font-normal">
                    Unified operations dashboard
                  </div>
                  <h2 className="text-[1.45rem] sm:text-[1.81rem] md:text-[2.26rem] lg:text-[2.83rem] font-[family-name:var(--font-lexend)] font-medium leading-[1.04] tracking-tight">
                    Control every container, one platform
                  </h2>
                  <p className="text-[1.13rem] leading-[1.6] text-white/70">
                    Centralize climate, compliance, and workflow management. Replace manual tracking with automated, real-time oversight for container farms of any size.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2 - Automated Regulatory Management */}
            <div 
              ref={feature2.ref}
              className={`bg-white/5 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-white/10 hover:border-white/20 transition-all duration-700 group ${
                feature2.isVisible 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-20'
              }`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="relative h-[400px] rounded-xl overflow-hidden">
                  <Image
                    src="/trazo-ag/Mockups.png"
                    alt="Automated monitoring system"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="space-y-4">
                  <div className="text-[0.9rem] uppercase tracking-[0.01em] leading-[1.3] text-[#b2ff00] font-normal">
                    Automated regulatory management
                  </div>
                  <h2 className="text-[1.45rem] sm:text-[1.81rem] md:text-[2.26rem] lg:text-[2.83rem] font-[family-name:var(--font-lexend)] font-medium leading-[1.04] tracking-tight">
                    Compliance, simplified and continuous
                  </h2>
                  <p className="text-[1.13rem] leading-[1.6] text-white/70">
                    Automate seed-to-sale records and reporting. Maintain audit readiness with live compliance status and instant notifications across all zones.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 3 - Universal Device Compatibility */}
            <div 
              ref={feature3.ref}
              className={`bg-white/5 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-white/10 hover:border-white/20 transition-all duration-700 group ${
                feature3.isVisible 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-20'
              }`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="relative h-[400px] rounded-xl overflow-hidden">
                  <Image
                    src="/trazo-ag/45492.jpg"
                    alt="Collaborative workspace"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="space-y-4">
                  <div className="text-[0.9rem] uppercase tracking-[0.01em] leading-[1.3] text-[#b2ff00] font-normal">
                    Universal device compatibility
                  </div>
                  <h2 className="text-[1.45rem] sm:text-[1.81rem] md:text-[2.26rem] lg:text-[2.83rem] font-[family-name:var(--font-lexend)] font-medium leading-[1.04] tracking-tight">
                    Integrate with any hardware fleet
                  </h2>
                  <p className="text-[1.13rem] leading-[1.6] text-white/70">
                    Connect sensors, controllers, and legacy systems. Scale effortlessly with plug-and-play integrations for micro to enterprise operations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="py-24 bg-[#111]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div 
            ref={featuresGrid.ref}
            className={`transition-all duration-1000 ${
              featuresGrid.isVisible 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-20'
            }`}
          >
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className="text-[1.45rem] sm:text-[1.81rem] md:text-[2.26rem] lg:text-[2.83rem] font-[family-name:var(--font-lexend)] font-medium leading-[1.04] tracking-tight mb-6">
                Unify container farm operations
              </h2>
              <p className="text-[1.13rem] leading-[1.6] text-white/60">
                All-in-one dashboard for environmental control, compliance, and workflow automation—purpose-built for container farming efficiency.
              </p>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Feature 1 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-[#b2ff00]/50 transition-all duration-300 group">
              <div className="w-12 h-12 mb-4 text-[#b2ff00] transition-transform duration-300 group-hover:scale-110">
                <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none">
                  <path d="M9.24998 18.7103C6.60958 17.6271 4.75 15.0307 4.75 12C4.75 8.96938 6.60958 6.37304 9.24997 5.28979" strokeWidth="1.5" strokeLinejoin="round" stroke="currentColor"></path>
                  <path d="M14.75 5.28979C17.3904 6.37303 19.25 8.96938 19.25 12.0001C19.25 15.0307 17.3904 17.6271 14.75 18.7103" strokeWidth="1.5" strokeLinejoin="round" stroke="currentColor"></path>
                  <path d="M4 19.2501L8.99998 19.2501C9.13805 19.2501 9.24998 19.1381 9.24998 19.0001L9.24997 14" strokeWidth="1.5" strokeLinejoin="round" stroke="currentColor"></path>
                  <path d="M20 4.75L15 4.75003C14.8619 4.75003 14.75 4.86196 14.75 5.00003L14.75 10.0001" strokeWidth="1.5" strokeLinejoin="round" stroke="currentColor"></path>
                </svg>
              </div>
              <h3 className="text-[1.41rem] font-[family-name:var(--font-lexend)] font-medium leading-[1.3] tracking-tight mb-3">
                Integrated environment automation
              </h3>
              <p className="text-[1rem] leading-[1.6] text-white/60">
                Automate HVAC, lighting, and irrigation for precise, consistent conditions across every container zone.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-[#b2ff00]/50 transition-all duration-300 group">
              <div className="w-12 h-12 mb-4 text-[#b2ff00] transition-transform duration-300 group-hover:scale-110">
                <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none">
                  <path fillRule="evenodd" clipRule="evenodd" d="M9.5 9C9.5 7.61929 10.6193 6.5 12 6.5C13.3807 6.5 14.5 7.61929 14.5 9C14.5 10.3807 13.3807 11.5 12 11.5C10.6193 11.5 9.5 10.3807 9.5 9ZM12 5C9.79086 5 8 6.79086 8 9C8 11.2091 9.79086 13 12 13C14.2091 13 16 11.2091 16 9C16 6.79086 14.2091 5 12 5ZM8.75 13.5C6.67893 13.5 5 15.1789 5 17.25V19H6.5V17.25C6.5 16.0074 7.50736 15 8.75 15H15.25C16.4926 15 17.5 16.0074 17.5 17.25V19H19V17.25C19 15.1789 17.3211 13.5 15.25 13.5H8.75Z" fill="currentColor"></path>
                </svg>
              </div>
              <h3 className="text-[1.41rem] font-[family-name:var(--font-lexend)] font-medium leading-[1.3] tracking-tight mb-3">
                Real-time compliance tracking
              </h3>
              <p className="text-[1rem] leading-[1.6] text-white/60">
                Maintain audit-ready records with automated, seed-to-sale documentation and regulatory monitoring.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-[#b2ff00]/50 transition-all duration-300 group">
              <div className="w-12 h-12 mb-4 text-[#b2ff00] transition-transform duration-300 group-hover:scale-110">
                <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none">
                  <path d="M4 12C8.41828 12 12 8.41828 12 4C12 8.41828 15.5817 12 20 12C15.5817 12 12 15.5817 12 20C12 15.5817 8.41828 12 4 12Z" strokeWidth="1.5" strokeLinejoin="round" stroke="currentColor"></path>
                </svg>
              </div>
              <h3 className="text-[1.41rem] font-[family-name:var(--font-lexend)] font-medium leading-[1.3] tracking-tight mb-3">
                Unified workflow management
              </h3>
              <p className="text-[1rem] leading-[1.6] text-white/60">
                Streamline scheduling, task coordination, and labor tracking with hardware-agnostic tools.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-[#b2ff00]/50 transition-all duration-300 group">
              <div className="w-12 h-12 mb-4 text-[#b2ff00] transition-transform duration-300 group-hover:scale-110">
                <svg width="100%" height="100%" viewBox="0 0 50 50" fill="none">
                  <path d="M 31.1875 3.25 C 30.9375 3.292969 30.714844 3.425781 30.5625 3.625 L 11.5 27.375 C 11.257813 27.675781 11.210938 28.085938 11.378906 28.433594 C 11.546875 28.78125 11.898438 29 12.28125 29 L 22.75 29 L 17.75 45.4375 C 17.566406 45.910156 17.765625 46.441406 18.210938 46.679688 C 18.65625 46.917969 19.207031 46.789063 19.5 46.375 L 38.5 22.625 C 38.742188 22.324219 38.789063 21.914063 38.621094 21.566406 C 38.453125 21.21875 38.101563 21 37.71875 21 L 27.625 21 L 32.28125 4.53125 C 32.371094 4.222656 32.308594 3.886719 32.109375 3.632813 C 31.910156 3.378906 31.601563 3.238281 31.28125 3.25 C 31.25 3.25 31.21875 3.25 31.1875 3.25 Z M 29.03125 8.71875 L 25.3125 21.71875 C 25.222656 22.023438 25.285156 22.351563 25.472656 22.601563 C 25.664063 22.855469 25.964844 23.003906 26.28125 23 L 35.625 23 L 21.1875 41.09375 L 25.09375 28.28125 C 25.183594 27.976563 25.121094 27.648438 24.933594 27.398438 C 24.742188 27.144531 24.441406 26.996094 24.125 27 L 14.375 27 Z" strokeWidth="1.5" strokeLinejoin="round" stroke="currentColor"></path>
                </svg>
              </div>
              <h3 className="text-[1.41rem] font-[family-name:var(--font-lexend)] font-medium leading-[1.3] tracking-tight mb-3">
                Energy and Demand Response
              </h3>
              <p className="text-[1rem] leading-[1.6] text-white/60">
                DR-ready policies to shed load safely without risking crops, and help farms cut energy costs.
              </p>
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-black relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/trazo-ag/4905cc4f-dc49-48f9-adda-01c5442920e0.avif"
            alt="Background"
            fill
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/60"></div>
        </div>
        
        <div 
          ref={ctaSection.ref}
          className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 transition-all duration-1000 ${
            ctaSection.isVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-20'
          }`}
        >
          <div className="text-center space-y-6">
            <h2 className="text-[1.45rem] sm:text-[1.81rem] md:text-[2.26rem] lg:text-[2.83rem] font-[family-name:var(--font-lexend)] font-medium leading-[1.04] tracking-tight">
              Unify, automate, and scale container farms
            </h2>
            <p className="text-[1.13rem] leading-[1.6] text-white/70 max-w-3xl mx-auto">
              Centralize compliance, automate workflows, and monitor all zones from one dashboard. Replace manual processes, reduce labor, and ensure regulatory accuracy with a hardware-agnostic platform. Integrate environmental controls, compliance tracking, and operational analytics—adaptable for any farm size or equipment setup.
            </p>
            <div className="pt-4">
              <Link 
                href="/auth/sign-up"
                className="inline-flex items-center justify-center px-8 py-4 bg-[#b2ff00] text-black font-medium rounded-lg hover:bg-[#dff8a6] transition-all duration-200 text-base"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div 
            ref={faqSection.ref}
            className={`transition-all duration-1000 ${
              faqSection.isVisible 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-20'
            }`}
          >
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <div className="text-[0.9rem] uppercase tracking-[0.01em] leading-[1.3] text-[#b2ff00] font-normal mb-4">
                Support & compliance
              </div>
              <h2 className="text-[1.45rem] sm:text-[1.81rem] md:text-[2.26rem] lg:text-[2.83rem] font-[family-name:var(--font-lexend)] font-medium leading-[1.04] tracking-tight mb-6">
                Container farm FAQ
              </h2>
              <p className="text-[1.13rem] leading-[1.6] text-white/60">
                Get detailed answers on integration, compliance, and operational workflows for container-based agriculture.
              </p>
            </div>

          <div className="space-y-4">
            <div className="border-t border-white/10 pt-6 hover:border-white/20 transition-colors duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <h3 className="text-[1.41rem] font-[family-name:var(--font-lexend)] font-medium leading-[1.3] tracking-tight lg:col-span-1">
                  How does the platform integrate with existing equipment?
                </h3>
                <div className="text-[1.13rem] leading-[1.6] text-white/60 lg:col-span-2">
                  The platform is hardware-agnostic, connecting with most industry-standard sensors, controllers, and legacy systems. Integration is managed via a unified dashboard, enabling centralized operations without replacing current infrastructure.
                </div>
              </div>
            </div>
            
            <div className="border-t border-white/10 pt-6 hover:border-white/20 transition-colors duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <h3 className="text-[1.41rem] font-[family-name:var(--font-lexend)] font-medium leading-[1.3] tracking-tight lg:col-span-1">
                  What compliance features are included?
                </h3>
                <div className="text-[1.13rem] leading-[1.6] text-white/60 lg:col-span-2">
                  Automated compliance documentation, regulatory tracking, and audit-ready reporting are built in. Seed-to-sale tracking and customizable workflows help meet local and federal requirements with minimal manual effort.
                </div>
              </div>
            </div>
            
            <div className="border-t border-white/10 pt-6 hover:border-white/20 transition-colors duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <h3 className="text-[1.41rem] font-[family-name:var(--font-lexend)] font-medium leading-[1.3] tracking-tight lg:col-span-1">
                  Can I monitor multiple containers and zones?
                </h3>
                <div className="text-[1.13rem] leading-[1.6] text-white/60 lg:col-span-2">
                  Yes. Oversee multiple containers and growing zones from a single dashboard. Real-time data and automated alerts support optimal conditions and efficient management across all operations.
                </div>
              </div>
            </div>
            
            <div className="border-t border-white/10 pt-6 hover:border-white/20 transition-colors duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <h3 className="text-[1.41rem] font-[family-name:var(--font-lexend)] font-medium leading-[1.3] tracking-tight lg:col-span-1">
                  Is the system scalable for different farm sizes?
                </h3>
                <div className="text-[1.13rem] leading-[1.6] text-white/60 lg:col-span-2">
                  The platform adapts to any scale, from micro-growers to enterprise fleets. Features and integrations expand as your operation grows, ensuring consistent control and performance at every stage.
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-black border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <Link href="mailto:info@trazo.ag" className="text-gray-400 hover:text-[#b2ff00] transition-colors text-sm">
              Contact Us
            </Link>
            
            <Link href="/" className="flex items-center gap-3 justify-end">
              <div className="w-8 h-8 relative">
                <Image 
                  src="/trazo-ag/Monogram_White.svg" 
                  alt="Trazo" 
                  fill
                  className="object-contain"
                />
              </div>
              <div className="text-lg font-bold tracking-wide uppercase">Trazo</div>
            </Link>
          </div>

          <div className="border-t border-white/10 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
              <div>© 2025 All rights reserved</div>
              <div>Made by Aptixx Enterprise</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
