const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('index.html', 'utf-8');
const dom = new JSDOM(html, { runScripts: "dangerously" });

setTimeout(() => {
    try {
        if(dom.window.loadedCampaigns) {
            console.log("loadedCampaigns:", dom.window.loadedCampaigns);
        } else {
            console.log("No loadedCampaigns array!");
        }
    } catch(e) {
        console.error("Error:", e);
    }
}, 1000);
