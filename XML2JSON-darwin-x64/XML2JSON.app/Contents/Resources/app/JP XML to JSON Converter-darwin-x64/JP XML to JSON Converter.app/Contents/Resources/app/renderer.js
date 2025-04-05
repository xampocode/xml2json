// Setup remote modules at the top
const { dialog, shell } = require('@electron/remote');
const fs = require('fs');
const path = require('path');

const fileInput = document.getElementById('fileInput');
const output = document.getElementById('output');
const exportBtn = document.getElementById('exportBtn');

console.log("✅ Renderer loaded!");

fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (!file) return;

  if (!file.name.endsWith('.xml')) {
    alert('❌ Only .xml files are supported.\nPlease select a valid XML file.');
    fileInput.value = ''; // clear input
    return;
  }

  const reader = new FileReader();
  reader.onload = function (event) {
    const parser = new DOMParser();
    const xml = parser.parseFromString(event.target.result, "application/xml");
    const json = xmlToJson(xml.documentElement);
    const pretty = JSON.stringify(json, null, 2);
    output.textContent = pretty;
    exportBtn.onclick = () => exportJSON(pretty);
  };
  reader.readAsText(file);
});

function xmlToJson(xml) {
  const obj = {};
  if (xml.nodeType === 1 && xml.attributes.length > 0) {
    obj["@attributes"] = {};
    for (let attr of xml.attributes) {
      obj["@attributes"][attr.name] = attr.value;
    }
  }
  for (let node of xml.childNodes) {
    if (node.nodeType === 3 && node.nodeValue.trim() !== "") {
      return node.nodeValue.trim();
    }
    if (node.nodeType === 1) {
      const name = node.nodeName;
      const value = xmlToJson(node);
      if (obj[name]) {
        if (!Array.isArray(obj[name])) obj[name] = [obj[name]];
        obj[name].push(value);
      } else {
        obj[name] = value;
      }
    }
  }
  return obj;
}

function exportJSON(data) {
  const blob = new Blob([data], { type: "application/json" });
  const fileReader = new FileReader();

  fileReader.onload = () => {
    const buffer = Buffer.from(fileReader.result);

    dialog.showSaveDialog({
      title: 'Save JSON File',
      defaultPath: 'converted.json',
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    }).then(result => {
      if (!result.canceled && result.filePath) {
        fs.writeFile(result.filePath, buffer, err => {
          if (err) {
            alert('⚠️ Failed to save file: ' + err.message);
          } else {
            dialog.showMessageBox({
              type: 'info',
              title: 'Export Successful',
              message: '✅ JSON file saved successfully!',
              detail: result.filePath,
              buttons: ['Open Folder', 'OK'],
              defaultId: 0,
              cancelId: 1
            }).then(response => {
              if (response.response === 0) {
                shell.showItemInFolder(result.filePath);
              }
            });
          }
        });
      }
    });
  };

  fileReader.readAsArrayBuffer(blob);
}