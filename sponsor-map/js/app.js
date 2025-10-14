import { parseCSV } from "./parser.js";

const isMobileView = () => window.matchMedia("(max-width: 768px)").matches;

async function initMap() {  
    let markerSymbol = {
        type: "simple-marker",
        style: "circle",
        size: 12,
        outline: {
            color: "#333",
            width: 1.5
        }
    };

    let defaultLabelSymbol = {
        type: "text",
        color: "#333",
        haloColor: "#fff",
        haloSize: "1px",
        font: {
            size: 10,
            weight: "bold"
        },
        yoffset: 12 
    }

    const geoHex = "#996633";
    const silverHex = "#8c9aaa";
    const goldHex = "#e6b800";
    const platinumHex = "#a5c6ff";

    let allSponsorData = [];
    

    function legendButtonOnClick() {
        isLegendEnabled = !isLegendEnabled;

        if (isLegendEnabled) {
            legendButton.classList.add("enabled");
            legendPanel.style.display = "initial";
        } else {
            legendButton.classList.remove("enabled");
            legendPanel.style.display = "none";
        }
    }

    function sponsorSidebarButtonOnClick() {
        isSponsorSidebarEnabled = !isSponsorSidebarEnabled;

        if (isSponsorSidebarEnabled) {
            sponsorSidebar.classList.add("active");
            sponsorSidebar.setAttribute("aria-hidden", "false");
            sponsorSidebar.focus();
            sponsorListButton.classList.add("enabled");
        } else {
            sponsorSidebar.classList.add("animating-out");
            sponsorListButton.classList.remove("enabled");

            setTimeout(() => {
                sponsorSidebar.classList.remove("animating-out");
                sponsorSidebar.classList.remove("active");
                sponsorSidebar.setAttribute("aria-hidden", "true");
            }, 300);
        }
    }

    function generateTableFromSponsor(sponsor) {
        const sponsorshipTierClass = {
            Geo: "geoTier",
            Silver: "silverTier",
            Gold: "goldTier",
            Platinum: "platinumTier"
        }[sponsor.SponsorshipLevel] || "geoTier";

        const tableAriaLabel = `Details for sponsor ${sponsor.Sponsor}`;

        return `
            <table class="sponsor-table" aria-label="${tableAriaLabel}">
                <tr>
                    <th scope="row" class="label">Sponsorship Tier</th>
                    <td class="dataValue ${sponsorshipTierClass}">${sponsor.SponsorshipLevel || '—'}</td>
                </tr>
                <tr>
                    <th scope="row" class="label">Website</th>
                    <td class="dataValue"><a href="${sponsor.Website}" target="_blank" aria-label="Visit ${sponsor.Sponsor} website">${sponsor.Website}</a></td>
                </tr>
                <tr>
                    <th scope="row" class="label">Contact Info</th>
                    <td class="dataValue">${sponsor.ContactInfo || '—'}</td>
                </tr>
                <tr>
                    <th scope="row" class="label">Phone Number</th>
                    <td class="dataValue">${sponsor.PhoneNumber || '—'}</td>
                </tr>
            </table>     
            <div style="text-align: center; margin-top:15px"><img src="${sponsor.LogoUrl}" alt="${sponsor.Sponsor} logo" style="max-height:80px;"  onerror="this.style.display='none';"/></div>
        `;
    }

    function loadSponsorsList() {
        const sponsorListContent = document.querySelector(".sponsor-list-content");
        const tierOrder = { "Platinum": 0, "Gold": 1, "Silver": 2, "Geo": 3 };
        sponsorListContent.innerHTML = "";

        const sortedSponsors = [...allSponsorData].sort((a, b) => {
        const tierDiff = (tierOrder[a.SponsorshipLevel] ?? 99) - (tierOrder[b.SponsorshipLevel] ?? 99);
        if (tierDiff !== 0) return tierDiff;
            return a.Sponsor.localeCompare(b.Sponsor);
        });

        sortedSponsors.forEach(sponsor => {
            const entry = document.createElement("div");
            entry.className = "sponsor-entry";
            entry.setAttribute("role", "listitem");

            let zoomToSponsor = function () {
                let point = new Point({ latitude: sponsor.Latitude, longitude: sponsor.Longitude });
                view.goTo({
                    target: point,
                    zoom: 12
                }, {
                    duration: 1000,
                    easing: "ease-in-out"
                });

                if (isMobileView()) {
                    sponsorCloseButton.click();
                }
            }

            entry.innerHTML = `
                <div style="display: flex; align-items: center;">
                    <h3 aria-label="${sponsor.Sponsor}">${sponsor.Sponsor}</h3>
                    <div style="margin-left: auto;">
                        <button class="zoom-to-button esri-icon-zoom-in-magnifying-glass" title="View on map" aria-label="View on map">
                        </button>
                    </div>
                </div>
                ${generateTableFromSponsor(sponsor)}
                <br/>`;
            const button = entry.querySelector(".zoom-to-button");
            button.onclick = zoomToSponsor;
            sponsorListContent.appendChild(entry);                    
        });
    }

    let lastHoveredGraphic = null;

    // Change outline on hover
    function changeMarkerOutlineOnHover() {
        view.on("pointer-move", function(event) {
            view.hitTest(event).then(function(response) {
                const hitGraphic = response.results.find(result =>
                    result.graphic.layer === sponsorsGraphicLayer &&
                    result.graphic.attributes 
                )?.graphic;

                // If there's no hit, and had something hovered before, reset it
                if (!hitGraphic && lastHoveredGraphic) {
                    const originalSymbol = lastHoveredGraphic.symbol.clone();
                    originalSymbol.outline.color = "black";
                    lastHoveredGraphic.symbol = originalSymbol;
                    lastHoveredGraphic = null;
                    view.container.style.cursor = "default";
                    return;
                }

                // If hovering over a new thing, update it and reset the old one
                if (hitGraphic !== lastHoveredGraphic) {

                    // Reset previous
                    if (lastHoveredGraphic) {
                        const originalSymbol = lastHoveredGraphic.symbol.clone();
                        originalSymbol.outline.color = "black";
                        lastHoveredGraphic.symbol = originalSymbol;
                    }

                    // Update new
                    if (hitGraphic) {
                        const hoverSymbol = hitGraphic.symbol.clone();
                        hoverSymbol.outline.color = "rgba(0, 240, 255, 1)";
                        hitGraphic.symbol = hoverSymbol;
                        view.container.style.cursor = "pointer";
                        lastHoveredGraphic = hitGraphic;
                    }
                }
            });
        });
    }

    try {
        const res = await fetch("./gans_sponsors.csv");
        if (!res.ok) throw new Error("Network response not ok");
        const csvText = await res.text();
        allSponsorData = parseCSV(csvText); 
    } catch (err) {
        alert("Failed to load sponsors. Please try again later.");
        console.error("Could not load or parse CSV:", err);
    }

    // Init elements
    let isLegendEnabled = false;
    let isSponsorSidebarEnabled = false;

    let legendButton = document.getElementById("legendButton");
    let legendPanel = document.getElementById("legendPanel");
    legendButton.onclick = legendButtonOnClick;

    let sponsorListButton = document.getElementById("sponsorListButton");
    let sponsorCloseButton = document.getElementById("closeSponsorList");
    let sponsorSidebar = document.getElementById("sponsorSidebar");
    sponsorListButton.onclick = sponsorSidebarButtonOnClick;
    sponsorCloseButton.onclick = sponsorSidebarButtonOnClick;

    loadSponsorsList();

    const [Map, MapView, GraphicsLayer, Graphic, Point] = await $arcgis.import([
        "esri/Map",
        "esri/views/MapView",
        "esri/layers/GraphicsLayer",
        "esri/Graphic",
        "@arcgis/core/geometry/Point.js",
    ]);

    const map = new Map({
        basemap: "gray-vector"
    });

    const view = new MapView({
        container: "viewDiv",
        map,
        center: [-63.6, 44.65], 
        zoom: 7,
        popup: {
            dockEnabled: false,
            dockOptions: {
                buttonEnabled: false,
                breakpoint: true     
            },
            collapseEnabled: false,
            visibleElements: {
                collapseButton: false
            }
        }
    });

    const homeEl = document.querySelector("arcgis-home");
    homeEl.view = view;

    let sponsorsGraphicLayer = new GraphicsLayer({ title: "sponsorsGraphicsLayer" });
    map.add(sponsorsGraphicLayer);
    let sponsorsLabelGraphicLayer = new GraphicsLayer({ title: "sponsorsLabelGraphicLayer", minScale: 100000 });
    map.add(sponsorsLabelGraphicLayer);

    // For each sponsor, create graphic. Note that Platinum markers will have a glowing animation.
    allSponsorData.forEach(sponsor => {
        let point = new Point({ latitude: sponsor.Latitude, longitude: sponsor.Longitude, spatialReference: 4326 });
        
        // Label symbol
        let labelSymbol = JSON.parse(JSON.stringify(defaultLabelSymbol));
        labelSymbol.text = sponsor.Sponsor;

        const labelGraphic = new Graphic({
            geometry: point,
            symbol: labelSymbol,    
        });
        sponsorsLabelGraphicLayer.add(labelGraphic);

        // Marker symbol
        let symbol = JSON.parse(JSON.stringify(markerSymbol));
        
        if (sponsor.SponsorshipLevel === "Silver") { // Silver
            symbol.color = silverHex;

        } else if (sponsor.SponsorshipLevel === "Gold" ) { // Gold
            symbol.color = goldHex;
        } else if (sponsor.SponsorshipLevel === "Platinum" ) { // Platinum
            symbol.color = platinumHex;
        } else { // Geo
            symbol.color = geoHex;
        }

        if (sponsor.SponsorshipLevel === "Platinum") {
            const baseSymbol = {
                type: "simple-marker",
                style: "circle",
                size: 12,
                color: "#a5c6ff",  
                outline: {
                    color: "black",
                    width: 1.5
                }
            };

            const glowSymbol = {
                type: "simple-marker",
                style: "circle",
                size: 18,  
                color: "transparent",  // Just outline
                outline: {
                    color: `rgba(173, 216, 255, 0.4)`,  
                    width: 4
                }
            };

            const baseGraphic = new Graphic({
                geometry: point,
                symbol: baseSymbol,
                attributes: sponsor,
                popupTemplate: {
                    title: sponsor.Sponsor,
                    content: createPopupContent
                }
            });

            const glowGraphic = new Graphic({
                geometry: point,
                symbol: glowSymbol
            });

            // Add both to map
            sponsorsGraphicLayer.addMany([glowGraphic, baseGraphic]);

            animateGlowRing(glowGraphic);
        } else {   
            let graphic = new Graphic({
                geometry: point,
                symbol: symbol,
                attributes: sponsor,
                popupTemplate: {
                    title: sponsor.Sponsor,
                    content: createPopupContent
                }
            });
            sponsorsGraphicLayer.add(graphic);
        }        
    });  

    changeMarkerOutlineOnHover();

    // Create popup for the sponsor. Assign class based on sponsorship tier.
    function createPopupContent(graphic) {
        const sponsor = graphic.graphic.attributes;
        
        return generateTableFromSponsor(sponsor);
    }    
    
    function animateGlowRing(glowGraphic) {
        let pulse = 0;
        let direction = 1;
        let lastTime = null;

        const baseOpacity = 0.3;
        const baseWidth = 0.5;
        const amplitudeOpacity = 0.4;
        const amplitudeWidth = 2;

        function step(timestamp) {
            if (!lastTime) lastTime = timestamp;
            const delta = timestamp - lastTime;
            lastTime = timestamp;

            // Adjust pulse based on elapsed time
            const speed = 0.002; // Smaller = slower pulse
            pulse += direction * delta * speed;

            if (pulse >= 1) {
                pulse = 1;
                direction = -1;
            } else if (pulse <= 0) {
                pulse = 0;
                direction = 1;
            }

            const glowOpacity = baseOpacity + pulse * amplitudeOpacity;
            const outlineWidth = baseWidth + pulse * amplitudeWidth;

            const updatedSymbol = glowGraphic.symbol.clone();
            updatedSymbol.outline.color = `rgba(173, 216, 255, ${glowOpacity})`;
            updatedSymbol.outline.width = outlineWidth;
            glowGraphic.symbol = updatedSymbol;

            requestAnimationFrame(step);
        }

        requestAnimationFrame(step);
    }
}

initMap();