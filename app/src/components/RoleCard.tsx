import { useState } from 'react';
import { ROLES, getRoleTeam } from '@/lib/gameConfig';
import type { RoleType } from '@/types';
import admirerAvatar from '../../public/avatars/admirer.png';
import alchemistAvatar from '../../public/avatars/alchemist.png';
import bomberAvatar from '../../public/avatars/bomber.png';
import countAvatar from '../../public/avatars/count.png';
import crowAvatar from '../../public/avatars/crow.png';
import cupidAvatar from '../../public/avatars/cupid.png';
import demonhunterAvatar from '../../public/avatars/demonhunter.png';
import dreamerAvatar from '../../public/avatars/dreamer.png';
import elderAvatar from '../../public/avatars/elder.png';
import gargoyleAvatar from '../../public/avatars/gargoyle.png';
import gravediggerAvatar from '../../public/avatars/gravedigger.png';
import guardAvatar from '../../public/avatars/guard.png';
import hiddenwolfAvatar from '../../public/avatars/hiddenwolf.png';
import hooliganAvatar from '../../public/avatars/hooligan.png';
import hunterAvatar from '../../public/avatars/hunter.png';
import idiotAvatar from '../../public/avatars/idiot.png';
import knightAvatar from '../../public/avatars/knight.png';
import magicianAvatar from '../../public/avatars/magician.png';
import miracleAvatar from '../../public/avatars/miracle.png';
import muterAvatar from '../../public/avatars/muter.png';
import nightmareAvatar from '../../public/avatars/nightmare.png';
import princeAvatar from '../../public/avatars/prince.png';
import pureAvatar from '../../public/avatars/pure.png';
import seerAvatar from '../../public/avatars/seer.png';
import thiefAvatar from '../../public/avatars/thief.png';
import villagerAvatar from '../../public/avatars/villager.png';
import werewolfAvatar from '../../public/avatars/werewolf.png';
import whitewolfAvatar from '../../public/avatars/whitewolf.png';
import witchAvatar from '../../public/avatars/witch.png';
import wolfbeautyAvatar from '../../public/avatars/wolfbeauty.png';
import wolfgunAvatar from '../../public/avatars/wolfgun.png';
import wolfwitchAvatar from '../../public/avatars/wolfwitch.png';
import cardBackImage from '../../public/cards/card_back.png';

interface RoleCardProps {
  role: RoleType;
  size?: 'small' | 'medium' | 'large';
  revealed?: boolean;
  onReveal?: (revealed: boolean) => void;
  showFlipHint?: boolean;
}

// 角色头像图片映射（正方形头像）
const ROLE_AVATARS: Record<string, string> = {
  werewolf: werewolfAvatar,
  seer: seerAvatar,
  witch: witchAvatar,
  villager: villagerAvatar,
  hunter: hunterAvatar,
  idiot: idiotAvatar,
  guard: guardAvatar,
  elder: elderAvatar,
  whitewolf: whitewolfAvatar,
  wolfgun: wolfgunAvatar,
  knight: knightAvatar,
  gravedigger: gravediggerAvatar,
  crow: crowAvatar,
  magician: magicianAvatar,
  dreamer: dreamerAvatar,
  demonhunter: demonhunterAvatar,
  muter: muterAvatar,
  miracle: miracleAvatar,
  pure: pureAvatar,
  prince: princeAvatar,
  count: countAvatar,
  alchemist: alchemistAvatar,
  hooligan: hooliganAvatar,
  wolfbeauty: wolfbeautyAvatar,
  gargoyle: gargoyleAvatar,
  wolfwitch: wolfwitchAvatar,
  hiddenwolf: hiddenwolfAvatar,
  cupid: cupidAvatar,
  thief: thiefAvatar,
  bomber: bomberAvatar,
  admirer: admirerAvatar,
  nightmare: nightmareAvatar,
};

// 获取角色头像图片，如果没有则使用默认
const getRoleAvatar = (role: RoleType): string => {
  return ROLE_AVATARS[role] || villagerAvatar;
};

export function RoleCard({ 
  role, 
  size = 'medium', 
  revealed = false, 
  onReveal,
  showFlipHint = true 
}: RoleCardProps) {
  const [isFlipping, setIsFlipping] = useState(false);
  const [internalRevealed, setInternalRevealed] = useState(revealed);
  const roleInfo = ROLES[role];
  const team = getRoleTeam(role);
  
  // 优先使用外部传入的revealed状态
  const isRevealed = revealed !== undefined ? revealed : internalRevealed;
  
  const handleFlip = () => {
    if (isFlipping) return;
    
    setIsFlipping(true);
    const newRevealed = !isRevealed;
    
    if (onReveal) {
      onReveal(newRevealed);
    } else {
      setInternalRevealed(newRevealed);
    }
    
    setTimeout(() => setIsFlipping(false), 600);
  };

  const sizeClasses = {
    small: 'w-24 h-36',
    medium: 'w-40 h-56',
    large: 'w-52 h-72',
  };

  const roleAvatar = getRoleAvatar(role);

  return (
    <div className="flex flex-col items-center">
      {/* 3D翻转卡牌容器 */}
      <div 
        onClick={handleFlip}
        className={`${sizeClasses[size]} relative cursor-pointer perspective-1000`}
        style={{ perspective: '1000px' }}
      >
        {/* 卡牌翻转容器 */}
        <div 
          className="relative w-full h-full transition-transform duration-500"
          style={{ 
            transformStyle: 'preserve-3d',
            transform: isRevealed ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}
        >
          {/* 背面 - 牌背图片 */}
          <div 
            className="absolute inset-0 rounded-xl overflow-hidden shadow-2xl"
            style={{ 
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden'
            }}
          >
            <img 
              src={cardBackImage} 
              alt="牌背"
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* 正面 - 角色头像卡片 */}
          <div 
            className="absolute inset-0 rounded-xl overflow-hidden shadow-2xl flex flex-col"
            style={{ 
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              background: `linear-gradient(180deg, ${roleInfo.bgColor} 0%, #1a1a2e 100%)`
            }}
          >
            {/* 角色头像 - 正方形 */}
            <div className="flex-1 flex items-center justify-center p-4">
              <div 
                className="w-24 h-24 rounded-2xl overflow-hidden shadow-lg border-2"
                style={{ borderColor: roleInfo.borderColor }}
              >
                <img 
                  src={roleAvatar} 
                  alt={roleInfo.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // 图片加载失败时显示图标
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<span class="text-5xl flex items-center justify-center h-full">${roleInfo.icon}</span>`;
                    }
                  }}
                />
              </div>
            </div>
            
            {/* 角色信息 */}
            <div className="px-4 pb-4 text-center">
              <h3 
                className="text-lg font-bold text-white mb-1"
                style={{ textShadow: `0 0 10px ${roleInfo.borderColor}` }}
              >
                {roleInfo.name}
              </h3>
              <p className="text-xs text-white/70 line-clamp-2">
                {roleInfo.ability}
              </p>
            </div>
          </div>
        </div>
        
        {/* 点击波纹效果 */}
        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          <div className={`absolute inset-0 bg-white/10 transition-opacity duration-300 ${isFlipping ? 'opacity-100' : 'opacity-0'}`} />
        </div>
      </div>
      
      {/* 翻转提示 */}
      {showFlipHint && size === 'large' && (
        <div className="mt-4 text-slate-400 text-sm animate-pulse">
          {isRevealed ? '点击隐藏身份' : '点击查看身份'}
        </div>
      )}
      
      {/* 阵营标识（仅在揭示时显示） */}
      {isRevealed && (
        <div 
          className="mt-3 px-4 py-1.5 rounded-full text-sm font-medium"
          style={{ 
            backgroundColor: team === 'good' ? 'rgba(34, 197, 94, 0.2)' : 
                            team === 'evil' ? 'rgba(239, 68, 68, 0.2)' : 
                            'rgba(107, 114, 128, 0.2)',
            color: team === 'good' ? '#86efac' : 
                   team === 'evil' ? '#fca5a5' : 
                   '#d1d5db',
            border: `1px solid ${team === 'good' ? 'rgba(34, 197, 94, 0.4)' : 
                                    team === 'evil' ? 'rgba(239, 68, 68, 0.4)' : 
                                    'rgba(107, 114, 128, 0.4)'}`
          }}
        >
          {team === 'good' ? '好人阵营' : team === 'evil' ? '狼人阵营' : '中立阵营'}
        </div>
      )}
    </div>
  );
}

// 角色详情弹窗
interface RoleDetailModalProps {
  role: RoleType;
  isOpen: boolean;
  onClose: () => void;
}

export function RoleDetailModal({ role, isOpen, onClose }: RoleDetailModalProps) {
  if (!isOpen) return null;
  
  const roleInfo = ROLES[role];
  const team = getRoleTeam(role);
  
  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 rounded-2xl p-6 max-w-sm w-full border-2"
        style={{ borderColor: roleInfo.borderColor }}
        onClick={e => e.stopPropagation()}
      >
        {/* 角色卡片 */}
        <div className="flex justify-center mb-6">
          <RoleCard role={role} size="large" revealed={true} showFlipHint={false} />
        </div>
        
        {/* 角色信息 */}
        <div className="space-y-4">
          <div className="text-center">
            <h2 
              className="text-2xl font-bold mb-1"
              style={{ color: roleInfo.borderColor }}
            >
              {roleInfo.name}
            </h2>
            <span 
              className="text-sm px-3 py-1 rounded-full"
              style={{ 
                backgroundColor: team === 'good' ? 'rgba(34, 197, 94, 0.2)' : 
                                team === 'evil' ? 'rgba(239, 68, 68, 0.2)' : 
                                'rgba(107, 114, 128, 0.2)',
                color: team === 'good' ? '#86efac' : 
                       team === 'evil' ? '#fca5a5' : 
                       '#d1d5db'
              }}
            >
              {team === 'good' ? '好人阵营' : team === 'evil' ? '狼人阵营' : '中立'}
            </span>
          </div>
          
          <div className="bg-slate-800/50 rounded-xl p-4">
            <h3 className="text-slate-400 text-sm mb-2">技能说明</h3>
            <p className="text-white">{roleInfo.description}</p>
          </div>
          
          <div className="bg-slate-800/50 rounded-xl p-4">
            <h3 className="text-slate-400 text-sm mb-2">游戏提示</h3>
            <ul className="space-y-2">
              {roleInfo.tips.map((tip, idx) => (
                <li key={idx} className="text-slate-300 text-sm flex gap-2">
                  <span className="text-purple-400">{idx + 1}.</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="w-full mt-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
        >
          知道了
        </button>
      </div>
    </div>
  );
}
