const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('index.html', 'utf-8');
const dom = new JSDOM(html);
const scripts = dom.window.document.querySelectorAll('script');
scripts.forEach((s, i) => {
    if (s.textContent) {
        fs.writeFileSync(`script${i}.js`, s.textContent);
        console.log(`Saved script${i}.js`);
    }
});
