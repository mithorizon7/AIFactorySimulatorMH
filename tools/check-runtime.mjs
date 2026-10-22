const [major, minor, patch] = process.versions.node.split('.').map(Number);
if (major !== 22 || minor < 23 || (minor === 23 && patch < 4)) {
  console.error('Use patched Node 22.23.4 or a newer Node 22 release (see .nvmrc).');
  process.exit(1);
}
