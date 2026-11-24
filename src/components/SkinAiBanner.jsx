import React, { useMemo } from 'react';
import { Sparkles, Check, CheckCircle2, ChevronRight, Zap, Target, Heart, Award, ShieldAlert } from 'lucide-react';
import { SKIN_ISSUE_PRESETS, analyzeSkinIssue } from '../utils/skinAiUtils';

export default function SkinAiBanner({ 
  issue = '', 
  onChangeIssue, 
  onSelectCourse,
  compact = false 
}) {
  const analysis = useMemo(() => analyzeSkinIssue(issue), [issue]);

  const togglePreset = (preset) => {
    if (!onChangeIssue) return;
    const current = String(issue || '').trim();
    if (!current) {
      onChangeIssue(preset.text);
      return;
    }

    // Check if preset is already in issue
    const regex = new RegExp(preset.label.split('/')[0], 'i');
    if (regex.test(current)) {
      // Remove it
      const parts = current.split(/[,，\s]+/).filter(p => p && !regex.test(p));
      onChangeIssue(parts.join(', '));
    } else {
      // Append it
      onChangeIssue(`${current}, ${preset.text}`);
    }
  };

  const isPresetActive = (preset) => {
    if (!issue) return false;
    const key = preset.label.split('/')[0];
    return new RegExp(key, 'i').test(issue);
  };

  return (
    <div className="space-y-2 mt-1 mb-2">
      {/* Quick Problem Selection Chips */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <span>แตะเลือกปัญหาผิวเพื่อวิเคราะห์ด่วน:</span>
          </span>
          {issue && (
            <button 
              type="button" 
              onClick={() => onChangeIssue('')}
              className="text-[10px] text-slate-400 hover:text-red-500 transition-colors"
            >
              ล้างค่า
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SKIN_ISSUE_PRESETS.map((p) => {
            const active = isPresetActive(p);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => togglePreset(p)}
                className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer select-none border ${
                  active 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/20 ring-2 ring-indigo-200' 
                    : 'bg-white hover:bg-indigo-50/80 text-slate-700 border-slate-200 hover:border-indigo-300'
                }`}
              >
                <span>{p.icon}</span>
                <span>{p.label}</span>
                {active && <Check size={12} className="ml-0.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* AI Analysis Result Card */}
      <div className="bg-gradient-to-br from-indigo-50/90 via-purple-50/70 to-teal-50/90 border-2 border-indigo-100 rounded-2xl p-3 sm:p-3.5 shadow-sm transition-all relative overflow-hidden">
        {/* Glow ambient background element */}
        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-gradient-to-br from-indigo-300/20 to-teal-300/20 rounded-full blur-xl pointer-events-none"></div>

        {/* Banner Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles size={13} />
            </div>
            <div>
              <span className="text-xs font-black text-indigo-950 flex items-center gap-1">
                AI วิเคราะห์ผิว & แนะนำโปรแกรมดูแล
              </span>
            </div>
          </div>
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/90 text-indigo-700 border border-indigo-200 shadow-2xs">
            Iris AI Clinical
          </span>
        </div>

        {analysis ? (
          <div className="space-y-2.5">
            {/* Clinical Priorities */}
            <div className="space-y-1.5">
              {analysis.priorities.map((pr, idx) => (
                <div key={idx} className="bg-white/85 backdrop-blur-xs p-2.5 rounded-xl border border-indigo-100/80 shadow-2xs">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <span>{pr.icon}</span>
                      <span>{pr.phase}</span>
                    </span>
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {pr.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                    💡 {pr.tip}
                  </p>
                </div>
              ))}
            </div>

            {/* Recommended Clinic Treatments */}
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Target size={11} className="text-indigo-600" />
                <span>คอร์ส/บริการในคลินิกที่ AI แนะนำตรงจุด:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {analysis.courses.map((course, idx) => (
                  <div
                    key={idx}
                    onClick={() => onSelectCourse && onSelectCourse(course)}
                    className={`p-2 rounded-xl bg-white border border-indigo-100 hover:border-indigo-300 transition-all shadow-2xs flex items-center justify-between gap-2 ${
                      onSelectCourse ? 'cursor-pointer hover:bg-indigo-50/50 active:scale-98' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-indigo-900 truncate">
                          {course.name}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 shrink-0">
                          {course.tag}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">
                        {course.highlight}
                      </p>
                    </div>
                    {onSelectCourse && (
                      <ChevronRight size={14} className="text-indigo-400 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Auto-save Info Footer */}
            <div className="flex items-center justify-between text-[10px] text-indigo-700 font-bold bg-indigo-100/60 px-2.5 py-1 rounded-lg">
              <span className="flex items-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-600" />
                ผลวิเคราะห์และคอร์สแนะนำจะถูกบันทึกส่งต่อไปยังหน้า POS ให้พนักงานทันที
              </span>
            </div>
          </div>
        ) : (
          <div className="p-2.5 bg-white/70 backdrop-blur-xs rounded-xl border border-indigo-100/60 text-center">
            <p className="text-xs text-slate-600 font-medium">
              ✨ แตะเลือกปัญหาผิวด้านบน หรือพิมพ์ข้อความในช่องด้านบน เพื่อให้ AI วิเคราะห์ลำดับการรักษาและจับคู่คอร์สที่ตรงจุดให้โดยอัตโนมัติ
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
