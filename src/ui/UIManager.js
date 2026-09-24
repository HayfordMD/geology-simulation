import { MINERALS } from '../config/minerals.js';
import { TERRAIN_TYPES } from '../simulation/BiomeSystem.js';
import { TooltipManager } from './TooltipManager.js';

export class UIManager {
  constructor(engine, scene3D) {
    this.engine = engine;
    this.scene = scene3D;
    this.activeTab = 'facilities';
    this.activeFilter = 'all';
    this.tooltips = new TooltipManager();

    this.bindDOM();
    this.bindFilterBar();
    this.bindEngineEvents();
    this.renderFacilities();
    this.renderTechTree();
    this.renderCompendium();
    this.renderPlateIntel();

    if (this.scene?.planetMesh && this.engine?.currentEpoch) {
      this.scene.planetMesh.setOceanLevel(this.engine.currentEpoch.oceanLevel);
    }
  }

  bindDOM() {
    // Time controls
    document.querySelectorAll('.time-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const scale = parseFloat(btn.dataset.scale);
        this.engine.setTimeScale(scale);
      });
    });

    const pauseBtn = document.getElementById('btn-pause');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        const isPaused = this.engine.togglePause();
        pauseBtn.innerHTML = isPaused ? '▶ Resume' : '⏸ Pause';
        pauseBtn.classList.toggle('active', isPaused);
      });
    }

    const muteBtn = document.getElementById('btn-mute');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        const muted = this.scene.audio.toggleMute();
        muteBtn.innerHTML = muted ? '🔇 Unmute' : '🔊 Audio';
        muteBtn.classList.toggle('active', muted);
      });
    }

    // Reset camera button
    const resetCamBtn = document.getElementById('btn-reset-cam');
    if (resetCamBtn) {
      resetCamBtn.addEventListener('click', () => {
        this.scene.camera.position.set(0, 16, 38);
        this.scene.controls.target.set(0, 0, 0);
      });
    }

    // Tool buttons
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tool = btn.dataset.tool;
        this.scene.setActiveTool(tool);
        this.showToast(`Selected Tool: ${btn.querySelector('.tool-name').textContent}`, 'info');
      });
    });

    // Visual mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.mode;
        this.scene.setVisualMode(mode);
      });
    });

    // Core X-Ray toggle
    const xrayBtn = document.getElementById('btn-xray');
    if (xrayBtn) {
      xrayBtn.addEventListener('click', () => {
        const active = this.scene.toggleXRay();
        xrayBtn.classList.toggle('active', active);
        xrayBtn.textContent = active ? '🔬 Core X-Ray [ON]' : '🔬 Core X-Ray [OFF]';
        this.showToast(active ? 'Core X-Ray Active: Inner Core, Dynamo & Mantle Exposed!' : 'Surface Crust Restored', 'epoch');
      });
    }

    // Side panel tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.dataset.tab;
        this.activeTab = tab;
        const pane = document.getElementById(`tab-${tab}`);
        if (pane) pane.classList.add('active');
      });
    });

    // Panel collapse toggle
    const togglePanelBtn = document.getElementById('btn-toggle-panel');
    const sidePanel = document.getElementById('side-deck');
    if (togglePanelBtn && sidePanel) {
      togglePanelBtn.addEventListener('click', () => {
        sidePanel.classList.toggle('collapsed');
        togglePanelBtn.textContent = sidePanel.classList.contains('collapsed') ? '◀ Open Deck' : '▶ Hide';
      });
    }

    // Modal close buttons
    const closeDrillBtn = document.getElementById('btn-close-drill');
    if (closeDrillBtn) {
      closeDrillBtn.addEventListener('click', () => {
        document.getElementById('drill-modal').classList.remove('visible');
      });
    }

    // Connect globe click to drill modal & tools
    this.scene.onTerrainClick((tool, data) => {
      if (tool === 'drill') {
        this.openDrillModal(data);
      } else if (tool === 'slip') {
        if (data) {
          this.showToast(`⚡ Fault Rupture! Mw ${data.magnitude} Quake (+${data.harvestedSeismic} MJ)`, 'warning');
        } else {
          this.showToast('No active fault line within stress threshold here.', 'info');
        }
      } else if (tool === 'volcano') {
        this.showToast(`🌋 Volcanic Plume Spawned! +120 GW Thermal Surge`, 'warning');
      } else if (tool === 'ice') {
        this.showToast(`❄️ Glacial Carve! Sculpted broad U-shaped valleys and deposited moraines!`, 'notice');
      } else if (tool === 'deluge') {
        this.showToast(`🌧️ Fluvial Weathering: Carved river channels & deposited alluvial deltas.`, 'info');
      } else if (tool === 'meteor') {
        this.showToast(`☄️ Meteor Impact! Crater created & shock metamorphism triggered!`, 'warning');
      }
    });
  }

  bindFilterBar() {
    document.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const filterId = chip.dataset.filter;
        this.activeFilter = filterId;
        this.scene.setTerrainFilter(filterId);

        const def = TERRAIN_TYPES[filterId];
        const stats = this.engine.biomes.getStats(filterId);
        const telemetryEl = document.getElementById('filter-telemetry');
        if (telemetryEl && def) {
          telemetryEl.textContent = `${def.name}: ${stats.percentage}% (${stats.areaMillionSqKm}M km²)`;
        }

        if (filterId === 'all') {
          this.showToast('Reset Terrain Filter: Natural procedural lithology restored.', 'info');
        } else {
          this.showToast(`Filtered: ${def.name} (${stats.percentage}% global coverage)`, 'notice');
        }
      });
    });
  }

  bindEngineEvents() {
    let lastNaturalQuakeToast = 0;

    this.engine.on('quake', (q) => {
      const now = Date.now();
      if (!q.forcedByPlayer) {
        // Rate-limit natural quake toasts to at most 1 every 3 seconds to prevent spam during high time-warps
        if (now - lastNaturalQuakeToast > 3000) {
          lastNaturalQuakeToast = now;
          this.showToast(`Natural Quake: Mw ${q.magnitude} at (${q.x}, ${q.y}) [${q.harvestedSeismic} MJ]`, 'notice');
        }
      }
      this.renderPlateIntel();
    });

    this.engine.on('epochChange', ({ oldEpoch, newEpoch }) => {
      this.showEpochBanner(newEpoch);
      this.showToast(`🌌 Geological Transition: Entered the ${newEpoch.name}!`, 'epoch');
      this.scene.planetMesh.setOceanLevel(newEpoch.oceanLevel);
    });

    this.engine.on('discovery', (min) => {
      this.showToast(`💎 NEW MINERAL DISCOVERED: ${min.name} (${min.category})!`, 'discovery');
      this.renderCompendium();
    });
  }

  updateHUD() {
    const res = this.engine.idle.resources;
    const rates = this.engine.idle.rates;

    // Update resources
    document.getElementById('val-money').textContent = `$${Math.floor(res.money).toLocaleString()}`;
    document.getElementById('rate-money').textContent = `+${rates.money}/s`;

    document.getElementById('val-seismic').textContent = `${Math.floor(res.seismic).toLocaleString()} MJ`;
    document.getElementById('rate-seismic').textContent = `+${rates.seismic}/s`;

    document.getElementById('val-geothermal').textContent = `${Math.floor(res.geothermal).toLocaleString()} GW`;
    document.getElementById('rate-geothermal').textContent = `+${rates.geothermal}/s`;

    document.getElementById('val-research').textContent = `${Math.floor(res.research).toLocaleString()} RP`;
    document.getElementById('rate-research').textContent = `+${rates.research}/s`;

    // Update Epoch, Age & Climate
    const epoch = this.engine.currentEpoch;
    const ageMa = Math.max(0, this.engine.currentAgeMa);
    document.getElementById('hud-epoch-name').textContent = epoch.name;
    document.getElementById('hud-age').textContent = `${ageMa.toFixed(1)} Ma`;

    const climateEl = document.getElementById('hud-climate');
    if (climateEl) {
      if (this.engine.isIceAge) {
        climateEl.innerHTML = `${this.engine.globalTempC}°C ❄️ ICE AGE`;
        climateEl.className = 'climate-badge ice-age';
      } else {
        climateEl.innerHTML = `${this.engine.globalTempC}°C Interglacial`;
        climateEl.className = 'climate-badge warm';
      }
    }

    // Update Filter telemetry
    const telemetryEl = document.getElementById('filter-telemetry');
    if (telemetryEl) {
      const def = TERRAIN_TYPES[this.activeFilter];
      const stats = this.engine.biomes.getStats(this.activeFilter);
      if (def && stats) {
        telemetryEl.textContent = `${def.name}: ${stats.percentage}% (${stats.areaMillionSqKm}M km²)`;
      }
    }

    // Calculate epoch progress
    const epochStart = epoch.ageRange[0];
    const epochEnd = epoch.ageRange[1];
    const progress = Math.min(100, Math.max(0, ((epochStart - ageMa) / (epochStart - epochEnd)) * 100));
    const progBar = document.getElementById('epoch-progress-fill');
    if (progBar) {
      progBar.style.width = `${progress}%`;
      progBar.style.background = epoch.themeColor;
    }

    if (this.activeTab === 'facilities') {
      this.updateFacilityAffordability();
    } else if (this.activeTab === 'tech') {
      this.updateTechAffordability();
    }
  }

  renderFacilities() {
    const container = document.getElementById('facilities-list');
    if (!container) return;

    container.innerHTML = '';
    const facilities = this.engine.idle.facilities;

    facilities.forEach(fac => {
      const card = document.createElement('div');
      card.className = 'facility-card';
      card.id = `fac-${fac.id}`;
      card.setAttribute('data-tooltip-title', `${fac.icon} ${fac.name} (Level ${fac.level})`);
      card.setAttribute('data-tooltip', `${fac.description} Upgrading increases passive income rates.`);

      const cost = this.engine.idle.getFacilityCost(fac);
      const costStr = Object.entries(cost).map(([k, v]) => `${v.toLocaleString()} ${k.toUpperCase()}`).join(', ');

      const yields = [];
      if (fac.baseYield.money) yields.push(`+$${fac.baseYield.money}/s`);
      if (fac.baseYield.seismic) yields.push(`+${fac.baseYield.seismic} MJ/s`);
      if (fac.baseYield.geothermal) yields.push(`+${fac.baseYield.geothermal} GW/s`);
      if (fac.baseYield.research) yields.push(`+${fac.baseYield.research} RP/s`);

      card.innerHTML = `
        <div class="facility-header">
          <div class="facility-icon">${fac.icon}</div>
          <div class="facility-info">
            <div class="facility-title">${fac.name}</div>
            <div class="facility-level">Level ${fac.level}</div>
          </div>
        </div>
        <div class="facility-desc">${fac.description}</div>
        <div class="facility-yield">Yield: ${yields.join(' ')}</div>
        <div class="facility-actions">
          <button class="btn-buy-fac" data-id="${fac.id}" data-tooltip-title="Upgrade ${fac.name}" data-tooltip="Requires: ${costStr}">
            Upgrade (${costStr})
          </button>
        </div>
      `;

      card.querySelector('.btn-buy-fac').addEventListener('click', () => {
        if (this.engine.idle.buyFacility(fac.id)) {
          this.scene.audio.playClick();
          this.renderFacilities();
        }
      });

      container.appendChild(card);
    });
  }

  updateFacilityAffordability() {
    const facilities = this.engine.idle.facilities;
    facilities.forEach(fac => {
      const card = document.getElementById(`fac-${fac.id}`);
      if (!card) return;
      const btn = card.querySelector('.btn-buy-fac');
      const cost = this.engine.idle.getFacilityCost(fac);
      const canAfford = this.engine.idle.canAfford(cost);
      if (btn) btn.disabled = !canAfford;
    });
  }

  renderTechTree() {
    const container = document.getElementById('tech-list');
    if (!container) return;

    container.innerHTML = '';
    const techs = this.engine.idle.techs;

    techs.forEach(tech => {
      const card = document.createElement('div');
      card.className = `tech-card ${tech.purchased ? 'purchased' : ''}`;
      card.id = `tech-${tech.id}`;
      card.setAttribute('data-tooltip-title', `${tech.icon} ${tech.name}`);
      card.setAttribute('data-tooltip', `${tech.effect} Status: ${tech.purchased ? 'Active' : 'Locked'}`);

      const costStr = Object.entries(tech.cost).map(([k, v]) => `${v.toLocaleString()} ${k.toUpperCase()}`).join(', ');

      card.innerHTML = `
        <div class="tech-header">
          <div class="tech-icon">${tech.icon}</div>
          <div class="tech-title">${tech.name}</div>
          ${tech.purchased ? '<span class="badge-unlocked">RESEARCHED</span>' : ''}
        </div>
        <div class="tech-desc">${tech.effect}</div>
        ${!tech.purchased ? `
          <button class="btn-buy-tech" data-id="${tech.id}" data-tooltip-title="Unlock Research" data-tooltip="Invest ${costStr} to permanently activate this breakthrough.">
            Research (${costStr})
          </button>
        ` : ''}
      `;

      const btn = card.querySelector('.btn-buy-tech');
      if (btn) {
        btn.addEventListener('click', () => {
          if (this.engine.idle.buyTech(tech.id)) {
            this.scene.audio.playDiscovery();
            this.renderTechTree();
          }
        });
      }

      container.appendChild(card);
    });
  }

  updateTechAffordability() {
    const techs = this.engine.idle.techs;
    techs.forEach(tech => {
      if (tech.purchased) return;
      const card = document.getElementById(`tech-${tech.id}`);
      if (!card) return;
      const btn = card.querySelector('.btn-buy-tech');
      if (btn) btn.disabled = !this.engine.idle.canAfford(tech.cost);
    });
  }

  renderCompendium() {
    const container = document.getElementById('minerals-grid');
    if (!container) return;

    container.innerHTML = '';
    const stats = this.engine.minerals.getDiscoveryStats();

    const statHeader = document.getElementById('compendium-stats');
    if (statHeader) {
      statHeader.textContent = `Cataloged: ${stats.discovered} / ${stats.total} Minerals & Rocks (${stats.percentage}%)`;
    }

    Object.values(MINERALS).forEach(m => {
      const isKnown = this.engine.minerals.isDiscovered(m.id);
      const card = document.createElement('div');
      card.className = `mineral-card ${isKnown ? 'discovered' : 'locked'}`;

      if (isKnown) {
        card.setAttribute('data-tooltip-title', `${m.icon} ${m.name} (${m.rarity})`);
        card.setAttribute('data-tooltip', `Mohs Hardness: ${m.hardness} | Base Value: $${m.value} | Research Yield: +${m.researchValue} RP | Formation Depth: ${m.idealDepth[0]}-${m.idealDepth[1]} km`);

        card.innerHTML = `
          <div class="mineral-icon">${m.icon}</div>
          <div class="mineral-name" style="color: ${m.color}">${m.name}</div>
          <div class="mineral-category">${m.category.replace('_', ' ')}</div>
          <div class="mineral-details">
            <div>Value: <b>$${m.value}</b></div>
            <div>Rarity: <b>${m.rarity}</b></div>
            <div>Depth: <b>${m.idealDepth[0]}-${m.idealDepth[1]} km</b></div>
          </div>
          <div class="mineral-lore">${m.description}</div>
        `;
      } else {
        card.setAttribute('data-tooltip-title', 'Undiscovered Mineral');
        card.setAttribute('data-tooltip', 'Drill boreholes in deep metamorphic zones, volcanic plumes, or sedimentary basins to uncover this deposit.');

        card.innerHTML = `
          <div class="mineral-icon">❓</div>
          <div class="mineral-name">Undiscovered Mineral</div>
          <div class="mineral-lore">Drill boreholes and test metamorphic/rift zones to discover.</div>
        `;
      }

      container.appendChild(card);
    });
  }

  renderPlateIntel() {
    const container = document.getElementById('plate-intel-list');
    if (!container) return;

    container.innerHTML = '';
    const plates = this.engine.plates.plates;

    plates.forEach(p => {
      const row = document.createElement('div');
      row.className = 'plate-row';
      row.setAttribute('data-tooltip-title', `${p.name} (${p.type.toUpperCase()})`);
      row.setAttribute('data-tooltip', `Drift Speed: ${p.driftSpeedCmYear} cm/year | Center: (${p.cx}, ${p.cy}) | Kinematic Vector: [${(p.vx * 10).toFixed(1)}, ${(p.vy * 10).toFixed(1)}]`);

      row.innerHTML = `
        <div class="plate-badge" style="background: ${p.color}"></div>
        <div class="plate-details">
          <div class="plate-name">${p.name} (${p.type})</div>
          <div class="plate-speed">Drift Velocity: <b>${p.driftSpeedCmYear} cm/yr</b></div>
        </div>
      `;
      container.appendChild(row);
    });

    const highestFault = [...this.engine.plates.faultLines].sort((a, b) => b.stress - a.stress)[0];
    const faultAlert = document.getElementById('fault-alert-box');
    if (faultAlert && highestFault) {
      const stressPercent = Math.round((highestFault.stress / highestFault.maxStress) * 100);
      faultAlert.setAttribute('data-tooltip-title', 'Critical Fault Tension Warning');
      faultAlert.setAttribute('data-tooltip', `When shear stress reaches 100%, an earthquake ruptures naturally, or you can trigger an immediate slip with the Trigger Fault tool.`);

      faultAlert.innerHTML = `
        <div class="alert-title">⚠️ Seismic Tension Watch</div>
        <div>Primary Fault at Grid (${highestFault.x}, ${highestFault.y}) is at <b>${stressPercent}%</b> critical strain.</div>
        <div class="alert-sub">Boundary Type: <b>${highestFault.type.toUpperCase()}</b></div>
      `;
    }
  }

  openDrillModal(sample) {
    const modal = document.getElementById('drill-modal');
    if (!modal) return;

    const col = sample.column;
    document.getElementById('drill-coords').textContent = `Location: Globe Lat ${col.latDeg}°, Lon ${col.lonDeg}° | Elev: ${col.elevation}m | Ice: ${col.iceThicknessKm}km`;
    document.getElementById('drill-temp-press').textContent = `Borehole Temp: ${col.temperature}°C | Lithostatic Pressure: ${col.pressure} kbar`;
    document.getElementById('drill-value').textContent = `+$${sample.sampleValue.toLocaleString()} Wealth | +${sample.researchGained} RP`;

    const strataContainer = document.getElementById('drill-strata-column');
    strataContainer.innerHTML = '';

    col.layers.forEach(l => {
      const rock = MINERALS[l.rockId] || { name: l.rockId, color: '#888', icon: '🪨' };
      const layerEl = document.createElement('div');
      layerEl.className = 'strata-layer';
      layerEl.style.borderLeftColor = rock.color;
      layerEl.setAttribute('data-tooltip-title', `${rock.icon} ${rock.name}`);
      layerEl.setAttribute('data-tooltip', `Depth: ${l.depthStartKm} to ${l.depthEndKm} km | Stratum Age: ${l.ageMa.toFixed(0)} Ma | Thickness: ${l.thicknessKm.toFixed(1)} km`);

      const veins = l.mineralDetails.map(m => `<span class="vein-tag" style="background:${m.color}22; border-color:${m.color}">${m.icon} ${m.name} (${Math.round(m.grade * 100)}%)</span>`).join(' ');

      layerEl.innerHTML = `
        <div class="strata-meta">
          <span class="strata-depth">${l.depthStartKm} - ${l.depthEndKm} km</span>
          <span class="strata-age">Age: ${l.ageMa.toFixed(0)} Ma</span>
        </div>
        <div class="strata-rock" style="color:${rock.color}">
          ${rock.icon} <b>${rock.name}</b> (${l.thicknessKm.toFixed(1)} km thick)
        </div>
        ${veins ? `<div class="strata-veins">${veins}</div>` : ''}
      `;
      strataContainer.appendChild(layerEl);
    });

    modal.classList.add('visible');
  }

  showEpochBanner(epoch) {
    const banner = document.getElementById('epoch-banner-modal');
    if (!banner) return;
    document.getElementById('banner-title').textContent = epoch.name;
    document.getElementById('banner-milestone').textContent = epoch.milestone;
    document.getElementById('banner-desc').textContent = epoch.description;
    banner.classList.add('visible');

    setTimeout(() => {
      banner.classList.remove('visible');
    }, 6000);
  }

  showToast(message, type = 'info') {
    const feed = document.getElementById('toast-feed');
    if (!feed) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    feed.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 400);
    }, 3800);
  }
}
