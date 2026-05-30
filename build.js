const fs = require("fs");
const path = require("path");
const { marked } = require("marked");

const songsDir = "./songs";
const distDir = "./";

// create dist folder
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

// copy CSS
fs.copyFileSync("style.css", path.join(distDir, "style.css"));

// TAB RENDER FUNCTION
function renderTabs(line) {
  const tokens = line.replace("[", "").replace("]", "").split(" ");

  let A = "A|";
  let E = "E|";
  let C = "C|";
  let G = "G|";

  tokens.forEach(token => {

    if (token.includes(".")) {
      let gap = "----".repeat(token.length);
      A += gap; E += gap; C += gap; G += gap;
      return;
    }

    let string = token[0];
    let fret = token.slice(1);
    let block = "--" + fret + "--";

    if (string === "A") {
      A += block; E += "----"; C += "----"; G += "----";
    } else if (string === "E") {
      A += "----"; E += block; C += "----"; G += "----";
    } else if (string === "C") {
      A += "----"; E += "----"; C += block; G += "----";
    } else if (string === "G") {
      A += "----"; E += "----"; C += "----"; G += block;
    }
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

    // REMOVE first line (title) before rendering markdown
const lines = processedContent.split("\n");
lines.shift(); // remove first line (# Title)

const cleanedContent = lines.join("\n");

let rawHTML = marked(cleanedContent);

// Wrap lyrics + tab into sections
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
  <link rel="stylesheet" href="style.css">
</head>
<body>

<!-- NAVBAR -->
<div class="navbar">
  <h1><a href="index.html">Ukulele Tabs</a></h1>
</div>

<div class="container">

<div class="song-title">${title}</div>

${htmlContent}

<button onclick="history.back()">← Back</button>

</div>

</body>
</html>
`;

    fs.writeFileSync(path.join(distDir, fileName), page);

    songLinks += `
<a href="${fileName}" class="song-card" data-title="${title.toLowerCase()}">
  <div>${title}</div>
</a>`;
  }
});

// homepage
const indexPage = `
<html>
<head>
  <title>Ukulele Tabs</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>

<!-- NAVBAR -->
<div class="navbar">
  <h1><a href="index.html">Ukulele Tabs</a></h1>
</div>

<div class="container">

<!-- HERO -->
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

fs.writeFileSync(path.join(distDir, "index.html"), indexPage);

console.log("Build complete!");