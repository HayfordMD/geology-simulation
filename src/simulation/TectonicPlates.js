// Spherical Tectonic Plates, Fault Lines, and Earthquake Dynamics

export class TectonicPlates {
  constructor(strataGrid) {
    this.grid = strataGrid;
    this.plates = [
      {
        id: 0,
        name: 'Laurentian Shield',
        type: 'continental',
        color: '#4cc9f0',
        cx: 14,
        cy: 10,
        vx: 0.08,
        vy: -0.03,
        driftSpeedCmYear: 2.8
      },
      {
        id: 1,
        name: 'Panthalassic Oceanic Plate',
        type: 'oceanic',
        color: '#4361ee',
        cx: 44,
        cy: 14,
        vx: -0.10,
        vy: 0.05,
        driftSpeedCmYear: 7.2
      },
      {
        id: 2,
        name: 'Gondwanan Craton',
        type: 'continental',
        color: '#7209b7',
        cx: 20,
        cy: 24,
        vx: 0.06,
        vy: -0.08,
        driftSpeedCmYear: 3.5
      },
      {
        id: 3,
        name: 'Tethyan Terrane',
        type: 'continental',
        color: '#f72585',
        cx: 48,
        cy: 22,
        vx: -0.07,
        vy: -0.06,
        driftSpeedCmYear: 5.1
      },
      {
        id: 4,
        name: 'Abyssal Ridge Plate',
        type: 'oceanic',
        color: '#06d6a0',
        cx: 32,
        cy: 16,
        vx: 0.09,
        vy: 0.08,
        driftSpeedCmYear: 4.4
      }
    ];

    this.faultLines = [];
    this.recentQuakes = [];
    this.assignPlates();
    this.detectFaultLines();
  }

  assignPlates() {
    for (let y = 0; y < this.grid.height; y++) {
      for (let x = 0; x < this.grid.width; x++) {
        let closestDist = Infinity;
        let assignedPlate = this.plates[0];

        for (const plate of this.plates) {
          // Spherical shortest distance considering longitude wrapping
          let dx = Math.abs(x - plate.cx);
          if (dx > this.grid.width / 2) {
            dx = this.grid.width - dx;
          }
          const dy = y - plate.cy;

          // Spherical metric weighting
          const noise = Math.sin(x * 0.35) * 1.2 + Math.cos(y * 0.45) * 1.2;
          const dist = Math.sqrt(dx * dx + dy * dy) + noise;

          if (dist < closestDist) {
            closestDist = dist;
            assignedPlate = plate;
          }
        }

        const cell = this.grid.getCell(x, y);
        cell.plateId = assignedPlate.id;
        cell.crustType = assignedPlate.type;
        if (assignedPlate.type === 'continental') {
          cell.elevation = Math.max(cell.elevation, 0.22 + Math.random() * 0.12);
          cell.crustThicknessKm = Math.max(cell.crustThicknessKm, 35.0);
        } else {
          cell.elevation = Math.min(cell.elevation, -0.15 - Math.random() * 0.15);
          cell.crustThicknessKm = Math.min(cell.crustThicknessKm, 7.5);
        }
      }
    }
  }

  detectFaultLines() {
    this.faultLines = [];
    const visited = new Set();

    for (let y = 0; y < this.grid.height; y++) {
      for (let x = 0; x < this.grid.width; x++) {
        const cell = this.grid.getCell(x, y);
        const pA = this.plates[cell.plateId];

        // Horizontal neighbor (wrapped) and vertical neighbor (clamped)
        const neighbors = [
          { nx: (x + 1) % this.grid.width, ny: y },
          { nx: x, ny: Math.min(this.grid.height - 1, y + 1) }
        ];

        for (const n of neighbors) {
          const neighborCell = this.grid.getCell(n.nx, n.ny);
          if (neighborCell.plateId !== cell.plateId) {
            const key = `${Math.min(x, n.nx)},${Math.min(y, n.ny)}-${Math.max(x, n.nx)},${Math.max(y, n.ny)}`;
            if (!visited.has(key)) {
              visited.add(key);
              const pB = this.plates[neighborCell.plateId];

              // Normal vector
              let dx = n.nx - x;
              if (dx > this.grid.width / 2) dx -= this.grid.width;
              if (dx < -this.grid.width / 2) dx += this.grid.width;
              const dy = n.ny - y;
              const len = Math.hypot(dx, dy) || 1;
              const normalX = dx / len;
              const normalY = dy / len;

              // Relative velocity
              const relVx = pA.vx - pB.vx;
              const relVy = pA.vy - pB.vy;
              const dotNormal = relVx * normalX + relVy * normalY;

              let type = 'transform';
              if (dotNormal < -0.025) type = 'convergent';
              else if (dotNormal > 0.025) type = 'divergent';

              this.faultLines.push({
                x,
                y,
                nx: n.nx,
                ny: n.ny,
                type,
                normalX,
                normalY,
                pA: pA.id,
                pB: pB.id,
                stress: 0.1 + Math.random() * 0.3,
                maxStress: 0.85 + Math.random() * 0.3,
                slipAccumulated: 0
              });
            }
          }
        }
      }
    }
  }

  update(deltaYears, epochModifiers) {
    const quakesThisTick = [];

    // Periodic tectonic plate drift migration (every few million years)
    if (deltaYears > 100_000) {
      for (const plate of this.plates) {
        plate.cx = ((plate.cx + plate.vx * 0.000005 * deltaYears) % this.grid.width + this.grid.width) % this.grid.width;
        plate.cy = Math.max(2, Math.min(this.grid.height - 3, plate.cy + plate.vy * 0.000005 * deltaYears));
      }
    }

    const overstressedFaults = [];

    // Stress accumulation & tectonic forces
    for (const fault of this.faultLines) {
      const pA = this.plates[fault.pA];
      const pB = this.plates[fault.pB];

      const relativeSpeed = Math.hypot(pA.vx - pB.vx, pA.vy - pB.vy);
      const stressDelta = Math.min(0.2, (relativeSpeed * 0.00015 * deltaYears) * (epochModifiers.seismicMultiplier || 1.0));
      fault.stress = Math.min(1.5, fault.stress + stressDelta);

      const cell = this.grid.getCell(fault.x, fault.y);
      cell.faultStress = Math.max(cell.faultStress, fault.stress);

      if (fault.type === 'convergent') {
        // Broad orogenesis: mountain chains and flanking foothill plateaus
        const maxUpliftRate = 0.000004;
        const boundedDeltaYears = Math.min(50_000, deltaYears);
        const upliftAmount = maxUpliftRate * boundedDeltaYears * (epochModifiers.seismicMultiplier || 1.0);
        this.grid.uplift(fault.x, fault.y, upliftAmount);
        this.grid.performMetamorphism(fault.x, fault.y);
        // Uplift adjacent plate margin creating realistic mountain chains
        this.grid.uplift(fault.nx, fault.ny, upliftAmount * 0.65);
      } else if (fault.type === 'divergent') {
        const boundedDeltaYears = Math.min(50_000, deltaYears);
        const riftAmount = 0.000003 * boundedDeltaYears;
        this.grid.subside(fault.x, fault.y, riftAmount);
        // Mid-ocean ridge hydrothermal injection prevents bottomless voids
        if (cell.elevation < -0.22 && Math.random() < 0.05) {
          this.grid.injectMagma(fault.x, fault.y, 0.05, 0);
        }
      }

      if (fault.stress >= fault.maxStress) {
        overstressedFaults.push(fault);
      }
    }

    // Fair stochastic stick-slip ruptures: pick randomly among strained faults
    if (overstressedFaults.length > 0) {
      const luckyIndex = Math.floor(Math.random() * overstressedFaults.length);
      const chosenFault = overstressedFaults[luckyIndex];
      const ruptureProbability = Math.min(1.0, 0.25 + (deltaYears / 2000) * 0.1);
      if (Math.random() < ruptureProbability && quakesThisTick.length < 1) {
        quakesThisTick.push(this.triggerRupture(chosenFault, false));
      }
      for (let i = 0; i < overstressedFaults.length; i++) {
        if (i !== luckyIndex) {
          overstressedFaults[i].stress = Math.max(0.45, overstressedFaults[i].stress - 0.04);
        }
      }
    }

    for (let i = 0; i < this.grid.cells.length; i++) {
      this.grid.cells[i].faultStress = Math.max(0, this.grid.cells[i].faultStress - 0.025);
    }

    return quakesThisTick;
  }

  triggerRupture(fault, forcedByPlayer = false) {
    const stressRelieved = fault.stress;
    fault.stress = Math.random() * 0.12;

    const baseMag = 5.0 + stressRelieved * 3.8 + (forcedByPlayer ? 0.4 : 0);
    const magnitude = Math.min(9.5, Math.round(baseMag * 10) / 10);

    const energyJoules = Math.pow(10, 1.5 * magnitude + 4.8);
    const energyMJ = Math.round(energyJoules / 1_000_000);

    const displacement = Math.min(0.06, (magnitude - 4.5) * 0.015);
    this.grid.uplift(fault.x, fault.y, displacement);

    const quakeData = {
      x: fault.x,
      y: fault.y,
      magnitude,
      energyMJ,
      type: fault.type,
      forcedByPlayer,
      timestamp: Date.now()
    };

    this.recentQuakes.unshift(quakeData);
    if (this.recentQuakes.length > 20) this.recentQuakes.pop();

    return quakeData;
  }

  triggerNearestFault(gridX, gridY) {
    let closestFault = null;
    let minDist = Infinity;

    for (const fault of this.faultLines) {
      let dx = Math.abs(fault.x - gridX);
      if (dx > this.grid.width / 2) dx = this.grid.width - dx;
      const dy = fault.y - gridY;
      const dist = Math.hypot(dx, dy);

      if (dist < minDist) {
        minDist = dist;
        closestFault = fault;
      }
    }

    if (closestFault) {
      if (closestFault.stress < 0.6) closestFault.stress = 0.85;
      return this.triggerRupture(closestFault, true);
    }
    return null;
  }
}
