import { ArrowLeft } from 'lucide-react';
import { ROLES } from '@/lib/gameConfig';
import type { RoleType } from '@/types';

interface RolesSectionProps {
  onBack: () => void;
}

// 角色分类
const ROLE_CATEGORIES_DISPLAY = {
  good_god: {
    title: '好人阵营 - 神职',
    roles: ['seer', 'witch', 'hunter', 'guard', 'idiot', 'elder', 'knight', 'gravedigger', 'crow', 'magician', 'dreamer', 'demonhunter', 'muter', 'miracle', 'pure', 'prince', 'count', 'alchemist'] as RoleType[],
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30'
  },
  good_villager: {
    title: '好人阵营 - 平民',
    roles: ['villager', 'hooligan'] as RoleType[],
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30'
  },
  werewolf: {
    title: '狼人阵营',
    roles: ['werewolf', 'whitewolf', 'wolfgun', 'wolfbeauty', 'gargoyle', 'hiddenwolf', 'ghostknight', 'bloodmoon', 'nightmare', 'wolfwitch', 'redmoon'] as RoleType[],
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30'
  },
  neutral: {
    title: '第三方阵营',
    roles: ['cupid', 'admirer'] as RoleType[],
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30'
  }
};

export function RolesSection({ onBack }: RolesSectionProps) {
  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* 头部 */}
      <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 z-10">
        <div className="flex items-center gap-4 p-4">
          <button 
            onClick={onBack}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-white">角色介绍</h1>
        </div>
      </div>

      {/* 内容 */}
      <div className="p-4 pb-20">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* 角色总数 */}
          <div className="text-center py-4">
            <p className="text-slate-400 text-sm">共 <span className="text-purple-400 font-bold text-lg">32</span> 种角色</p>
          </div>

          {/* 各阵营角色 */}
          {Object.entries(ROLE_CATEGORIES_DISPLAY).map(([key, category]) => (
            <div key={key} className="space-y-3">
              <h2 className={`text-lg font-bold ${category.color}`}>{category.title}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {category.roles.map(roleType => {
                  const role = ROLES[roleType];
                  if (!role) return null;
                  
                  return (
                    <div 
                      key={roleType}
                      className={`${category.bgColor} ${category.borderColor} border rounded-xl p-3 hover:scale-[1.02] transition-transform`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{role.icon}</span>
                        <span className={`font-bold ${category.color}`}>{role.name}</span>
                      </div>
                      <p className="text-slate-400 text-xs leading-relaxed">{role.ability}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* 提示 */}
          <div className="bg-slate-800/50 rounded-xl p-4 text-center">
            <p className="text-slate-500 text-sm">
              创建房间时可根据人数和玩法自由组合角色
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
