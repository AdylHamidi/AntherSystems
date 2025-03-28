 /***** Constants *****/
    // Real light speed in terms of AU/s is 1/499 (≈8 min 19 s per AU). 
    // (If you want exactly 8 min per AU, use 1/480 instead.)
    const LIGHT_SPEED_AU_PER_SEC_REAL = 1 / 499; 
    // For our simulation we now use speeds in ly/s.
    // 1 ly = 63241 AU.
    const AU_PER_LY = 63241;
    const KM_PER_AU = 149597870.7;
    
    // Conversion factors for display:
    // In solar system mode, use 250 px per AU.
    const PX_PER_AU = 250;
    // In galactic mode, for distances beyond the solar system, use 150 px per ly.
    const PX_PER_LY = 500;
    
    // Mode switch: we define the solar system as the region inside 40 AU.
    const SOLAR_THRESHOLD_AU = 40;
    
    /***** Marker Definitions *****/
    // Markers for the solar system (up to Pluto).
    const solarMarkers = [
      { name: "Mercury", au: 0.39, img: "images/mercury.png" },
      { name: "Venus", au: 0.72, img: "images/venus.png" },
      { name: "Earth", au: 1, img: "images/earth.png" },
      { name: "Mars", au: 1.52, img: "images/mars.png" },
      { name: "Jupiter", au: 5.2, img: "images/jupiter.png" },
      { name: "Saturn", au: 9.58, img: "images/saturn.png" },
      { name: "Uranus", au: 19.22, img: "images/uranus.png" },
      { name: "Neptune", au: 30.05, img: "images/neptune.png" },
      { name: "Pluto", au: 39.5, img: "images/pluto.png" }
    ];
    
    // When switching to galactic mode, the entire solar system is represented by one marker.
    const solarSystemMarker = { name: "The Solar System", au: SOLAR_THRESHOLD_AU, img: "images/solar.png" };

    // Extended deep–space markers (galaxies, nebulas, stars, black holes, etc.)
    const galacticObjects = [
      // Nearby Stars
      { name: "Proxima Centauri", au: 268332, img: "images/proxima.png" },
      { name: "Sirius", au: 543872, img: "images/sirius.png" },
      
      // Bright Stars / Nebulae
      { name: "Betelgeuse", au: 548 * AU_PER_LY, img: "images/betelgeuse.png" },
      { name: "Orion Nebula", au: 1344 * AU_PER_LY, img: "images/orion_nebula.png" },
      { name: "Eagle Nebula", au: 7000 * AU_PER_LY, img: "images/eagle_nebula.png" },
      
      // Black Holes
      { name: "Cygnus X-1", au: 6000 * AU_PER_LY, img: "images/cygnus_x1.png" },
      { name: "Sagittarius A*", au: 26000 * AU_PER_LY, img: "images/sagittarius_a.png" },
      
      // Galaxies
      { name: "Andromeda Galaxy", au: 2.537e6 * AU_PER_LY, img: "images/andromeda.png" }
    ];
    
    /***** Simulation State Variables *****/
    let mode = "solar"; // "solar" until we reach SOLAR_THRESHOLD_AU, then "galactic"
    let markers = solarMarkers.slice(); // current markers array
    let AU_IN_PX_CURRENT = PX_PER_AU;
    let animationId;
    let positionAU = 0;
    let elapsedTime = 0;
    let lastTimestamp = null;
    // Speed in ly/s chosen by the user (dropdown); beam speed in AU/s = speed (ly/s) * AU_PER_LY.
    let chosenSpeed_lyPerSec = parseFloat(document.getElementById("speedSelect").value);
    let beamSpeed_AU_per_sec = chosenSpeed_lyPerSec * AU_PER_LY;
    
    /***** DOM References *****/
    const simulation = document.getElementById("simulation");
    const space = document.getElementById("space");
    const light = document.getElementById("light");
    const trail = document.getElementById("trail");
    const speedSelect = document.getElementById("speedSelect");
    const startBtn = document.getElementById("startBtn");
    const pauseBtn = document.getElementById("pauseBtn");
    const resetBtn = document.getElementById("resetBtn");
    const nextBtn = document.getElementById("nextBtn");
    const infoDisplay = document.getElementById("info");
    
    /***** Utility Functions *****/
    // Recalculate the space width based on the current mode and markers.
    function recalcSpaceWidth() {
      let widthPx;
      if (mode === "solar") {
        // Use the farthest marker's AU times PX_PER_AU plus a margin.
        const maxAU = Math.max(...markers.map(o => o.au));
        widthPx = maxAU * PX_PER_AU + 500;
      } else {
        // In galactic mode: first SOLAR_THRESHOLD_AU is drawn at 250 px per AU.
        // Then additional distance is in ly: (positionAU - SOLAR_THRESHOLD_AU)/AU_PER_LY * PX_PER_LY.
        const maxAU = Math.max(...markers.map(o => o.au));
        widthPx = (SOLAR_THRESHOLD_AU * PX_PER_AU) + (((maxAU - SOLAR_THRESHOLD_AU) / AU_PER_LY) * PX_PER_LY) + 500;
      }
      space.style.width = widthPx + "px";
    }
    
    // Draw markers in the simulation.
    function drawMarkers() {
      // Remove existing markers.
      document.querySelectorAll('.marker').forEach(marker => marker.remove());
      // For each marker, compute its position in px based on its AU value and current mode.
      markers.forEach(obj => {
        const marker = document.createElement("div");
        marker.className = "marker";
        let posPx;
        if (mode === "solar") {
          posPx = obj.au * PX_PER_AU;
        } else {
          // For markers beyond the solar system, if au > SOLAR_THRESHOLD_AU, use new scale.
          if (obj.au <= SOLAR_THRESHOLD_AU) {
            posPx = obj.au * PX_PER_AU;
          } else {
            posPx = (SOLAR_THRESHOLD_AU * PX_PER_AU) + (((obj.au - SOLAR_THRESHOLD_AU) / AU_PER_LY) * PX_PER_LY);
          }
        }
        marker.style.left = posPx + "px";
        
        // Create the image element.
        const img = document.createElement("img");
        img.src = obj.img;
        img.alt = obj.name;
        marker.appendChild(img);
        
        // Add the caption below the image.
        const caption = document.createElement("div");
        caption.className = "marker-caption";
        caption.innerText = obj.name;
        marker.appendChild(caption);
        
        // Create a tooltip element that will appear on hover.
        const tooltip = document.createElement("div");
        tooltip.className = "tooltip";
        tooltip.innerText = `${obj.name}: ${obj.au.toLocaleString()} AU from the Sun`;
        marker.appendChild(tooltip);
        
        // Optional: clicking the marker shows an alert with info.
        marker.addEventListener('click', () => {
          alert(`${obj.name}: ${obj.au.toLocaleString()} AU from the Sun`);
        });
        space.appendChild(marker);
      });
    }
    
    // Update info display with elapsed time and distances.
    function updateInfo() {
      const distanceKM = positionAU * KM_PER_AU;
      const distanceAU = positionAU;
      const distanceLY = positionAU / AU_PER_LY;
      // Determine next body: in current mode, look for the first marker with au > positionAU.
      let nextBody = markers.find(o => o.au > positionAU);
      let nextInfo = "Next: N/A";
      if (nextBody) {
        const deltaAU = nextBody.au - positionAU;
        const deltaKM = deltaAU * KM_PER_AU;
        const deltaLY = deltaAU / AU_PER_LY;
        nextInfo = `Next: ${nextBody.name} in ${deltaAU.toFixed(2)} AU (${Math.floor(deltaKM).toLocaleString()} km, ${deltaLY.toFixed(4)} ly)`;
      }
      infoDisplay.innerText = 
        `Time: ${elapsedTime.toFixed(2)} s | Distance: ${Math.floor(distanceKM).toLocaleString()} km | ${distanceAU.toFixed(2)} AU | ${distanceLY.toFixed(4)} ly\n` +
        nextInfo;
    }
    
    // Given the current positionAU, compute the light beam's pixel position.
    function computePositionPx() {
      let posPx;
      if (mode === "solar") {
        posPx = positionAU * PX_PER_AU;
      } else {
        // In galactic mode, first SOLAR_THRESHOLD_AU is drawn at 250 px per AU.
        // Beyond that, convert extra AU to ly and then to px.
        posPx = (SOLAR_THRESHOLD_AU * PX_PER_AU) + (((positionAU - SOLAR_THRESHOLD_AU) / AU_PER_LY) * PX_PER_LY);
      }
      return posPx;
    }
    
    // Switch mode from solar to galactic.
    function switchToGalactic() {
      mode = "galactic";
      // In galactic mode, represent the entire solar system as one marker,
      // then add the galactic (deep–space) objects.
      markers = [solarSystemMarker].concat(galacticObjects);
      recalcSpaceWidth();
      drawMarkers();
      console.log("Switched to Galactic Mode");
    }
    
    /***** Animation Loop *****/
    function animate(timestamp) {
      if (lastTimestamp === null) lastTimestamp = timestamp;
      const dt = (timestamp - lastTimestamp) / 1000; // seconds elapsed
      lastTimestamp = timestamp;
      
      // Update beam position in AU.
      positionAU += beamSpeed_AU_per_sec * dt;
      
      // Check for mode switch: if still in solar mode but we passed SOLAR_THRESHOLD_AU, switch.
      if (mode === "solar" && positionAU >= SOLAR_THRESHOLD_AU) {
        switchToGalactic();
      }
      
      // Compute pixel position.
      const posPx = computePositionPx();
      light.style.left = posPx + "px";
      trail.style.width = posPx + "px";
      // Center simulation view.
      simulation.scrollLeft = posPx - simulation.clientWidth / 2;
      
      elapsedTime += dt;
      updateInfo();
      
      animationId = requestAnimationFrame(animate);
    }
    
    /***** Control Functions *****/
    function startSimulation() {
      lastTimestamp = null;
      animationId = requestAnimationFrame(animate);
    }
    
    function togglePause() {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
        pauseBtn.innerText = "Resume";
      } else {
        pauseBtn.innerText = "Pause";
        lastTimestamp = null;
        animationId = requestAnimationFrame(animate);
      }
    }
    
    function resetSimulation() {
      cancelAnimationFrame(animationId);
      animationId = null;
      positionAU = 0;
      elapsedTime = 0;
      lastTimestamp = null;
      mode = "solar";
      // Reset markers to solar markers.
      markers = solarMarkers.slice();
      AU_IN_PX_CURRENT = PX_PER_AU;
      recalcSpaceWidth();
      drawMarkers();
      light.style.left = "0px";
      trail.style.width = "0px";
      simulation.scrollLeft = 0;
      updateInfo();
      pauseBtn.innerText = "Pause";
    }
    
    // Jump immediately to the next body.
    function jumpToNext() {
      // Find the next marker after current positionAU.
      const nextBody = markers.find(o => o.au > positionAU);
      if (nextBody) {
        positionAU = nextBody.au;
        // If the new position exceeds the solar threshold, switch mode.
        if (mode === "solar" && positionAU >= SOLAR_THRESHOLD_AU) {
          switchToGalactic();
        }
        const posPx = computePositionPx();
        light.style.left = posPx + "px";
        trail.style.width = posPx + "px";
        simulation.scrollLeft = posPx - simulation.clientWidth / 2;
        updateInfo();
      } else {
        alert("No further bodies.");
      }
    }
    
    /***** Event Listeners *****/
    // Update beam speed when the user selects a new speed (in ly/s).
    speedSelect.addEventListener("change", () => {
      chosenSpeed_lyPerSec = parseFloat(speedSelect.value);
      beamSpeed_AU_per_sec = chosenSpeed_lyPerSec * AU_PER_LY;
    });
    
    startBtn.addEventListener("click", startSimulation);
    pauseBtn.addEventListener("click", togglePause);
    resetBtn.addEventListener("click", resetSimulation);
    nextBtn.addEventListener("click", jumpToNext);
    
    // Initialize simulation space.
    recalcSpaceWidth();
    drawMarkers();
    updateInfo();