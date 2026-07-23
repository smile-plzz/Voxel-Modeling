/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef, useState } from 'react';
import { VoxelEngine } from './services/VoxelEngine';
import { UIOverlay } from './components/UIOverlay';
import { JsonModal } from './components/JsonModal';
import { WelcomeScreen } from './components/WelcomeScreen';
import { Generators, PresetType, upscaleVoxelData } from './utils/voxelGenerators';
import { AppState, VoxelData, SavedModel } from './types';

const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<VoxelEngine | null>(null);
  
  const [appState, setAppState] = useState<AppState>(AppState.STABLE);
  const [voxelCount, setVoxelCount] = useState<number>(0);
  
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [jsonModalMode, setJsonModalMode] = useState<'view' | 'import'>('view');
  
  const [showWelcome, setShowWelcome] = useState(true);
  const [jsonData, setJsonData] = useState('');
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [densityScale, setDensityScale] = useState<number>(1);

  // --- State for Custom Models ---
  const [currentBaseModel, setCurrentBaseModel] = useState<PresetType>('MegaMetropolis100k');
  const [customBuilds, setCustomBuilds] = useState<SavedModel[]>([]);
  const [customRebuilds, setCustomRebuilds] = useState<SavedModel[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Engine
    const engine = new VoxelEngine(
      containerRef.current,
      (newState) => setAppState(newState),
      (count) => setVoxelCount(count)
    );

    engineRef.current = engine;

    // Initial Model Load: Mega Metropolis 100,000+ blocks
    const initialData = Generators.MegaMetropolis100k();
    engine.loadInitialModel(initialData);

    // Resize Listener
    const handleResize = () => engine.handleResize();
    window.addEventListener('resize', handleResize);

    // Auto-hide welcome screen after 5 seconds
    const timer = setTimeout(() => setShowWelcome(false), 5000);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
      engine.cleanup();
    };
  }, []);

  const getScaledModelData = (type: PresetType, scale: number): VoxelData[] => {
    const generator = Generators[type];
    if (!generator) return [];
    const baseData = generator();
    return scale > 1 ? upscaleVoxelData(baseData, scale) : baseData;
  };

  const handleDismantle = () => {
    engineRef.current?.dismantle();
  };

  const handleNewScene = (type: PresetType) => {
    if (engineRef.current) {
      const data = getScaledModelData(type, densityScale);
      engineRef.current.loadInitialModel(data);
      setCurrentBaseModel(type);
    }
  };

  const handleDensityChange = (newScale: number) => {
    setDensityScale(newScale);
    if (engineRef.current) {
      const data = getScaledModelData(currentBaseModel, newScale);
      engineRef.current.loadInitialModel(data);
    }
  };

  const handleSelectCustomBuild = (model: SavedModel) => {
      if (engineRef.current) {
          const data = densityScale > 1 ? upscaleVoxelData(model.data, densityScale) : model.data;
          engineRef.current.loadInitialModel(data);
          setCurrentBaseModel(model.name as PresetType);
      }
  };

  const handleRebuild = (type: PresetType) => {
    if (engineRef.current) {
      const data = getScaledModelData(type, densityScale);
      engineRef.current.rebuild(data);
    }
  };

  const handleSelectCustomRebuild = (model: SavedModel) => {
      if (engineRef.current) {
          const data = densityScale > 1 ? upscaleVoxelData(model.data, densityScale) : model.data;
          engineRef.current.rebuild(data);
      }
  };

  const handleShowJson = () => {
    if (engineRef.current) {
      setJsonData(engineRef.current.getJsonData());
      setJsonModalMode('view');
      setIsJsonModalOpen(true);
    }
  };

  const handleImportClick = () => {
      setJsonModalMode('import');
      setIsJsonModalOpen(true);
  };

  const handleJsonImport = (jsonStr: string) => {
      try {
          const rawData = JSON.parse(jsonStr);
          if (!Array.isArray(rawData)) throw new Error("JSON must be an array");

          const voxelData: VoxelData[] = rawData.map((v: any) => {
              let colorVal = v.c || v.color;
              let colorInt = 0xCCCCCC;

              if (typeof colorVal === 'string') {
                  if (colorVal.startsWith('#')) colorVal = colorVal.substring(1);
                  colorInt = parseInt(colorVal, 16);
              } else if (typeof colorVal === 'number') {
                  colorInt = colorVal;
              }

              return {
                  x: Number(v.x) || 0,
                  y: Number(v.y) || 0,
                  z: Number(v.z) || 0,
                  color: isNaN(colorInt) ? 0xCCCCCC : colorInt
              };
          });
          
          if (engineRef.current) {
              engineRef.current.loadInitialModel(voxelData);
              setCurrentBaseModel('Imported Build' as PresetType);
              setCustomBuilds(prev => [...prev, { name: 'Imported Build ' + (prev.length + 1), data: voxelData }]);
          }
      } catch (e) {
          console.error("Failed to import JSON", e);
          alert("Failed to import JSON. Please ensure the format is correct.");
      }
  };

  const handleToggleRotation = () => {
      const newState = !isAutoRotate;
      setIsAutoRotate(newState);
      if (engineRef.current) {
          engineRef.current.setAutoRotate(newState);
      }
  };

  // Filter rebuilds to only show those relevant to the current base model
  const relevantRebuilds = customRebuilds.filter(
      r => r.baseModel === currentBaseModel
  );

  return (
    <div className="relative w-full h-screen bg-[#f0f2f5] overflow-hidden">
      {/* 3D Container */}
      <div ref={containerRef} className="absolute inset-0 z-0" />
      
      {/* UI Overlay */}
      <UIOverlay 
        voxelCount={voxelCount}
        appState={appState}
        currentBaseModel={currentBaseModel}
        customBuilds={customBuilds}
        customRebuilds={relevantRebuilds} 
        isAutoRotate={isAutoRotate}
        isInfoVisible={showWelcome}
        densityScale={densityScale}
        onDensityChange={handleDensityChange}
        onDismantle={handleDismantle}
        onRebuild={handleRebuild}
        onNewScene={handleNewScene}
        onSelectCustomBuild={handleSelectCustomBuild}
        onSelectCustomRebuild={handleSelectCustomRebuild}
        onShowJson={handleShowJson}
        onImportJson={handleImportClick}
        onToggleRotation={handleToggleRotation}
        onToggleInfo={() => setShowWelcome(!showWelcome)}
      />

      {/* Modals & Screens */}
      <WelcomeScreen visible={showWelcome} />

      <JsonModal 
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        data={jsonData}
        isImport={jsonModalMode === 'import'}
        onImport={handleJsonImport}
      />
    </div>
  );
};

export default App;
