/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef } from 'react';
import { AppState, SavedModel, ToolType, VoxelEngineStats, VoxelLayoutStyle } from '../types';
import { PresetType } from '../utils/voxelGenerators';
import { 
  Box, 
  Boxes,
  Circle,
  Cylinder,
  Diamond,
  Puzzle,
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
  Grid,
  Paintbrush,
  Magnet,
  Zap,
  Bomb,
  ShieldAlert,
  Activity,
  Crown,
  Compass,
  Dog,
  Skull,
  Shield,
  Gamepad2,
  Plane,
  Swords
} from 'lucide-react';

interface UIOverlayProps {
  voxelCount: number;
  stats: VoxelEngineStats;
  appState: AppState;
  activeTool: ToolType;
  paintColor: number;
  currentBaseModel: string;
  customBuilds: SavedModel[];
  customRebuilds: SavedModel[];
  isAutoRotate: boolean;
  isInfoVisible: boolean;
  explosionRadius: number;
  layoutStyle: VoxelLayoutStyle;
  onSelectTool: (tool: ToolType) => void;
  onSelectPaintColor: (colorHex: number) => void;
  onExplosionRadiusChange: (radius: number) => void;
  onSelectLayoutStyle: (style: VoxelLayoutStyle) => void;
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
  
  // Standard Presets & New Models
  { id: 'CyberPunkCar', label: 'Cyberpunk Sports Car', icon: <Car size={18} className="text-pink-500" /> },
  { id: 'PyramidTomb', label: 'Golden Pyramid Tomb', icon: <Crown size={18} className="text-amber-500" /> },
  { id: 'MechanicalDragon', label: 'Mechanical Cyber Dragon', icon: <Flame size={18} className="text-emerald-500" /> },
  { id: 'LighthouseIsland', label: 'Coastal Lighthouse', icon: <Compass size={18} className="text-blue-500" /> },
  { id: 'GoldenGalleon', label: 'Royal Golden Galleon', icon: <Anchor size={18} className="text-yellow-600" /> },
  { id: 'SpaceStation', label: 'Orbital Space Station', icon: <Globe size={18} className="text-cyan-400" /> },
  { id: 'PugDog', label: 'Cute Pug Puppy', icon: <Dog size={18} className="text-amber-600" /> },
  { id: 'CyberSkull', label: 'Cybernetic Skull', icon: <Skull size={18} className="text-purple-400" /> },
  { id: 'MedievalCastle', label: 'Grand Royal Fortress', icon: <Shield size={18} className="text-indigo-600" /> },
  { id: 'SteampunkAirship', label: 'Steampunk Airship', icon: <Plane size={18} className="text-amber-700" /> },
  { id: 'ArcadeCabinet', label: 'Retro Arcade Machine', icon: <Gamepad2 size={18} className="text-cyan-400" /> },
  { id: 'CyberSamurai', label: 'Cyberpunk Samurai', icon: <Swords size={18} className="text-rose-500" /> },
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

export const PAINT_COLORS = [
  { name: 'Neon Pink', hex: 0xec4899, bg: 'bg-pink-500' },
  { name: 'Cyber Cyan', hex: 0x06b6d4, bg: 'bg-cyan-500' },
  { name: 'Gold', hex: 0xeab308, bg: 'bg-yellow-500' },
  { name: 'Emerald', hex: 0x10b981, bg: 'bg-emerald-500' },
  { name: 'Violet', hex: 0xa855f7, bg: 'bg-purple-500' },
  { name: 'Lava Orange', hex: 0xf97316, bg: 'bg-orange-500' },
  { name: 'Ice White', hex: 0xf8fafc, bg: 'bg-slate-100' }
];

export const UIOverlay: React.FC<UIOverlayProps> = ({
  voxelCount,
  stats,
  appState,
  activeTool,
  paintColor,
  currentBaseModel,
  customBuilds,
  customRebuilds,
  isAutoRotate,
  isInfoVisible,
  explosionRadius,
  layoutStyle,
  onSelectTool,
  onSelectPaintColor,
  onExplosionRadiusChange,
  onSelectLayoutStyle,
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

  const getToolInstruction = () => {
    switch(activeTool) {
      case 'miniHammer':
        return 'Tap or click model to chisel with Mini Hammer! Takes 10-20 hits to fully dismantle.';
      case 'sledgeHammer':
        return 'Medium War Hammer! Deals heavier localized impacts in 3-5 strikes.';
      case 'megaHammer':
        return 'Heavy War Hammer! Shatters the entire sculpture in 1 mighty smash!';
      case 'dynamite':
        return 'Click anywhere to plant TNT Dynamite with a 1-second ticking fuse!';
      case 'paintbrush':
        return 'Click and spray paint color directly onto voxels in real-time!';
      case 'magnet':
        return 'Click and drag on voxels to pull and launch them with gravity magnetic pulse!';
      case 'explosion':
        return '💥 Click anywhere on the model to detonate a radial kinetic explosion with custom blast radius!';
      default:
        return 'Select a tool to interact with the model!';
    }
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none select-none">
      
      {/* --- Top Bar (Stats & Builds Dropdown) --- */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
        
        {/* Global Scene Controls & Integrity Bar */}
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

            {/* Block Counter & Model Health/Integrity Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-1">
                {/* Block Counter */}
                <div className="flex items-center gap-3 px-4 py-2 bg-white/95 backdrop-blur-md shadow-md rounded-2xl border border-slate-200/80 text-slate-500 font-bold w-fit">
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

                {/* Integrity Progress Gauge */}
                <div className="flex items-center gap-3 px-4 py-2 bg-white/95 backdrop-blur-md shadow-md rounded-2xl border border-slate-200/80 w-fit">
                    <div className={`p-1.5 rounded-lg ${stats.integrityPercent > 60 ? 'bg-emerald-100 text-emerald-600' : stats.integrityPercent > 25 ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}`}>
                        <Activity size={18} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col leading-tight min-w-[120px]">
                        <div className="flex justify-between items-center text-[10px] uppercase font-black text-slate-500 tracking-wider">
                            <span>Integrity</span>
                            <span className="font-mono text-slate-900 font-bold">{stats.integrityPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1 border border-slate-200">
                            <div 
                              className={`h-full transition-all duration-300 ${stats.integrityPercent > 60 ? 'bg-emerald-500' : stats.integrityPercent > 25 ? 'bg-amber-500' : 'bg-rose-500'}`}
                              style={{ width: `${stats.integrityPercent}%` }}
                            />
                        </div>
                    </div>
                    
                    {stats.hitsCount > 0 && (
                      <div className="ml-1 bg-amber-100 text-amber-800 text-xs font-black px-2 py-0.5 rounded-lg border border-amber-200 flex items-center gap-1">
                        <Zap size={12} className="fill-amber-500 text-amber-500" />
                        <span>{stats.hitsCount} {stats.hitsCount === 1 ? 'Hit' : 'Hits'}</span>
                      </div>
                    )}
                </div>

                {/* Voxel Layout Style Chooser */}
                <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md shadow-md rounded-2xl border border-slate-200/80 p-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase px-2 hidden sm:inline">Voxel Layout:</span>
                    {([
                        { style: 'cube', label: 'Cube', icon: <Box size={14} /> },
                        { style: 'beveled', label: 'Bevel', icon: <Boxes size={14} /> },
                        { style: 'sphere', label: 'Orb', icon: <Circle size={14} /> },
                        { style: 'cylinder', label: 'Pillar', icon: <Cylinder size={14} /> },
                        { style: 'crystal', label: 'Gem', icon: <Diamond size={14} /> },
                        { style: 'lego', label: 'Brick', icon: <Puzzle size={14} /> }
                    ] as const).map((opt) => (
                        <button
                            key={`layout-${opt.style}`}
                            onClick={() => onSelectLayoutStyle(opt.style)}
                            className={`px-2.5 py-1 text-xs font-extrabold rounded-xl transition-all flex items-center gap-1 ${
                                layoutStyle === opt.style
                                    ? 'bg-indigo-600 text-white shadow-sm scale-105'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                            title={`Switch to ${opt.label} voxel geometry layout`}
                        >
                            {opt.icon}
                            <span>{opt.label}</span>
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

      {/* --- Bottom Control Center & Tool Palette --- */}
      <div className="absolute bottom-6 left-0 w-full flex flex-col items-center justify-end pointer-events-none gap-3">
        
        {/* Tool Helper Instruction Banner */}
        <div className="pointer-events-auto bg-slate-900/90 text-amber-300 text-xs font-bold px-4 py-2 rounded-full shadow-xl border border-amber-500/30 flex items-center gap-2 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
           <Zap size={15} className="text-amber-400 animate-pulse" />
           <span>{getToolInstruction()}</span>
        </div>

        {/* Tool Dock Selector */}
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md p-2 rounded-3xl shadow-2xl border-2 border-slate-200/80 flex items-center gap-1.5">
          <ToolButton 
            active={activeTool === 'miniHammer'} 
            onClick={() => onSelectTool('miniHammer')}
            icon={<Hammer size={20} className="text-amber-600" />}
            label="Mini Chisel"
            badge="Multi-Hit"
          />
          <ToolButton 
            active={activeTool === 'sledgeHammer'} 
            onClick={() => onSelectTool('sledgeHammer')}
            icon={<Hammer size={24} className="text-rose-600" />}
            label="Sledge Hammer"
            badge="Medium"
          />
          <ToolButton 
            active={activeTool === 'megaHammer'} 
            onClick={() => onSelectTool('megaHammer')}
            icon={<ShieldAlert size={22} className="text-indigo-600" />}
            label="Mega War Hammer"
            badge="1-Hit Shatter"
          />
          <ToolButton 
            active={activeTool === 'dynamite'} 
            onClick={() => onSelectTool('dynamite')}
            icon={<Bomb size={22} className="text-red-500" />}
            label="TNT Dynamite"
            badge="1s Fuse"
          />
          <ToolButton 
            active={activeTool === 'paintbrush'} 
            onClick={() => onSelectTool('paintbrush')}
            icon={<Paintbrush size={22} className="text-pink-500" />}
            label="Paint Spray"
          />
          <ToolButton 
            active={activeTool === 'magnet'} 
            onClick={() => onSelectTool('magnet')}
            icon={<Magnet size={22} className="text-cyan-500" />}
            label="Voxel Magnet"
          />
          <ToolButton 
            active={activeTool === 'explosion'} 
            onClick={() => onSelectTool('explosion')}
            icon={<Flame size={22} className="text-orange-500" />}
            label="Explosion"
            badge="Blast Wave"
          />
        </div>

        {/* Explosion Blast Radius Controls (When Explosion Tool is Active) */}
        {activeTool === 'explosion' && (
          <div className="pointer-events-auto bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-slate-200 flex items-center gap-3 animate-in fade-in zoom-in-95">
            <span className="text-xs font-black text-slate-500 uppercase flex items-center gap-1.5">
              <Flame size={16} className="text-orange-500" /> Blast Radius:
            </span>
            <input 
              type="range" 
              min="6" 
              max="60" 
              step="1"
              value={explosionRadius}
              onChange={(e) => onExplosionRadiusChange(Number(e.target.value))}
              className="w-28 sm:w-36 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            <span className="text-xs font-black font-mono bg-orange-100 text-orange-700 px-2 py-0.5 rounded-md min-w-[3.2rem] text-center">
              {explosionRadius}m
            </span>
            <div className="hidden sm:flex gap-1 ml-1">
              {[10, 20, 35, 55].map((r) => (
                <button
                  key={`radius-${r}`}
                  onClick={() => onExplosionRadiusChange(r)}
                  className={`px-2.5 py-0.5 text-[11px] font-extrabold rounded-lg transition-all ${explosionRadius === r ? 'bg-orange-500 text-white shadow-sm scale-105' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {r}m
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Color Palette (When Paintbrush is Active) */}
        {activeTool === 'paintbrush' && (
          <div className="pointer-events-auto bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-slate-200 flex items-center gap-2 animate-in fade-in zoom-in-95">
            <span className="text-xs font-black text-slate-400 uppercase mr-1">Paint Color:</span>
            {PAINT_COLORS.map(c => (
              <button
                key={`color-${c.hex}`}
                onClick={() => onSelectPaintColor(c.hex)}
                className={`w-7 h-7 rounded-full transition-all border-2 ${c.bg} ${paintColor === c.hex ? 'ring-4 ring-indigo-500 ring-offset-2 scale-110 border-white' : 'border-black/10 hover:scale-105'}`}
                title={c.name}
              />
            ))}
          </div>
        )}

        {/* Quick Action: Rebuild Dropdown or Heavy Shatter */}
        <div className="pointer-events-auto flex items-center gap-2 mt-1">
          {stats.integrityPercent < 100 && (
            <DropdownMenu 
               icon={<Wrench size={20} />}
               label="Rebuild Into..."
               color="emerald"
               direction="up"
            >
               <div className="px-2 py-1 text-xs font-black text-emerald-600 uppercase tracking-wider">MEGA REBUILDS</div>
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
          )}

          <TactileButton 
            onClick={onDismantle} 
            color="rose" 
            icon={<Hammer size={18} strokeWidth={2.5} />} 
            label="Strike Active Tool"
          />
        </div>

      </div>

    </div>
  );
};

// --- Sub Components ---

interface ToolButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: string;
}

const ToolButton: React.FC<ToolButtonProps> = ({ active, onClick, icon, label, badge }) => {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex flex-col items-center justify-center px-3.5 py-2.5 rounded-2xl font-black text-xs transition-all duration-150
        ${active 
          ? 'bg-slate-900 text-white shadow-lg scale-105 ring-2 ring-indigo-500' 
          : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200 hover:text-slate-900'}
      `}
    >
      <div className="mb-1">{icon}</div>
      <span className="whitespace-nowrap">{label}</span>
      {badge && (
        <span className={`text-[9px] px-1.5 py-0.2 rounded mt-0.5 font-bold ${active ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
          {badge}
        </span>
      )}
    </button>
  );
};

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
