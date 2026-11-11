"use strict";
const fs = require("node:fs");

const checks = [
  ["public-features.js", "const statusLabels"],
  ["admin-enhancements.js", "let attached"]
];

for (const [file, endMarker] of checks) {
  const source = fs.readFileSync(file, "utf8");
  const start = source.indexOf("const groups=[");
  const end = source.indexOf(endMarker, start);
  if (start < 0 || end < 0) throw new Error(file + ": feature groups were not found");
  const count = (source.slice(start, end).match(/\["[a-z0-9_]+","/g) || []).length;
  if (count !== 50) throw new Error(file + ": found " + count + " tools; expected exactly 50");
  console.log(file + ": exactly " + count + " tools OK");
}
