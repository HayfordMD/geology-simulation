import { FACILITIES, RESEARCH_TECH } from '../config/upgrades.js';

export class IdleManager {
  constructor() {
    this.resources = {
      money: 250, // Starting mineral wealth
      seismic: 50, // Starting seismic energy
      geothermal: 20, // Starting geothermal
      research: 10 // Starting research points
    };

    this.rates = {
      money: 0,
      seismic: 0,
      geothermal: 0,
      research: 0
    };

    this.multipliers = {
      seismicHarvest: 1.0,
      prospectResearch: 1.0,
      preciousVeinYield: 1.0,
      metamorphicYield: 1.0,
      geothermalMultiplier: 1.0,
      mineralWealth: 1.0
    };

    this.facilities = JSON.parse(JSON.stringify(FACILITIES));
    this.techs = JSON.parse(JSON.stringify(RESEARCH_TECH));
    this.autoVentFaults = false;
    this.uraniumUnlocked = false;

    this.lastTickTime = Date.now();
    this.lastSaveTime = Date.now();

    this.loadState();
  }

  calculateRates(currentEpoch) {
    let moneyRate = 0;
    let seismicRate = 0;
    let geothermalRate = currentEpoch ? (currentEpoch.geothermalBase * 0.1 * this.multipliers.geothermalMultiplier) : 2.0;
    let researchRate = 0.2; // Baseline natural discovery

    for (const fac of this.facilities) {
      if (fac.level > 0) {
        if (fac.baseYield.money) moneyRate += fac.baseYield.money * fac.level * this.multipliers.mineralWealth;
        if (fac.baseYield.seismic) seismicRate += fac.baseYield.seismic * fac.level * this.multipliers.seismicHarvest;
        if (fac.baseYield.geothermal) geothermalRate += fac.baseYield.geothermal * fac.level * this.multipliers.geothermalMultiplier;
        if (fac.baseYield.research) researchRate += fac.baseYield.research * fac.level;
      }
    }

    this.rates = {
      money: Math.round(moneyRate * 10) / 10,
      seismic: Math.round(seismicRate * 10) / 10,
      geothermal: Math.round(geothermalRate * 10) / 10,
      research: Math.round(researchRate * 10) / 10
    };
  }

  update(deltaSec, currentEpoch) {
    this.calculateRates(currentEpoch);

    this.resources.money += this.rates.money * deltaSec;
    this.resources.seismic += this.rates.seismic * deltaSec;
    this.resources.geothermal += this.rates.geothermal * deltaSec;
    this.resources.research += this.rates.research * deltaSec;

    // Periodically save state
    const now = Date.now();
    if (now - this.lastSaveTime > 10000) {
      this.saveState();
      this.lastSaveTime = now;
    }
  }

  addSeismicFromQuake(energyMJ) {
    const earned = Math.max(5, Math.round(Math.sqrt(energyMJ) * 0.5 * this.multipliers.seismicHarvest));
    this.resources.seismic += earned;
    return earned;
  }

  getFacilityCost(facility) {
    const mult = Math.pow(facility.costMultiplier, facility.level);
    const cost = {};
    for (const [res, baseVal] of Object.entries(facility.baseCost)) {
      cost[res] = Math.round(baseVal * mult);
    }
    return cost;
  }

  canAfford(costObj) {
    for (const [res, amount] of Object.entries(costObj)) {
      if ((this.resources[res] || 0) < amount) {
        return false;
      }
    }
    return true;
  }

  deductCost(costObj) {
    for (const [res, amount] of Object.entries(costObj)) {
      this.resources[res] -= amount;
    }
  }

  buyFacility(facilityId) {
    const fac = this.facilities.find(f => f.id === facilityId);
    if (!fac) return false;

    const cost = this.getFacilityCost(fac);
    if (this.canAfford(cost)) {
      this.deductCost(cost);
      fac.level++;
      return true;
    }
    return false;
  }

  buyTech(techId) {
    const tech = this.techs.find(t => t.id === techId);
    if (!tech || tech.purchased) return false;

    if (this.canAfford(tech.cost)) {
      this.deductCost(tech.cost);
      tech.purchased = true;

      // Re-bind apply function from research config
      const originalTech = RESEARCH_TECH.find(t => t.id === techId);
      if (originalTech && originalTech.apply) {
        originalTech.apply(this);
      }
      return true;
    }
    return false;
  }

  saveState() {
    try {
      const data = {
        resources: this.resources,
        facilities: this.facilities.map(f => ({ id: f.id, level: f.level })),
        techs: this.techs.map(t => ({ id: t.id, purchased: t.purchased })),
        multipliers: this.multipliers,
        autoVentFaults: this.autoVentFaults,
        uraniumUnlocked: this.uraniumUnlocked,
        timestamp: Date.now()
      };
      localStorage.setItem('geogenesis_idle_save', JSON.stringify(data));
    } catch (e) {
      console.warn('Unable to save to localStorage:', e);
    }
  }

  loadState() {
    try {
      const saved = localStorage.getItem('geogenesis_idle_save');
      if (!saved) return null;
      const data = JSON.parse(saved);

      if (data.resources) Object.assign(this.resources, data.resources);
      if (data.multipliers) Object.assign(this.multipliers, data.multipliers);
      if (data.autoVentFaults !== undefined) this.autoVentFaults = data.autoVentFaults;
      if (data.uraniumUnlocked !== undefined) this.uraniumUnlocked = data.uraniumUnlocked;

      if (data.facilities) {
        data.facilities.forEach(savedFac => {
          const fac = this.facilities.find(f => f.id === savedFac.id);
          if (fac) fac.level = savedFac.level;
        });
      }

      if (data.techs) {
        data.techs.forEach(savedTech => {
          const tech = this.techs.find(t => t.id === savedTech.id);
          if (tech && savedTech.purchased) {
            tech.purchased = true;
            const originalTech = RESEARCH_TECH.find(t => t.id === tech.id);
            if (originalTech && originalTech.apply) {
              originalTech.apply(this);
            }
          }
        });
      }

      // Calculate offline progression
      if (data.timestamp) {
        const elapsedSec = Math.min(43200, (Date.now() - data.timestamp) / 1000); // Max 12 hours
        if (elapsedSec > 10) {
          const offlineEarnings = {
            money: Math.round(this.rates.money * elapsedSec),
            seismic: Math.round(this.rates.seismic * elapsedSec),
            geothermal: Math.round(this.rates.geothermal * elapsedSec),
            research: Math.round(this.rates.research * elapsedSec),
            elapsedMinutes: Math.round(elapsedSec / 60)
          };
          this.resources.money += offlineEarnings.money;
          this.resources.seismic += offlineEarnings.seismic;
          this.resources.geothermal += offlineEarnings.geothermal;
          this.resources.research += offlineEarnings.research;
          return offlineEarnings;
        }
      }
    } catch (e) {
      console.warn('Unable to load from localStorage:', e);
    }
    return null;
  }
}
