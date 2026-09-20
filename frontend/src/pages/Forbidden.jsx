import React from 'react';
import { useNavigate } from 'react-router-dom';

const Forbidden = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 select-none">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 bg-amber-950/80 border border-amber-600/30 rounded-2xl mx-auto flex items-center justify-center text-3xl shadow-lg">
          ??
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-800">
            HTTP 403 Forbidden
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight mt-2">Access Restricted</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your user account does not have sufficient role privileges to view or perform actions on this section.
          </p>
        </div>

        <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-400 text-left space-y-1">
          <p className="font-semibold text-slate-300">Need Access?</p>
          <p className="text-[11px] leading-relaxed">
            Please reach out to your Company Admin or Project Manager to assign the required permissions.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold py-2.5 px-4 rounded-xl border border-slate-700 transition"
          >
            ? Go Back
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-blue-600/20 transition"
          >
            ?? Home Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default Forbidden;
