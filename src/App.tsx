import { useState, useRef, useEffect, useCallback } from 'react';
import { Ecosystem } from './simulation/Ecosystem';
import { HABITATS, DEFAULT_HABITAT_KEY } from './simulation/habitats';
import { Organism, Genome, SavedSpecimen, MusicalScale } from './types/ecosystem';
import { globalAudioEngine } from './audio/AudioEngine';
import { TopBar } from './components/TopBar';
import { EcologyCanvas } from './components/EcologyCanvas';
import { OrganismInspector } from './components/OrganismInspector';
import { MutationLab } from './components/MutationLab';
import { BreedingChamber } from './components/BreedingChamber';
import { SpecimenVault } from './components/SpecimenVault';
import { HabitatEditor } from './components/HabitatEditor';
import { EvolutionaryObservatory } from './components/EvolutionaryObservatory';
import { ConductorMode } from './components/ConductorMode';

export function App() {
  // Simulation instance
  const ecosystemRef = useRef<Ecosystem | null>(null);
  if (!ecosystemRef.current) {
    ecosystemRef.current = new Ecosystem(HABITATS[DEFAULT_HABITAT_KEY], 28);
  }
  const ecosystem = ecosystemRef.current;

  // State
  const [audioStarted, setAudioStarted] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [simSpeed, setSimSpeed] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [masterVolume, setMasterVolume] = useState<number>(0.75);
  const [selectedOrganism, setSelectedOrganism] = useState<Organism | null>(null);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [musicalScale, setMusicalScale] = useState<MusicalScale>('none');

  // Modals state
  const [isObservatoryOpen, setIsObservatoryOpen] = useState<boolean>(false);
  const [isMutationLabOpen, setIsMutationLabOpen] = useState<boolean>(false);
  const [labGenome, setLabGenome] = useState<Genome | null>(null);
  const [isBreedingChamberOpen, setIsBreedingChamberOpen] = useState<boolean>(false);
  const [breederInitialParent, setBreederInitialParent] = useState<Organism | null>(null);
  const [isSpecimenVaultOpen, setIsSpecimenVaultOpen] = useState<boolean>(false);
  const [isHabitatEditorOpen, setIsHabitatEditorOpen] = useState<boolean>(false);
  const [isConductorOpen, setIsConductorOpen] = useState<boolean>(false);

  // Periodic telemetry refresh
  const [stats, setStats] = useState(ecosystem.stats);
  useEffect(() => {
    const timer = setInterval(() => {
      setStats({ ...ecosystem.stats });
    }, 500);
    return () => clearInterval(timer);
  }, [ecosystem]);

  // Audio start handler
  const handleStartAudio = useCallback(() => {
    globalAudioEngine.init();
    globalAudioEngine.setReverbTime(ecosystem.habitat.acousticReverbTime);
    globalAudioEngine.setAmbientDrone(
      ecosystem.habitat.ambientDroneFreq,
      ecosystem.habitat.ambientDroneGain,
      ecosystem.habitat.ambientDroneType
    );
    setAudioStarted(true);
  }, [ecosystem]);

  // Pause / Resume
  const handleTogglePause = () => {
    ecosystem.isPaused = !ecosystem.isPaused;
    setIsPaused(ecosystem.isPaused);
  };

  const handleChangeSimSpeed = (spd: number) => {
    ecosystem.simSpeed = spd;
    setSimSpeed(spd);
  };

  const handleResetEcosystem = () => {
    ecosystem.seedInitialPopulation(28);
    setSelectedOrganism(null);
  };

  const handleToggleMute = () => {
    const muted = globalAudioEngine.toggleMute();
    setIsMuted(muted);
  };

  const handleChangeVolume = (vol: number) => {
    globalAudioEngine.setVolume(vol);
    setMasterVolume(vol);
  };

  // Organism actions
  const handleSelectOrganism = (org: Organism | null) => {
    if (selectedOrganism) {
      selectedOrganism.isSelected = false;
    }
    if (org) {
      org.isSelected = true;
    }
    setSelectedOrganism(org);
    ecosystem.selectedOrganism = org;
  };

  const handleMutateOrganism = (org: Organism) => {
    ecosystem.mutateOrganism(org);
  };

  const handleForceReproduce = (org: Organism) => {
    const child = ecosystem.forceReproduce(org);
    handleSelectOrganism(child);
  };

  const handleToggleSolo = (org: Organism) => {
    org.isSolo = !org.isSolo;
    setSelectedOrganism({ ...org });
  };

  const handleToggleMuteOrganism = (org: Organism) => {
    org.isMuted = !org.isMuted;
    setSelectedOrganism({ ...org });
  };

  const handleSaveSpecimen = (org: Organism) => {
    const newSpecimen: SavedSpecimen = {
      id: 'saved_' + Date.now().toString(36),
      name: org.name,
      speciesName: org.speciesName,
      savedAt: Date.now(),
      genome: { ...org.genome },
      generation: org.generation,
      description: `Organism from lineage ${org.lineageId}. Voice: ${org.genome.oscType} @ ${Math.round(org.genome.baseFrequency)}Hz.`
    };

    try {
      const existing = localStorage.getItem('sonogenesis_saved_specimens');
      const list = existing ? JSON.parse(existing) : [];
      list.push(newSpecimen);
      localStorage.setItem('sonogenesis_saved_specimens', JSON.stringify(list));
      alert(`Specimen "${org.name}" preserved in Vault.`);
    } catch {
      alert('Specimen saved.');
    }
  };

  const handleCullOrganism = (org: Organism) => {
    org.energy = 0;
    org.health = 0;
    setSelectedOrganism(null);
  };

  const handleSendToLab = (genome: Genome) => {
    setLabGenome({ ...genome });
    setIsMutationLabOpen(true);
  };

  const handleSendToBreeder = (org: Organism) => {
    setBreederInitialParent(org);
    setIsBreedingChamberOpen(true);
  };

  // Habitat Presets
  const handleSelectHabitatPreset = (key: string) => {
    const h = HABITATS[key];
    if (h) {
      ecosystem.setHabitat(h);
    }
  };

  // Conductor Cues
  const handleTriggerCue = (cue: 'spore_bloom' | 'radiation_flare' | 'hadal_chill' | 'resonance_surge' | 'static_discharge') => {
    if (cue === 'spore_bloom') {
      for (let i = 0; i < 24; i++) {
        ecosystem.spawnFoodParticle();
      }
    } else if (cue === 'radiation_flare') {
      for (const org of ecosystem.organisms) {
        if (Math.random() < 0.45) {
          ecosystem.mutateOrganism(org);
        }
      }
    } else if (cue === 'hadal_chill') {
      ecosystem.habitat.viscosity = 0.92;
      ecosystem.habitat.acousticReverbTime = 5.2;
      globalAudioEngine.setReverbTime(5.2);
    } else if (cue === 'static_discharge') {
      for (const org of ecosystem.organisms) {
        if (Math.random() < 0.6) {
          ecosystem.emitOrganismVoice(org, 'territorial');
        }
      }
    }
  };

  const handleChangeScale = (sc: MusicalScale) => {
    setMusicalScale(sc);
    globalAudioEngine.setScale(sc);
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-[#03070d] text-slate-100 select-none overflow-hidden">
      {/* Top Header Bar */}
      <TopBar
        isPaused={isPaused}
        onTogglePause={handleTogglePause}
        simSpeed={simSpeed}
        onChangeSimSpeed={handleChangeSimSpeed}
        onReset={handleResetEcosystem}
        habitat={ecosystem.habitat}
        stats={stats}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        masterVolume={masterVolume}
        onChangeVolume={handleChangeVolume}
        onOpenObservatory={() => setIsObservatoryOpen(true)}
        onOpenMutationLab={() => {
          if (!labGenome && ecosystem.organisms[0]) {
            setLabGenome(ecosystem.organisms[0].genome);
          }
          setIsMutationLabOpen(true);
        }}
        onOpenBreedingChamber={() => setIsBreedingChamberOpen(true)}
        onOpenSpecimenVault={() => setIsSpecimenVaultOpen(true)}
        onOpenHabitatEditor={() => setIsHabitatEditorOpen(true)}
        onOpenConductor={() => setIsConductorOpen(true)}
      />

      {/* Main Ecology Simulation Canvas */}
      <main className="flex-1 relative overflow-hidden">
        <EcologyCanvas
          ecosystem={ecosystem}
          selectedOrganism={selectedOrganism}
          onSelectOrganism={handleSelectOrganism}
          audioStarted={audioStarted}
          onStartAudio={handleStartAudio}
        />

        {/* Selected Organism Inspector Drawer */}
        <OrganismInspector
          organism={selectedOrganism}
          onClose={() => handleSelectOrganism(null)}
          onMutate={handleMutateOrganism}
          onForceReproduce={handleForceReproduce}
          onToggleSolo={handleToggleSolo}
          onToggleMute={handleToggleMuteOrganism}
          onSaveSpecimen={handleSaveSpecimen}
          onCull={handleCullOrganism}
          onSendToLab={handleSendToLab}
          onSendToBreeder={handleSendToBreeder}
          isFollowing={isFollowing}
          onToggleFollow={() => setIsFollowing(!isFollowing)}
        />
      </main>

      {/* Modals & Creative Laboratories */}
      {isMutationLabOpen && (
        <MutationLab
          initialGenome={labGenome || ecosystem.organisms[0]?.genome || ecosystem.createOrganismFromGenome as any}
          onClose={() => setIsMutationLabOpen(false)}
          onDeploy={(genome, name) => {
            const org = ecosystem.spawnSavedSpecimen(genome, name);
            handleSelectOrganism(org);
            setIsMutationLabOpen(false);
          }}
          onSaveToVault={(genome, name) => {
            const spec: SavedSpecimen = {
              id: 'custom_' + Date.now().toString(36),
              name,
              speciesName: 'Engineered Specimen',
              savedAt: Date.now(),
              genome: { ...genome },
              generation: 1
            };
            try {
              const existing = localStorage.getItem('sonogenesis_saved_specimens');
              const list = existing ? JSON.parse(existing) : [];
              list.push(spec);
              localStorage.setItem('sonogenesis_saved_specimens', JSON.stringify(list));
              alert(`Specimen "${name}" stored in vault.`);
            } catch {
              alert('Stored in vault.');
            }
          }}
        />
      )}

      {isBreedingChamberOpen && (
        <BreedingChamber
          organisms={ecosystem.organisms}
          initialParentA={breederInitialParent || selectedOrganism}
          onClose={() => setIsBreedingChamberOpen(false)}
          onDeployChild={(genome, name) => {
            const child = ecosystem.spawnSavedSpecimen(genome, name);
            handleSelectOrganism(child);
          }}
        />
      )}

      {isSpecimenVaultOpen && (
        <SpecimenVault
          onClose={() => setIsSpecimenVaultOpen(false)}
          onSpawnSpecimen={(spec) => {
            const org = ecosystem.spawnSavedSpecimen(spec.genome, spec.name);
            handleSelectOrganism(org);
          }}
        />
      )}

      {isHabitatEditorOpen && (
        <HabitatEditor
          currentHabitat={ecosystem.habitat}
          onSelectHabitatPreset={handleSelectHabitatPreset}
          onUpdateHabitat={(updated) => ecosystem.setHabitat(updated)}
          onClose={() => setIsHabitatEditorOpen(false)}
        />
      )}

      {isObservatoryOpen && (
        <EvolutionaryObservatory
          stats={stats}
          speciesRegistry={ecosystem.speciesRegistry}
          organisms={ecosystem.organisms}
          onClose={() => setIsObservatoryOpen(false)}
          onSelectOrganism={(org) => handleSelectOrganism(org)}
        />
      )}

      {isConductorOpen && (
        <ConductorMode
          onClose={() => setIsConductorOpen(false)}
          onTriggerCue={handleTriggerCue}
          currentScale={musicalScale}
          onChangeScale={handleChangeScale}
        />
      )}
    </div>
  );
}
export default App;
