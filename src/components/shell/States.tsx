import React from 'react';
import { AlertTriangle, RefreshCw, FolderSearch } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onDismiss }) => {
  return (
    <div className="bg-red-500/15 border-l-4 border-red-500 text-red-200 px-4 py-2.5 text-xs flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
        <span>{message}</span>
      </div>
      <button
        onClick={onDismiss}
        className="px-2 py-0.5 bg-red-950/60 hover:bg-red-900 border border-red-800/80 rounded text-red-200 text-[11px]"
      >
        Dismiss
      </button>
    </div>
  );
};

interface PlaceholderModuleProps {
  title: string;
  batchInfo: string;
  description: string;
}

export const PlaceholderModule: React.FC<PlaceholderModuleProps> = ({ title, batchInfo, description }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-background select-text">
      <div className="p-4 bg-surface rounded-2xl border border-slate-800 shadow-xl mb-4 text-slate-400">
        <FolderSearch className="w-10 h-10 text-accent/70" />
      </div>
      <h3 className="text-lg font-semibold text-slate-100 mb-1">{title}</h3>
      <span className="inline-block px-2.5 py-0.5 mb-3 text-[11px] font-mono bg-accent/15 border border-accent/30 text-accent rounded-full">
        {batchInfo}
      </span>
      <p className="max-w-md text-xs text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
};

export const LoadingSpinner: React.FC<{ label?: string }> = ({ label = 'Calculating...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-2 text-slate-400">
      <RefreshCw className="w-6 h-6 animate-spin text-accent" />
      <span className="text-xs font-mono">{label}</span>
    </div>
  );
};
