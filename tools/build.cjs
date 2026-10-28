// Baut das Spiel zusammen: site/index.html (PWA) und optional eine Artifact-Fassung.
// Aufruf: node tools/build.cjs [artifact-ausgabe.html]
const fs=require("fs"),path=require("path"),R=f=>fs.readFileSync(path.join(__dirname,"..",f),"utf8");
const levels=JSON.parse(R("src/levels.json"));
const fonts='<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600&family=Creepster&family=Rubik:wght@400;500&display=swap">';
const script="const LV="+JSON.stringify(levels)+";\n"+R("src/physics.js")+"\n"+R("src/game.js");
const core="<style>\n"+R("src/style.css")+"</style>\n"+R("src/body.html")+"<script>\n"+script;
const pwa=`<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">
<title>Galaxy Golf</title>
<meta name="description" content="Weltraum-Minigolf mit Schwerkraft, ${levels.length} Bahnen.">
<meta name="theme-color" content="#080b22">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Galaxy Golf">
<link rel="manifest" href="manifest.webmanifest" crossorigin="use-credentials">
<link rel="icon" href="icon-192.png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
${fonts}
<style>html{box-sizing:border-box;padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px);background:#080b22}[hidden]{display:none!important}</style>
</head>
<body>
${core}
if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
</script>
</body>
</html>
`;
fs.writeFileSync(path.join(__dirname,"../site/index.html"),pwa);
if(process.argv[2])fs.writeFileSync(process.argv[2],'<title>Galaxy Golf</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n'+fonts+"\n"+core+"\n</script>\n");
console.log("gebaut:",levels.length,"Bahnen,",Math.round(pwa.length/1024)+" KB");
