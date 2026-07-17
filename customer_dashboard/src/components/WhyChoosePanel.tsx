import React from 'react';
import { ArrowRight, Users, CheckCircle, Cpu, Clock } from 'lucide-react';

const WhyChoosePanel: React.FC = () => {
  const points = [
    {
      icon: <Users className="w-5 h-5 text-[#006670]" />,
      title: "500+ Clinics Trust Us",
      desc: "Widespread medical network support"
    },
    {
      icon: <CheckCircle className="w-5 h-5 text-[#006670]" />,
      title: "Premium Quality Products",
      desc: "Certified genuine equipment only"
    },
    {
      icon: <Cpu className="w-5 h-5 text-[#006670]" />,
      title: "Advanced Technology Solutions",
      desc: "Modern digital tools for practices"
    },
    {
      icon: <Clock className="w-5 h-5 text-[#006670]" />,
      title: "Reliable After-Sales Support",
      desc: "On-site and remote repair support"
    }
  ];

  return (
    <>
      {/* Desktop view */}
      <section className="hidden lg:block max-w-7xl mx-auto px-8 py-12 select-none">
        <div className="bg-gradient-mint rounded-3xl border border-[#D5E6E5] overflow-hidden grid grid-cols-12 items-center min-h-[350px]">
          
          {/* Left Column: Headline copy */}
          <div className="col-span-4 p-10 text-left flex flex-col items-start justify-center">
            <span className="text-xs font-extrabold text-[#006670] tracking-widest uppercase mb-2 block font-display">
              WHY CHOOSE FAAZO?
            </span>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-tight mb-6 font-display">
              Trusted by Dentists. Built for Excellence.
            </h2>
            <a 
              href="#about"
              className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#006670] hover:bg-[#004e56] text-white text-sm font-bold shadow transition-all cursor-pointer"
            >
              Learn More
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>

          {/* Center Column: Interactive Stats points */}
          <div className="col-span-5 p-4 grid grid-cols-1 gap-6 text-left border-l border-r border-slate-200/50">
            {points.map((pt, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm border border-[#e6f3f5]">
                  {pt.icon}
                </div>
                <div>
                  <h4 className="text-[13.5px] font-bold text-slate-800 leading-none">
                    {pt.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {pt.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Smiling Dentist image */}
          <div className="col-span-3 h-full w-full flex items-end justify-center bg-gradient-to-t from-[#DCEFEF]/20 to-transparent">
            <img 
              src="/images/dentist_smiling.png" 
              alt="Smiling Professional Indian Dentist" 
              style={{
                WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
                maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)'
              }}
              className="h-auto max-h-[340px] w-auto object-contain block drop-shadow-[0_-5px_15px_rgba(0,0,0,0.04)]"
            />
          </div>

        </div>
      </section>

      {/* Mobile view */}
      <section className="block lg:hidden w-full px-5 py-6 select-none" id="why-choose-panel-mobile">
        <div className="bg-gradient-mint rounded-2xl border border-[#D5E6E5] p-6 flex flex-col gap-6 text-left">
          
          {/* Top: Headline */}
          <div>
            <span className="text-[10px] font-extrabold text-[#006670] tracking-widest uppercase mb-1.5 block font-sans">
              WHY CHOOSE FAAZO?
            </span>
            <h2 className="text-[28px] font-black text-slate-800 tracking-tight leading-tight font-display mb-4">
              Trusted by Dentists. Built for Excellence.
            </h2>
            <a 
              href="#about"
              className="group inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-full bg-[#006670] hover:bg-[#004e56] text-white text-xs font-bold shadow transition-all cursor-pointer"
            >
              Learn More
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Center: Stats points */}
          <div className="flex flex-col gap-5 py-4 border-t border-b border-slate-200/50">
            {points.map((pt, i) => (
              <div key={i} className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm border border-[#e6f3f5]">
                  {pt.icon}
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-slate-800 leading-none">
                    {pt.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 font-sans">
                    {pt.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom: Dentist Image */}
          <div className="w-full flex justify-center bg-gradient-to-t from-[#DCEFEF]/20 to-transparent pt-4">
            <img 
              src="/images/dentist_smiling.png" 
              alt="Smiling Professional Indian Dentist" 
              style={{
                WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
                maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)'
              }}
              className="h-auto max-h-[220px] w-auto object-contain block drop-shadow-[0_-5px_15px_rgba(0,0,0,0.04)]"
            />
          </div>

        </div>
      </section>
    </>
  );
};

export default WhyChoosePanel;
