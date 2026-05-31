const fs = require("fs");
const path = require("path");
const { marked } = require("marked");

const songsDir = "./songs-md";     // markdown files
const songsOutDir = "./songs";     // generated song pages
const rootDir = "./";              // homepage + css

// create songs folder if not exists
if (!fs.existsSync(songsOutDir)) {
  fs.mkdirSync(songsOutDir);
}

// copy CSS to root (NOT songs folder)
fs.copyFileSync("style.css", path.join(rootDir, "style.css"));

// TAB RENDER FUNCTION
function renderTabs(line) {
  let input = line.replace("[", "").replace("]", "");

  let tokens = input.match(/[A-Z]\d+|\.+/g);

  let A = "A|";
  let E = "E|";
  let C = "C|";
  let G = "G|";

  tokens.forEach(token => {

    // DOT GAP
    if (token.includes(".")) {
      let gap = "-".repeat(token.length);

      A += gap; E += gap; C += gap; G += gap;
      return;
    }

    let string = token[0];
    let fret = token.slice(1);

    let block = "-" + fret;   // compact note
    let empty = "--";         // other strings

    if (string === "A") {
      A += block; E += empty; C += empty; G += empty;
    } else if (string === "E") {
      A += empty; E += block; C += empty; G += empty;
    } else if (string === "C") {
      A += empty; E += empty; C += block; G += empty;
    } else if (string === "G") {
      A += empty; E += empty; C += empty; G += block;
    }

    // default minimal gap
    let gap = "-";
    A += gap; E += gap; C += gap; G += gap;

  });

  A += "|"; E += "|"; C += "|"; G += "|";

  return `<pre>${A}\n${E}\n${C}\n${G}</pre>`;
}
// read files
const files = fs.readdirSync(songsDir);
let songLinks = "";

files.forEach(file => {
  if (file.endsWith(".md")) {

    const content = fs.readFileSync(path.join(songsDir, file), "utf-8");

    // process tabs
    let processedContent = content.replace(/\[(.*?)\]/g, (match) => {
      return renderTabs(match);
    });

    // remove title line
    const lines = processedContent.split("\n");
    lines.shift();
    const cleanedContent = lines.join("\n");

    let rawHTML = marked(cleanedContent);

    // wrap lyrics + tab
    let htmlContent = rawHTML.replace(
      /<p>(.*?)<\/p>\s*<pre>(.*?)<\/pre>/gs,
      (match, lyrics, tab) => {
        return `
        <div class="section">
          <div class="lyrics">${lyrics}</div>
          <div class="tab-block"><pre>${tab}</pre></div>
        </div>
        `;
      }
    );

    const title = content.split("\n")[0].replace("# ", "");
    const fileName = file.replace(".md", ".html");

    const page = `
<html>
<head>
  <title>${title}</title>
  <link rel="stylesheet" href="../style.css">
</head>
<body>

<div class="navbar">
  <h1><a href="../index.html">Ukulele Tabs</a></h1>
</div>

<div class="container">

<div class="song-title">${title}</div>

${htmlContent}

<button onclick="history.back()">← Back</button>

</div>

</body>
</html>
`;

    // save song inside /songs
    fs.writeFileSync(path.join(songsOutDir, fileName), page);

    // link from homepage
    songLinks += `
<a href="songs/${fileName}" class="song-card" data-title="${title.toLowerCase()}">
  <div>${title}</div>
</a>`;
  }
});

// homepage (SAVE IN ROOT)
const indexPage = `
<html>
<head>
  <title>Ukulele Tabs</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>

<div class="navbar">
  <h1><a href="index.html">Ukulele Tabs</a></h1>
</div>

<div class="container">

<div class="hero">
  <h2>Ukulele Tabs</h2>
  <p>Play songs easily with clean visual tabs</p>
</div>

<div class="search-wrapper">
  <input id="searchBox" placeholder="Search songs...">
</div>

<div class="divider"></div>

<div class="song-list">
${songLinks}
</div>

</div>

<script>
const searchBox = document.getElementById("searchBox");

searchBox.addEventListener("input", function() {
  const query = this.value.toLowerCase();
  const songs = document.querySelectorAll(".song-card");

  songs.forEach(song => {
    const title = song.getAttribute("data-title");

    if (title.includes(query)) {
      song.style.display = "";
    } else {
      song.style.display = "none";
    }
  });
});
</script>

</body>
</html>
`;

// save homepage in root
fs.writeFileSync(path.join(rootDir, "index.html"), indexPage);

console.log("Build complete!");