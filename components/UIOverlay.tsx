/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef } from 'react';
import { AppState, SavedModel } from '../types';
import { PresetType } from '../utils/voxelGenerators';
import { 
  Box, 
  Bird, 
  Cat, 
  Rabbit, 
  Users, 
  Code2, 
  Hammer, 
  FolderOpen, 
  ChevronUp, 
  FileJson, 
  History, 
  Play, 
  Pause, 
  Info, 
  Wrench,
  Flame,
  Bot,
  Castle,
  Rocket,
  Car,
  Home,
  Gem,
  Anchor,
  Sparkles,
  Building2,
  Mountain,
  Globe,
  Layers,
  Grid
} from 'lucide-react';

interface UIOverlayProps {
  voxelCount: number;
  appState: AppState;
  currentBaseModel: string;
  customBuilds: SavedModel[];
  customRebuilds: SavedModel[];
  isAutoRotate: boolean;
  isInfoVisible: boolean;
  densityScale: number;
  onDensityChange: (scale: number) => void;
  onDismantle: () => void;
  onRebuild: (type: PresetType) => void;
  onNewScene: (type: PresetType) => void;
  onSelectCustomBuild: (model: SavedModel) => void;
  onSelectCustomRebuild: (model: SavedModel) => void;
  onShowJson: () => void;
  onImportJson: () => void;
  onToggleRotation: () => void;
  onToggleInfo: () => void;
}

export const PRESET_MODELS: { id: PresetType; label: string; icon: React.ReactNode; isMega?: boolean; approxCount?: string }[] = [
  // Mega 100k - 250k Builds
  { id: 'MegaMetropolis100k', label: 'Mega Metropolis (100k)', icon: <Building2 size={18} className="text-amber-500" />, isMega: true, approxCount: '100k' },
  { id: 'VolcanoIsland120k', label: 'Volcano Island (120k)', icon: <Mountain size={18} className="text-rose-500" />, isMega: true, approxCount: '120k' },
  { id: 'SphereMatrix100k', label: 'Sphere Matrix (100k)', icon: <Globe size={18} className="text-cyan-500" />, isMega: true, approxCount: '100k' },
  { id: 'TitanColossus150k', label: 'Titan Colossus (150k)', icon: <Layers size={18} className="text-indigo-500" />, isMega: true, approxCount: '150k' },
  { id: 'GalaxyCluster200k', label: 'Galaxy Cluster (200k)', icon: <Sparkles size={18} className="text-purple-500" />, isMega: true, approxCount: '200k' },
  { id: 'CyberCity250k', label: 'Cyber Megacity (250k)', icon: <Grid size={18} className="text-emerald-500" />, isMega: true, approxCount: '250k' },
  
  // Standard Presets
  { id: 'Eagle', label: 'Majestic Eagle', icon: <Bird size={18} /> },
  { id: 'Cat', label: 'Playful Cat', icon: <Cat size={18} /> },
  { id: 'Rabbit', label: 'Forest Bunny', icon: <Rabbit size={18} /> },
  { id: 'Twins', label: 'Twin Eagles', icon: <Users size={18} /> },
  { id: 'Dragon', label: 'Fire Dragon', icon: <Flame size={18} /> },
  { id: 'Robot', label: 'Sci-Fi Robot', icon: <Bot size={18} /> },
  { id: 'Castle', label: 'Stone Castle', icon: <Castle size={18} /> },
  { id: 'Spaceship', label: 'Star Fighter', icon: <Rocket size={18} /> },
  { id: 'Car', label: 'Sports Car', icon: <Car size={18} /> },
  { id: 'Panda', label: 'Bamboo Panda', icon: <Sparkles size={18} /> },
  { id: 'Rocket', label: 'Launch Rocket', icon: <Rocket size={18} /> },
  { id: 'PirateShip', label: 'Pirate Galleon', icon: <Anchor size={18} /> },
  { id: 'TreasureChest', label: 'Treasure Chest', icon: <Gem size={18} /> },
  { id: 'House', label: 'Cottage House', icon: <Home size={18} /> },
];

export const UIOverlay: React.FC<UIOverlayProps> = ({
  voxelCount,
  appState,
  currentBaseModel,
  customBuilds,
  customRebuilds,
  isAutoRotate,
  isInfoVisible,
  densityScale,
  onDensityChange,
  onDismantle,
  onRebuild,
  onNewScene,
  onSelectCustomBuild,
  onSelectCustomRebuild,
  onShowJson,
  onImportJson,
  onToggleRotation,
  onToggleInfo
}) => {
  const isStable = appState === AppState.STABLE;
  const isDismantling = appState === AppState.DISMANTLING;

  const megaModels = PRESET_MODELS.filter(m => m.isMega);
  const standardModels = PRESET_MODELS.filter(m => !m.isMega);

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none select-none">
      
      {/* --- Top Bar (Stats & Tools) --- */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
        
        {/* Global Scene Controls */}
        <div className="pointer-events-auto flex flex-col gap-2">
            <DropdownMenu 
                icon={<FolderOpen size={20} />}
                label="Builds"
                color="indigo"
            >
                <div className="px-2 py-1 text-xs font-black text-indigo-500 uppercase tracking-wider flex items-center justify-between">
                    <span>MEGA BUILDS (100k+)</span>
                    <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded text-[10px]">NEW</span>
                </div>
                {megaModels.map((item) => (
                    <DropdownItem 
                        key={item.id} 
                        onClick={() => onNewScene(item.id)} 
                        icon={item.icon} 
                        label={item.label}
                        badge={item.approxCount}
                        highlight={currentBaseModel === item.id}
                    />
                ))}

                <div className="h-px bg-slate-100 my-1" />

                <div className="px-2 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">STANDARD SCENES</div>
                {standardModels.map((item) => (
                    <DropdownItem 
                        key={item.id} 
                        onClick={() => onNewScene(item.id)} 
                        icon={item.icon} 
                        label={item.label}
                        highlight={currentBaseModel === item.id}
                    />
                ))}
                
                <div className="h-px bg-slate-100 my-1" />
                
                {customBuilds.length > 0 && (
                    <>
                        <div className="px-2 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">YOUR CREATIONS</div>
                        {customBuilds.map((model, idx) => (
                            <DropdownItem 
                                key={`build-${idx}`} 
                                onClick={() => onSelectCustomBuild(model)} 
                                icon={<History size={16}/>} 
                                label={model.name} 
                                truncate
                            />
                        ))}
                        <div className="h-px bg-slate-100 my-1" />
                    </>
                )}

                <DropdownItem onClick={onImportJson} icon={<FileJson size={16}/>} label="Import JSON" />
            </DropdownMenu>

            {/* Block Counter & Density Scale Selector */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-1">
                <div className="flex items-center gap-3 px-4 py-2 bg-white/90 backdrop-blur-sm shadow-md rounded-2xl border border-slate-200/80 text-slate-500 font-bold w-fit">
                    <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600">
                        <Box size={18} strokeWidth={3} />
                    </div>
                    <div className="flex flex-col leading-none">
                        <span className="text-[10px] uppercase tracking-wider opacity-60">Block Count</span>
                        <span className="text-xl text-slate-900 font-black font-mono">
                            {voxelCount.toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Sub-division Density Control */}
                <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm shadow-md rounded-2xl border border-slate-200/80 p-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase px-2">Density:</span>
                    {([
                        { scale: 1, label: '1x' },
                        { scale: 2, label: '8x (~25k)' },
                        { scale: 3, label: '27x (~100k)' },
                        { scale: 4, label: '64x (150k+)' }
                    ]).map((opt) => (
                        <button
                            key={`density-${opt.scale}`}
                            onClick={() => onDensityChange(opt.scale)}
                            className={`px-2.5 py-1 text-xs font-extrabold rounded-xl transition-all ${
                                densityScale === opt.scale
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* Utilities */}
        <div className="pointer-events-auto flex gap-2">
            <TactileButton
                onClick={onToggleInfo}
                color={isInfoVisible ? 'indigo' : 'slate'}
                icon={<Info size={18} strokeWidth={2.5} />}
                label="Info"
                compact
            />
            <TactileButton
                onClick={onToggleRotation}
                color={isAutoRotate ? 'sky' : 'slate'}
                icon={isAutoRotate ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                label={isAutoRotate ? "Pause Cam" : "Play Cam"}
                compact
            />
            <TactileButton
                onClick={onShowJson}
                color="slate"
                icon={<Code2 size={18} strokeWidth={2.5} />}
                label="Share"
            />
        </div>
      </div>

      {/* --- Bottom Control Center --- */}
      <div className="absolute bottom-8 left-0 w-full flex justify-center items-end pointer-events-none">
        
        <div className="pointer-events-auto transition-all duration-500 ease-in-out transform">
            
            {/* STATE 1: STABLE -> DISMANTLE */}
            {isStable && (
                 <div className="animate-in slide-in-from-bottom-10 fade-in duration-300">
                     <BigActionButton 
                        onClick={onDismantle} 
                        icon={<Hammer size={32} strokeWidth={2.5} />} 
                        label="BREAK" 
                     />
                 </div>
            )}

            {/* STATE 2: DISMANTLED -> REBUILD */}
            {isDismantling && (
                <div className="flex items-end gap-4 animate-in slide-in-from-bottom-10 fade-in duration-300">
                     <DropdownMenu 
                        icon={<Wrench size={24} />}
                        label="Rebuild Into..."
                        color="emerald"
                        direction="up"
                        big
                     >
                        <div className="px-2 py-1 text-xs font-black text-emerald-600 uppercase tracking-wider">MEGA 100k+ REBUILDS</div>
                        {megaModels.map((item) => (
                            <DropdownItem 
                                key={`rebuild-mega-${item.id}`} 
                                onClick={() => onRebuild(item.id)} 
                                icon={item.icon} 
                                label={item.label} 
                                badge={item.approxCount}
                            />
                        ))}

                        <div className="h-px bg-slate-100 my-1" />

                        <div className="px-2 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">STANDARD REBUILDS</div>
                        {standardModels.map((item) => (
                            <DropdownItem 
                                key={`rebuild-preset-${item.id}`} 
                                onClick={() => onRebuild(item.id)} 
                                icon={item.icon} 
                                label={item.label} 
                            />
                        ))}

                        {/* Custom Rebuilds */}
                        {customRebuilds.length > 0 && (
                            <>
                                <div className="h-px bg-slate-100 my-1" />
                                <div className="px-2 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">CUSTOM REBUILDS</div>
                                {customRebuilds.map((model, idx) => (
                                    <DropdownItem 
                                        key={`rebuild-custom-${idx}`} 
                                        onClick={() => onSelectCustomRebuild(model)} 
                                        icon={<History size={18}/>} 
                                        label={model.name}
                                        truncate 
                                    />
                                ))}
                            </>
                        )}
                     </DropdownMenu>
                </div>
            )}
        </div>
      </div>

    </div>
  );
};

// --- Components ---

interface TactileButtonProps {
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
  color: 'slate' | 'rose' | 'sky' | 'emerald' | 'amber' | 'indigo';
  compact?: boolean;
}

const TactileButton: React.FC<TactileButtonProps> = ({ onClick, disabled, icon, label, color, compact }) => {
  const colorStyles = {
    slate:   'bg-slate-200 text-slate-600 shadow-slate-300 hover:bg-slate-300',
    rose:    'bg-rose-500 text-white shadow-rose-700 hover:bg-rose-600',
    sky:     'bg-sky-500 text-white shadow-sky-700 hover:bg-sky-600',
    emerald: 'bg-emerald-500 text-white shadow-emerald-700 hover:bg-emerald-600',
    amber:   'bg-amber-400 text-amber-900 shadow-amber-600 hover:bg-amber-500',
    indigo:  'bg-indigo-500 text-white shadow-indigo-700 hover:bg-indigo-600',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        group relative flex items-center justify-center gap-2 rounded-xl font-bold text-sm transition-all duration-100
        border-b-[4px] active:border-b-0 active:translate-y-[4px]
        ${compact ? 'p-2.5' : 'px-4 py-3'}
        ${disabled 
          ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed shadow-none' 
          : `${colorStyles[color]} border-black/20 shadow-lg`}
      `}
    >
      {icon}
      {!compact && <span>{label}</span>}
    </button>
  );
};

const BigActionButton: React.FC<{onClick: () => void, icon: React.ReactNode, label: string}> = ({ onClick, icon, label }) => {
    return (
        <button 
            onClick={onClick}
            className="group relative flex flex-col items-center justify-center w-32 h-32 rounded-3xl bg-rose-500 hover:bg-rose-600 text-white shadow-xl shadow-rose-900/30 border-b-[8px] border-rose-800 active:border-b-0 active:translate-y-[8px] transition-all duration-150"
        >
            <div className="mb-2">{icon}</div>
            <div className="text-sm font-black tracking-wider">{label}</div>
        </button>
    )
}

// --- Dropdown Components ---

interface DropdownProps {
    icon: React.ReactNode;
    label: string;
    children: React.ReactNode;
    color: 'indigo' | 'emerald';
    direction?: 'up' | 'down';
    big?: boolean;
}

const DropdownMenu: React.FC<DropdownProps> = ({ icon, label, children, color, direction = 'down', big }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const bgClass = color === 'indigo' ? 'bg-indigo-500 hover:bg-indigo-600 border-indigo-800' : 'bg-emerald-500 hover:bg-emerald-600 border-emerald-800';

    return (
        <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center gap-2 font-bold text-white shadow-lg rounded-2xl transition-all active:scale-95
                    ${bgClass}
                    ${big ? 'px-8 py-4 text-lg border-b-[6px] active:border-b-0 active:translate-y-[6px]' : 'px-4 py-3 text-sm border-b-[4px] active:border-b-0 active:translate-y-[4px]'}
                `}
            >
                {icon}
                {label}
                <ChevronUp size={16} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} ${direction === 'down' ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className={`
                    absolute left-0 ${direction === 'up' ? 'bottom-full mb-3' : 'top-full mt-3'} 
                    w-72 max-h-[65vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border-2 border-slate-100 p-2 flex flex-col gap-1 animate-in fade-in zoom-in duration-200 z-50
                `}>
                    {children}
                </div>
            )}
        </div>
    )
}

const DropdownItem: React.FC<{ onClick: () => void, icon: React.ReactNode, label: string, badge?: string, highlight?: boolean, truncate?: boolean }> = ({ onClick, icon, label, badge, highlight, truncate }) => {
    return (
        <button 
            onClick={onClick}
            className={`
                w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors text-left
                ${highlight 
                    ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
            `}
        >
            <div className="flex items-center gap-3 min-w-0">
                <div className="shrink-0">{icon}</div>
                <span className={truncate ? "truncate" : ""}>{label}</span>
            </div>
            {badge && (
                <span className="shrink-0 bg-slate-100 text-slate-600 text-[10px] font-black px-1.5 py-0.5 rounded-md border border-slate-200">
                    {badge}
                </span>
            )}
        </button>
    )
}
