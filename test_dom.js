const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('index.html', 'utf-8');
const dom = new JSDOM(html, { runScripts: "dangerously" });

setTimeout(() => {
    try {
        console.log("Is openMap defined?", typeof dom.window.openMap);
        dom.window.openMap();
        console.log("openMap executed successfully!");
    } catch(e) {
        console.error("Error executing openMap:", e);
    }
}, 1000);
