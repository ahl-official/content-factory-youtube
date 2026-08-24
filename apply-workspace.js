const fs = require('fs');

const path = 'c:/Users/HP/Desktop/Saniya/content-factory-work/content-factory/frontend/src/youtube/YoutubeFactory.jsx';
const code = fs.readFileSync(path, 'utf8');

const startStr = 'function YoutubeWorkspace({ project, onBack }) {';
const nextStr = 'function YoutubeSettings() {';
const workspaceEndIndex = code.indexOf(nextStr);

const workspaceStartIndex = code.indexOf(startStr);

if (workspaceStartIndex !== -1 && workspaceEndIndex !== -1) {
    const before = code.substring(0, workspaceStartIndex);
    const after = code.substring(workspaceEndIndex);

    // Ensure we slice cleanly before the boundary comments for YoutubeSettings
    // Actually the comment matches before nextStr
    const commentIndex = code.lastIndexOf('// ─────────────────────────────────────────────────────────────────────────────', workspaceEndIndex - 1);

    let realEnd = workspaceEndIndex;
    if (commentIndex !== -1 && commentIndex > workspaceStartIndex) {
        realEnd = commentIndex;
    }

    const beforeClean = code.substring(0, workspaceStartIndex);
    const afterClean = code.substring(realEnd);

    const newWorkspace = fs.readFileSync('c:/Users/HP/Desktop/Saniya/content-factory-work/content-factory/youtube-workspace-fix.jsx', 'utf8');

    const newCode = beforeClean + newWorkspace + '\n\n' + afterClean;

    fs.writeFileSync(path, newCode, 'utf8');
    console.log("SUCCESS REPLACE");
} else {
    console.log("FAILED TO FIND BOUNDARIES");
}
