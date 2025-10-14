// Read in CSV file.            
function splitCSVLine(line) {
    const result = [];
    let inQuotes = false;
    let value = '';

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const next = line[i + 1];

        if (char === '"' && inQuotes && next === '"') {
            value += '"'; 
            i++; 
        } else if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(value);
            value = '';
        } else {
            value += char;
        }
    }

    result.push(value);
    return result;
}

// Parse CSV, check for any errors.
function parseCSV(csvText) {
    const lines = csvText.split(/\r?\n/).map(line => line.trim()).filter(Boolean);

    if (lines.length < 2) {
        console.warn("CSV is empty or missing headers.");
        return [];
    }

    const headers = splitCSVLine(lines[0]).map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        
        const values = splitCSVLine(line);
        if (values.length !== headers.length) {
            console.warn(`Skipping malformed row at line ${i + 1}:`, line);
            continue;
        }

        const entry = {};
        headers.forEach((key, index) => {
            entry[key] = (values[index] || "").trim();
        });

        // Ensure lat/lon are valid.
        const lat = parseFloat(entry.Latitude);
        const lon = parseFloat(entry.Longitude);
        if (isNaN(lat) || isNaN(lon)) {
            console.warn(`Skipping row with invalid coordinates at line ${i + 1}:`, entry);
            continue;
        }

        if ((entry.IsActive || "").trim().toUpperCase() !== "Y") {
            continue;
        }

        entry.Latitude = lat;
        entry.Longitude = lon;

        data.push(entry);
    }

    return data;
}

export { parseCSV };