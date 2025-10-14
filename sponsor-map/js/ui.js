let isLegendEnabled = false;
let isSponsorSidebarEnabled = false;
let isHelpDialogEnabled = false;
let legendPanel, sponsorSidebar, helpDialog;
let legendButton, sponsorListButton, sponsorCloseButton, helpButton, helpCloseButton;

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
    
function initUI(lastModifiedFormatted) {
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
}

export { initUI };