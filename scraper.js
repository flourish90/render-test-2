const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

// Basis-URL für die Suche
const baseUrl = "https://www.nexxt-change.org/SiteGlobals/Forms/Verkaufsangebot_Suche/Verkaufsangebotssuche_Formular.html?ad_pricerange.GROUP=1&ad_onlyWithImages.GROUP=1&input_=bffc1563-55f4-417b-86de-473f4126d2f3&ad_nuts.GROUP=1&ad_onlyWithExpose.GROUP=1&ad_fuzzysearch=1&ad_nace.GROUP=1&resourceId=bf70b6e6-45b3-4166-a484-5429d45827fa&pageLocale=de&gtp=%2676d53c18-299c-4f55-8c88-f79ed3ce6d02_list%3D";

// Basis-URL für die Detailseiten
const detailUrlTemplate = "https://www.nexxt-change.org/DE/Verkaufsangebot/Detailseite/detailseite_jsp.html?adId=%s";

// Definiere die Anzahl der Seiten
const numberOfPages = 2; // Passe diesen Wert je nach Anzahl der Seiten an

// Eine Liste zum Speichern aller gesammelten IDs
let allIds = [];

// Funktion zur sicheren Extraktion von Textinhalt
function safeTextContent($, selector, defaultValue = 'Nicht angegeben') {
  const text = $(selector).text().trim();
  return text.length > 0 ? text : defaultValue;
}

// Hilfsfunktion, um Dateinamen zu erstellen
function generateFileName(datum, title) {
  const formattedDate = new Date(datum).toISOString().split('T')[0]; // Format: YYYY-MM-DD
  const cleanTitle = title.replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '-').toLowerCase();
  return `${formattedDate}-${cleanTitle}.html`;
}

// Lade bereits erstellte Dateien aus der JSON-Datei
function loadProcessedFiles() {
  if (fs.existsSync('files.json')) {
    const rawData = fs.readFileSync('files.json');
    return JSON.parse(rawData);
  } else {
    return []; // Wenn die Datei nicht existiert, eine leere Liste zurückgeben
  }
}

// Speichere die Liste der erzeugten Dateien in der JSON-Datei
function saveProcessedFiles(files) {
  fs.writeFileSync('files.json', JSON.stringify(files, null, 2));
}

// Scrape die Angebotsseiten
async function scrapeListingPage(page) {
  const url = `${baseUrl}${page}`;
  console.log(`Scraping Seite: ${url}`);

  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    // Links mit den AdIds extrahieren
    $('a').each((index, element) => {
      const href = $(element).attr('href');
      const match = /adId=(\d{6})/.exec(href);
      if (match && !allIds.includes(match[1])) {
        allIds.push(match[1]);
      }
    });

  } catch (error) {
    console.error(`Fehler beim Abrufen der Seite ${page}:`, error);
  }
}

// Scrape die Detailseiten
async function scrapeDetailPage(adId, processedFiles) {
  const detailUrl = detailUrlTemplate.replace('%s', adId);
  console.log(`Scraping Detailseite für adId: ${adId}`);

  try {
    const response = await axios.get(detailUrl);
    const $ = cheerio.load(response.data);

    const title = safeTextContent($, 'div.tab-content.inserat-details-box h1');
    var tempdatum = safeTextContent($, 'dt:contains("Datum") + dd');
    tempdatum = tempdatum.match(/^(\d{2}\.\d{2}\.\d{4})/); // Regulärer Ausdruck für TT.MM.YYYY
    const datum = tempdatum[1];
    const location = safeTextContent($, 'dt:contains("Standort") + dd ul li');
    const branche = safeTextContent($, 'dt:contains("Branche") + dd ul li');
    const employees = safeTextContent($, 'dt:contains("Anzahl Mitarbeiter") + dd');
    const umsatz = safeTextContent($, 'dt:contains("Letzter Jahresumsatz") + dd');
    const preisvorstellung = safeTextContent($, 'dt:contains("Preisvorstellung") + dd');
    const chiffre = safeTextContent($, 'dt:contains("Chiffre") + dd');
    const exposeUrl = safeTextContent($, 'p.download a', 'Kein Download');
    const regionalpartner = safeTextContent($, 'section.inserate-info-box p');
    const ansprechpartner = safeTextContent($, 'h4:contains("Ansprechpartner") + p');

    const filePath = `output/${generateFileName(datum, title)}`;

    // Prüfen, ob die Datei bereits verarbeitet wurde
    if (processedFiles.some(file => file.fileName === filePath)) {
      console.log(`Datei für ${title} bereits verarbeitet. Überspringen.`);
      return; // Wenn bereits verarbeitet, überspringen
    }

    // Erstelle HTML-Datei
    let html = `<html><head><title>${title}</title></head><body>`;
    html += `
      <div style="margin: 20px; padding: 20px; border: 1px solid #ddd;">
        <h1 style="text-align: center;">${title}</h1>
        <p style="text-align: center; font-style: italic;">${datum}</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="width: 30%; padding: 8px; font-weight: bold;">Ort:</td><td style="padding: 8px;">${location}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Branche:</td><td style="padding: 8px;">${branche}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Mitarbeiter:</td><td style="padding: 8px;">${employees}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Umsatz:</td><td style="padding: 8px;">${umsatz}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Preisvorstellung:</td><td style="padding: 8px;">${preisvorstellung}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Chiffre:</td><td style="padding: 8px;">${chiffre}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Expose URL:</td><td style="padding: 8px;"><a href="${exposeUrl}" target="_blank">${exposeUrl}</a></td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Regionalpartner:</td><td style="padding: 8px;">${regionalpartner}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Ansprechpartner:</td><td style="padding: 8px;">${ansprechpartner}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Detail URL:</td><td style="padding: 8px;"><a href="${detailUrl}" target="_blank">${detailUrl}</a></td></tr>
        </table>
      </div>
    `;
    html += `</body></html>`;

    // Stelle sicher, dass das Verzeichnis existiert
    if (!fs.existsSync('output')) {
      fs.mkdirSync('output', { recursive: true });
    }

    // Schreibe die HTML-Datei
    fs.writeFileSync(filePath, html);
    console.log(`Datei gespeichert: ${filePath}`);

    // Füge die neue Datei zur Liste hinzu
    processedFiles.push({
      fileName: filePath,
      date: datum,
      title: title,
      location: location
    });

  } catch (error) {
    console.error(`Fehler beim Abrufen der Detailseite für adId ${adId}:`, error);
  }
}


  // Hauptfunktion
  async function main() {
    // Lade bereits verarbeitete Dateien
    let processedFiles = loadProcessedFiles();

    // Scrape die Angebotsseiten
    for (let page = 1; page <= numberOfPages; page++) {
      await scrapeListingPage(page);
      // Kurze Pause, um nicht geblockt zu werden
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Scrape die Detailseiten für alle gesammelten IDs
    for (const adId of allIds) {
      await scrapeDetailPage(adId, processedFiles);
      // Kurze Pause, um nicht geblockt zu werden
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Speichere die aktualisierte Liste der verarbeiteten Dateien
    saveProcessedFiles(processedFiles);

    console.log('Scraping abgeschlossen.');
  }

  // Skript ausführen
  main();

