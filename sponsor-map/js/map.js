const isMobileView = () => window.matchMedia("(max-width: 768px)").matches;

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
    yoffset: 12,
    horizontalAlignment: "center",
    verticalAlignment: "bottom",
}

const geoHex = "#996633";
const silverHex = "#8c9aaa";
const goldHex = "#e6b800";
const platinumHex = "#a5c6ff";

let sponsorsGraphicLayer;

function wrapText(text, maxLength = 10) {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    const words = text.split(" ");
    let lines = [];
    let currentLine = "";

    for (let word of words) {
        if ((currentLine + word).length <= maxLength) {
            currentLine += (currentLine ? " " : "") + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    if (currentLine) lines.push(currentLine);

    return lines.join("\n");
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
        <div style="text-align: center; margin-top:15px"><img src="${sponsor.LogoUrl}" alt="${sponsor.Sponsor} logo" style="max-height:80px;max-width:375px"  onerror="this.style.display='none';"/></div>
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

        let zoomToSponsor = async function () {
            const [Point] = await $arcgis.import([
                "@arcgis/core/geometry/Point.js",
            ]);
            let point = new Point({ latitude: sponsor.Latitude, longitude: sponsor.Longitude });
            view.goTo({
                target: point,
                zoom: 12
            }, {
                duration: 1000,
                easing: "ease-in-out"
            });

            if (isMobileView()) {
                let sponsorCloseButton = document.getElementById("closeSponsorList");
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
        view.hitTest(event).then(function (response) {
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

let view;
let allSponsorData;

async function initializeMap(data) {
    allSponsorData = data;
    const [Map, MapView, GraphicsLayer, Graphic, Point, reactiveUtils ] = await $arcgis.import([
        "esri/Map",
        "esri/views/MapView",
        "esri/layers/GraphicsLayer",
        "esri/Graphic",
        "@arcgis/core/geometry/Point.js",
        "@arcgis/core/core/reactiveUtils.js"
    ]);

    const map = new Map({
        basemap: "gray-vector"
    });

    view = new MapView({
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

    sponsorsGraphicLayer = new GraphicsLayer({ title: "sponsorsGraphicsLayer" });
    map.add(sponsorsGraphicLayer);
    let sponsorsLabelGraphicLayer = new GraphicsLayer({ title: "sponsorsLabelGraphicLayer", minScale: 75000 });
    map.add(sponsorsLabelGraphicLayer);

    reactiveUtils.watch(() => view.scale, (newScale) => {
        sponsorsLabelGraphicLayer.graphics.forEach(graphic => {
            if (graphic._maxScale) {
                const min = graphic._minScale ?? 0;
                const max = graphic._maxScale ?? Infinity;
                graphic.visible = (newScale <= max && newScale >= min);
            }
        });
    });

    // For each sponsor, create graphic. Note that Platinum markers will have a glowing animation.
    allSponsorData.forEach(sponsor => {
        let point = new Point({ latitude: sponsor.Latitude, longitude: sponsor.Longitude, spatialReference: 4326 });
        
        // Label symbol
        if (sponsor.Sponsor === "Service Nova Scotia") {
            let labelSymbol = JSON.parse(JSON.stringify(defaultLabelSymbol));

            let graphic1 = new Graphic({
                geometry: point,
                symbol: { ...labelSymbol, text: sponsor.Sponsor, yoffset: -3,xoffset: 60 }
            });
            graphic1._minScale = 5000;
            graphic1._maxScale = 75000;

            let graphic3 = new Graphic({
                geometry: point,
                symbol: { ...labelSymbol, text: wrapText(sponsor.Sponsor, 12), yoffset: 12, }
            });
            graphic3._minScale = 0;
            graphic3._maxScale = 5000;

            sponsorsLabelGraphicLayer.add(graphic1);
            sponsorsLabelGraphicLayer.add(graphic3);
        } else if (sponsor.Sponsor === "CBCL Limited") {
            let labelSymbol = JSON.parse(JSON.stringify(defaultLabelSymbol));
            labelSymbol.text = wrapText(sponsor.Sponsor, 12);

            let graphic1 = new Graphic({
                geometry: point,
                symbol: { ...labelSymbol, text: sponsor.Sponsor, yoffset: 20,xoffset: 45 }
            });
            graphic1._minScale = 25000;
            graphic1._maxScale = 75000;            

            let graphic2 = new Graphic({
                geometry: point,
                symbol: { ...labelSymbol, text: sponsor.Sponsor, yoffset: 15,xoffset: 0 }
            });
            graphic2._minScale = 5000;
            graphic2._maxScale = 25000;

            let graphic3 = new Graphic({
                geometry: point,
                symbol: { ...labelSymbol, text: wrapText(sponsor.Sponsor, 12), yoffset: 12, }
            });
            graphic3._minScale = 0;
            graphic3._maxScale = 5000;

            sponsorsLabelGraphicLayer.add(graphic1);
            sponsorsLabelGraphicLayer.add(graphic2);
            sponsorsLabelGraphicLayer.add(graphic3);
        } else {
            let labelSymbol = JSON.parse(JSON.stringify(defaultLabelSymbol));
            labelSymbol.text = wrapText(sponsor.Sponsor, 12);

            const labelGraphic = new Graphic({
                geometry: point,
                symbol: labelSymbol,    
            });
            sponsorsLabelGraphicLayer.add(labelGraphic);
        }

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
    loadSponsorsList();
}

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
    const amplitudeWidth = 6;

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

export { initializeMap };