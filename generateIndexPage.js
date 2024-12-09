const fs = require('fs');
const path = require('path');

// Lade die JSON-Datei, die die Daten enthält
const dataPath = path.join(__dirname, 'files.json');
let data;

try {
  // Die JSON-Datei synchron lesen und in ein Objekt umwandeln
  const rawData = fs.readFileSync(dataPath, 'utf8');
  data = JSON.parse(rawData);
} catch (error) {
  console.error('Fehler beim Laden der JSON-Datei:', error);
  process.exit(1);
}

// HTML Template für die Seite
const generateHTML = (data) => {
  let htmlContent = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Unternehmensangebote</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        h1 { color: #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 10px; border: 1px solid #ddd; }
        th { background-color: #f4f4f4; }
        td a { color: #007bff; text-decoration: none; }
        td a:hover { text-decoration: underline; }
      </style>
       <link href="output/pagefind/pagefind-ui.css" rel="stylesheet">
      <script src="output/pagefind/pagefind-ui.js"></script>
      <script>
        window.addEventListener('DOMContentLoaded', (event) => {
            new PagefindUI({ element: "#search", showSubResults: true });
        });
    </script>
    </head>
    <body>
      <h1>Liste der Unternehmensangebote</h1>
      <h3>Suche</h3>
      <div id="search"></div>
      <table>
        <thead>
          <tr>
            <th>Titel</th>
            <th>Datum</th>
            <th>Ort</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
  `;

  // Durchlaufe alle Einträge und füge sie der Tabelle hinzu
  data.forEach(item => {
    htmlContent += `
      <tr>
        <td>${item.title}</td>
        <td>${item.date}</td>
        <td>${item.location}</td>
        <td><a href="${item.fileName}" target="_blank">Mehr erfahren</a></td>
      </tr>
    `;
  });

  htmlContent += `
        </tbody>
      </table>
    </body>
    </html>
  `;

  return htmlContent;
};

// Die HTML-Seite erstellen und speichern
const html = generateHTML(data);

fs.writeFileSync(path.join(__dirname, 'index.html'), html);

console.log('Die index.html wurde erfolgreich erstellt!');

// Erstelle den Pagefind-Index
