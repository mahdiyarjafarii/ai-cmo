import React from 'react';
import { CompanyProfile } from '../types';
import { motion } from 'framer-motion';

interface CompanyInfoPanelProps {
  company: CompanyProfile;
}

export const CompanyInfoPanel: React.FC<CompanyInfoPanelProps> = ({ company }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col h-full bg-slate-800 rounded-lg border border-slate-700 p-6"
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-100 mb-1">{company.name}</h2>
        <p className="text-sm text-slate-400">{company.industry || 'Unknown Industry'}</p>
      </div>

      {/* Description */}
      <div className="mb-6">
        <h3 className="text-xs font-semibold text-slate-400 uppercase mb-2">
          Description
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed">
          {company.description}
        </p>
      </div>

      {/* ICP */}
      <div className="mb-6">
        <h3 className="text-xs font-semibold text-slate-400 uppercase mb-2">
          Target Audience (ICP)
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed">{company.icp}</p>
      </div>

      {/* Value Proposition */}
      <div className="mb-6">
        <h3 className="text-xs font-semibold text-slate-400 uppercase mb-2">
          Value Proposition
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed">
          {company.valueProposition}
        </p>
      </div>

      {/* Pricing */}
      {company.pricing && (
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-slate-400 uppercase mb-2">
            Pricing
          </h3>
          <div className="space-y-1 text-sm">
            <p className="text-slate-300">
              <span className="text-slate-400">Model:</span> {company.pricing.model}
            </p>
            {company.pricing.range && (
              <p className="text-slate-300">
                <span className="text-slate-400">Range:</span> {company.pricing.range}
              </p>
            )}
            {company.pricing.tiers && company.pricing.tiers.length > 0 && (
              <div>
                <p className="text-slate-400 mb-1">Tiers:</p>
                <div className="flex flex-wrap gap-2">
                  {company.pricing.tiers.map((tier, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-slate-700 text-slate-300 rounded text-xs"
                    >
                      {tier}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Features */}
      {company.features && company.features.length > 0 && (
        <div className="mt-auto">
          <h3 className="text-xs font-semibold text-slate-400 uppercase mb-3">
            Key Features
          </h3>
          <div className="space-y-2">
            {company.features.slice(0, 5).map((feature, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-blue-400 text-sm">✓</span>
                <span className="text-sm text-slate-300">{feature}</span>
              </div>
            ))}
            {company.features.length > 5 && (
              <p className="text-xs text-slate-500">
                +{company.features.length - 5} more features
              </p>
            )}
          </div>
        </div>
      )}

      {/* Visit Website */}
      <a
        href={company.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 w-full px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 text-center text-sm rounded transition"
      >
        Visit Website →
      </a>
    </motion.div>
  );
};
