'use client'
import Image from "next/image";
import React, { useState } from "react";
import tavros from "../../public/tavros-logo.png";

const StoicHeader: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-gradient-to-r from-[#1e293b] via-[#0f1419] to-[#1e293b] border-b border-[#334155] border-opacity-50 sticky top-0 z-50 shadow-lg shadow-[#000000]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo Image */}
          <div className="flex-shrink-0 hover:scale-105 transition-transform duration-300">
            <Image 
              src={tavros} 
              alt="Tavros logo" 
              width={48}
              height={48}
              className="rounded-lg border border-[#334155] shadow-md w-10 h-10 sm:w-14 sm:h-14"
            />
          </div>

          {/* Branding - Hidden on mobile, visible on md and up */}
          <div className="hidden sm:flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="h-8 sm:h-10 w-1 sm:w-1.5 bg-gradient-to-b from-[#60a5fa] via-[#3b82f6] to-transparent rounded-full"></div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#e4e9f1] tracking-wider uppercase leading-none">
                Tavros
              </h1>
              <p className="text-[#60a5fa] text-xs tracking-widest uppercase font-bold mt-1 opacity-90">
                Forja tu espíritu
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-4 lg:gap-6 ml-auto">
            <div className="text-center group cursor-pointer">
              <p className="text-[#60a5fa] text-xs uppercase tracking-widest font-bold mb-1 group-hover:text-[#93c5fd] transition-colors">
                I
              </p>
              <p className="text-xs lg:text-sm font-black text-[#e4e9f1] uppercase tracking-wide group-hover:text-[#60a5fa] transition-colors">
                Fuerza
              </p>
              <div className="h-0.5 bg-gradient-to-r from-transparent via-[#60a5fa] to-transparent opacity-0 group-hover:opacity-100 transition-opacity mt-1"></div>
            </div>

            <div className="w-0.5 h-12 bg-gradient-to-b from-transparent via-[#334155] to-transparent opacity-60"></div>

            <div className="text-center group cursor-pointer">
              <p className="text-[#60a5fa] text-xs uppercase tracking-widest font-bold mb-1 group-hover:text-[#93c5fd] transition-colors">
                II
              </p>
              <p className="text-xs lg:text-sm font-black text-[#e4e9f1] uppercase tracking-wide group-hover:text-[#60a5fa] transition-colors">
                Poder
              </p>
              <div className="h-0.5 bg-gradient-to-r from-transparent via-[#60a5fa] to-transparent opacity-0 group-hover:opacity-100 transition-opacity mt-1"></div>
            </div>

            <div className="w-0.5 h-12 bg-gradient-to-b from-transparent via-[#334155] to-transparent opacity-60"></div>

            <div className="text-center group cursor-pointer">
              <p className="text-[#60a5fa] text-xs uppercase tracking-widest font-bold mb-1 group-hover:text-[#93c5fd] transition-colors">
                III
              </p>
              <p className="text-xs lg:text-sm font-black text-[#e4e9f1] uppercase tracking-wide group-hover:text-[#60a5fa] transition-colors">
                Vitalidad
              </p>
              <div className="h-0.5 bg-gradient-to-r from-transparent via-[#60a5fa] to-transparent opacity-0 group-hover:opacity-100 transition-opacity mt-1"></div>
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden flex flex-col gap-1.5 p-2 hover:bg-[#334155] rounded-lg transition-colors"
          >
            <div className={`w-5 h-0.5 bg-[#60a5fa] transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></div>
            <div className={`w-5 h-0.5 bg-[#60a5fa] transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`}></div>
            <div className={`w-5 h-0.5 bg-[#60a5fa] transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></div>
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <nav className="lg:hidden mt-4 pb-4 border-t border-[#334155] pt-4 space-y-4">
            <div className="text-center group cursor-pointer py-2">
              <p className="text-[#60a5fa] text-xs uppercase tracking-widest font-bold mb-1">I</p>
              <p className="text-sm font-black text-[#e4e9f1] uppercase tracking-wide">Fuerza</p>
            </div>

            <div className="text-center group cursor-pointer py-2">
              <p className="text-[#60a5fa] text-xs uppercase tracking-widest font-bold mb-1">II</p>
              <p className="text-sm font-black text-[#e4e9f1] uppercase tracking-wide">Poder</p>
            </div>

            <div className="text-center group cursor-pointer py-2">
              <p className="text-[#60a5fa] text-xs uppercase tracking-widest font-bold mb-1">III</p>
              <p className="text-sm font-black text-[#e4e9f1] uppercase tracking-wide">Vitalidad</p>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default StoicHeader;