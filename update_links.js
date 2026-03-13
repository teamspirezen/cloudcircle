const fs = require('fs');

const files = ['index.html', 'admin.html', 'apply.html'];

const replacements = [
    { from: /href="index\.html"/g, to: 'href="/"' },
    { from: /href="apply\.html"/g, to: 'href="/apply"' },
    { from: /href="admin\.html"/g, to: 'href="/admin"' }
];

files.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        replacements.forEach(r => {
            content = content.replace(r.from, r.to);
        });
        fs.writeFileSync(file, content);
        console.log(`Updated links in ${file}`);
    }
});
