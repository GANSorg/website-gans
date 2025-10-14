import { parseCSV } from "./parser.js";
import { initUI } from "./ui.js";
import { initializeMap } from "./map.js";

let sponsorCsvPath = "./gans_sponsors.csv";

async function initApp() {      

    try {
        const res = await fetch(sponsorCsvPath);
        if (!res.ok) throw new Error("Network response not ok");
        const lastModified = res.headers.get("Last-Modified");
        const date = new Date(lastModified);
        const lastModifiedFormatted = date.toLocaleDateString("en-CA", { year: 'numeric', month: 'long', day: 'numeric' });
        const csvText = await res.text();
        let allSponsorData = parseCSV(csvText); 

        initUI(lastModifiedFormatted);
        initializeMap(allSponsorData); 
    } catch (err) {
        alert("Failed to load sponsors. Please try again later.");
        console.error("Could not load or parse CSV:", err);
    }   
}

initApp();