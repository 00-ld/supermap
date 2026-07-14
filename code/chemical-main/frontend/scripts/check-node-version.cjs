const version = process.versions.node;
const [majorText] = version.split(".");
const major = Number.parseInt(majorText, 10);

if (!Number.isInteger(major) || major < 20 || major >= 26) {
  console.error(
    `[ERROR] Unsupported Node.js ${version}. Use Node.js >=20 and <26 for this Vite 5 frontend.`,
  );
  process.exit(1);
}

console.log(`[OK] Node.js ${version}`);
