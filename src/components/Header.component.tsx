import Image from "next/image";
import React from "react";
import tavros from "../../public/tavros-logo.png";

const StoicHeader: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-[#1e293b] via-[#0f1419] to-[#1e293b] border-b border-[#334155] border-opacity-50 sticky top-0 z-50 shadow-lg shadow-[#000000]/50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-8">
        {/* Logo Image */}
        <div className="flex-shrink-0 hover:scale-105 transition-transform duration-300">
          <Image 
            src={tavros} 
            alt="Tavros logo" 
            width={56}
            height={56}
            className="rounded-lg border border-[#334155] shadow-md"
          />
        </div>

        {/* Branding */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="h-10 w-1.5 bg-gradient-to-b from-[#60a5fa] via-[#3b82f6] to-transparent rounded-full"></div>
          <div>
            <h1 className="text-2xl font-black text-[#e4e9f1] tracking-wider uppercase leading-none">
              Tavros
            </h1>
            <p className="text-[#60a5fa] text-xs tracking-widest uppercase font-bold mt-1 opacity-90">
              Forja tu espíritu
            </p>
          </div>
        </div>

        {/* Core Values - Right Side */}
        <nav className="flex items-center gap-6 md:gap-10 ml-auto">
          <div className="text-center group cursor-pointer">
            <p className="text-[#60a5fa] text-xs uppercase tracking-widest font-bold mb-1 group-hover:text-[#93c5fd] transition-colors">
              I
            </p>
            <p className="text-sm font-black text-[#e4e9f1] uppercase tracking-wide group-hover:text-[#60a5fa] transition-colors">
              Fuerza
            </p>
            <div className="h-0.5 bg-gradient-to-r from-transparent via-[#60a5fa] to-transparent opacity-0 group-hover:opacity-100 transition-opacity mt-1"></div>
          </div>

          <div className="hidden md:block w-0.5 h-14 bg-gradient-to-b from-transparent via-[#334155] to-transparent opacity-60"></div>

          <div className="text-center group cursor-pointer">
            <p className="text-[#60a5fa] text-xs uppercase tracking-widest font-bold mb-1 group-hover:text-[#93c5fd] transition-colors">
              II
            </p>
            <p className="text-sm font-black text-[#e4e9f1] uppercase tracking-wide group-hover:text-[#60a5fa] transition-colors">
              Poder
            </p>
            <div className="h-0.5 bg-gradient-to-r from-transparent via-[#60a5fa] to-transparent opacity-0 group-hover:opacity-100 transition-opacity mt-1"></div>
          </div>

          <div className="hidden md:block w-0.5 h-14 bg-gradient-to-b from-transparent via-[#334155] to-transparent opacity-60"></div>

          <div className="text-center group cursor-pointer">
            <p className="text-[#60a5fa] text-xs uppercase tracking-widest font-bold mb-1 group-hover:text-[#93c5fd] transition-colors">
              III
            </p>
            <p className="text-sm font-black text-[#e4e9f1] uppercase tracking-wide group-hover:text-[#60a5fa] transition-colors">
              Vitalidad
            </p>
            <div className="h-0.5 bg-gradient-to-r from-transparent via-[#60a5fa] to-transparent opacity-0 group-hover:opacity-100 transition-opacity mt-1"></div>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default StoicHeader;