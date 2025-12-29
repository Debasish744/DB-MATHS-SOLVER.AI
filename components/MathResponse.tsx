
import React, { useEffect, useRef } from 'react';
import { SolveResponse } from '../types';

declare const katex: any;

const MathRenderer: React.FC<{ tex: string; className?: string }> = ({ tex, className = "" }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && typeof katex !== 'undefined') {
      try {
        const parts = tex.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);
        containerRef.current.innerHTML = '';
        
        parts.forEach(part => {
          const span = document.createElement('span');
          if (part.startsWith('$$') && part.endsWith('$$')) {
            const math = part.slice(2, -2);
            katex.render(math, span, { displayMode: true, throwOnError: false });
          } else if (part.startsWith('$') && part.endsWith('$')) {
            const math = part.slice(1, -1);
            katex.render(math, span, { displayMode: false, throwOnError: false });
          } else {
            span.textContent = part;
          }
          containerRef.current?.appendChild(span);
        });
      } catch (e) {
        if (containerRef.current) containerRef.current.textContent = tex;
      }
    }
  }, [tex]);

  return <div ref={containerRef} className={`math-render leading-relaxed ${className}`} />;
};

interface MathResponseProps {
  data: SolveResponse;
  onSpeech: (text: string) => void;
}

const MathResponse: React.FC<MathResponseProps> = ({ data, onSpeech }) => {
  const handleReadAloud = () => {
    const textToRead = `
      Problem: ${data.description}.
      Main concepts: ${data.concepts.join(', ')}.
      Steps: ${data.steps.map(s => `${s.title}: ${s.explanation}`).join('. ')}
      Final Result: ${data.finalAnswer}.
      Tip: ${data.tutoringTip || ''}
    `;
    onSpeech(textToRead);
  };

  return (
    <div className="flex flex-col gap-8 text-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Description Section */}
      <section className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-widest">Problem Analysis</h3>
        </div>
        <p className="text-slate-700 font-medium leading-relaxed">{data.description}</p>
      </section>

      {/* Concepts Section */}
      <section>
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Key Mechanisms</h3>
        <div className="flex flex-wrap gap-2">
          {data.concepts.map((concept, idx) => (
            <span key={idx} className="px-4 py-1.5 bg-indigo-600/5 text-indigo-600 rounded-lg text-xs font-bold border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all cursor-default">
              {concept}
            </span>
          ))}
        </div>
      </section>

      {/* Steps Section */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">Solution Pathway</h3>
        {data.steps.map((step, idx) => (
          <div key={idx} className="group flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center text-xs font-bold text-slate-400 group-hover:border-indigo-500 group-hover:text-indigo-500 transition-colors shadow-sm">
                {idx + 1}
              </div>
              <div className="flex-1 w-[2px] bg-slate-50 group-last:bg-transparent" />
            </div>
            <div className="flex-1 pb-8 group-last:pb-2">
              <h4 className="font-bold text-slate-800 text-sm mb-1">{step.title}</h4>
              <p className="text-slate-500 text-xs mb-3 leading-relaxed">{step.explanation}</p>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 group-hover:shadow-md transition-shadow">
                <MathRenderer tex={step.math} className="text-slate-800" />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Final Answer Section */}
      <section className="relative overflow-hidden bg-slate-900 text-white p-8 rounded-3xl shadow-xl shadow-indigo-100">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 rounded-full -ml-12 -mb-12 blur-2xl" />
        
        <div className="relative z-10 text-center">
          <h3 className="text-[10px] font-bold text-indigo-300 uppercase tracking-[0.2em] mb-3">Mathematical Result</h3>
          <div className="text-2xl font-black">
            <MathRenderer tex={data.finalAnswer} />
          </div>
        </div>
      </section>

      {/* Tutoring Tip Section */}
      {data.tutoringTip && (
        <section className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex gap-4 items-start shadow-sm">
          <div className="p-2 bg-amber-100 rounded-xl text-amber-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"></path><path d="M9 18h6"></path><path d="M10 22h4"></path></svg>
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-800 mb-1">Tutor's Advice</h4>
            <p className="text-amber-700 text-sm italic">"{data.tutoringTip}"</p>
          </div>
        </section>
      )}

      <button 
        onClick={handleReadAloud}
        className="group flex items-center justify-center gap-3 py-4 px-8 bg-white border-2 border-slate-100 text-slate-600 font-bold rounded-2xl hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm active:scale-95"
      >
        <svg className="group-hover:animate-pulse" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
        Play Explainer Audio
      </button>
    </div>
  );
};

export default MathResponse;
