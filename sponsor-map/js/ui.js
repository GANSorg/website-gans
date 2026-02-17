let isLegendEnabled = false;
let isSponsorSidebarEnabled = false;
let isHelpDialogEnabled = false;
let isFullScreen = false;
let legendPanel, sponsorSidebar, helpDialog;
let fullScreenButton, legendButton, sponsorListButton, sponsorCloseButton, helpButton, helpCloseButton;

function fullScreenButtonOnClick() {
    isFullScreen = !isFullScreen;

    if (isFullScreen) {        
        fullScreenButton.classList.remove("esri-icon-zoom-out-fixed");
        fullScreenButton.classList.add("esri-icon-zoom-in-fixed");
        makeIframeFullscreen();
    } else {
        fullScreenButton.classList.add("esri-icon-zoom-out-fixed");
        fullScreenButton.classList.remove("esri-icon-zoom-in-fixed");

        exitIframeFullscreen();
    }
}

function makeIframeFullscreen() {
    const iframe = window.frameElement;

    if (iframe) {
        iframe.classList.add("fake-fullscreen");
        document.body.classList.add("no-scroll");
    }
}

function exitIframeFullscreen() {
    window.parent.postMessage({ action: 'exit-fullscreen' }, '*');
}

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

function helpButtonOnClick() {
    isHelpDialogEnabled = !isHelpDialogEnabled;

    if (isHelpDialogEnabled) {
        helpButton.classList.add("enabled");
        helpDialog.style.display = "initial";
    } else {
        helpButton.classList.remove("enabled");
        helpDialog.style.display = "none";
    }
}

function updateLegendTierCounts(sponsorData) {
    let platinumCount = 0;
    let goldCount = 0;
    let silverCount = 0;
    let geoCount = 0;

    let platinumCountIndicator = document.getElementById("platinumCountIndicator");
    let goldCountIndicator = document.getElementById("goldCountIndicator");
    let silverCountIndicator = document.getElementById("silverCountIndicator");
    let geoCountIndicator = document.getElementById("geoCountIndicator");

    sponsorData.forEach(element => {
        let tier = element.SponsorshipLevel;

        if (tier === "Platinum") {
            platinumCount++;            
        } else if (tier === "Gold") {
            goldCount++;   
        } else if (tier === "Silver") {
            silverCount++;     
        } else if (tier === "Geo") {
            geoCount++;     
        }
    });

    platinumCountIndicator.innerText = `(${platinumCount})`;
    goldCountIndicator.innerText = `(${goldCount})`;
    silverCountIndicator.innerText = `(${silverCount})`;
    geoCountIndicator.innerText = `(${geoCount})`;
}
    
function initUI(lastModifiedFormatted, sponsorData) {
    fullScreenButton = document.getElementById("fullScreenButton");
    fullScreenButton.onclick = fullScreenButtonOnClick;

    legendButton = document.getElementById("legendButton");
    legendPanel = document.getElementById("legendPanel");
    legendButton.onclick = legendButtonOnClick;

    sponsorListButton = document.getElementById("sponsorListButton");
    sponsorCloseButton = document.getElementById("closeSponsorList");
    sponsorSidebar = document.getElementById("sponsorSidebar");
    sponsorListButton.onclick = sponsorSidebarButtonOnClick;
    sponsorCloseButton.onclick = sponsorSidebarButtonOnClick;

    helpButton = document.getElementById("helpButton");
    helpCloseButton = document.getElementById("helpCloseButton");
    helpDialog = document.getElementById("helpDialog");
    helpButton.onclick = helpButtonOnClick;
    helpCloseButton.onclick = helpButtonOnClick;
    let lastUpdatedSpan = document.getElementById("lastUpdatedSpan");
    lastUpdatedSpan.innerText = lastModifiedFormatted;

    const helpSeen = localStorage.getItem("gans_help_seen");
    
    if (!helpSeen) {
        helpButton.click();
        localStorage.setItem("gans_help_seen", "true");
    }

    updateLegendTierCounts(sponsorData);
}

export { initUI };