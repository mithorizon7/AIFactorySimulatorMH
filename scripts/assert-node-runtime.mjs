const minimum = [22, 23, 4];
const expectedMajor = minimum[0];

function parseVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(version);
  if (!match) {
    throw new Error(
      `Could not parse Node.js version ${JSON.stringify(version)}.`,
    );
  }

  return match.slice(1).map((part) => Number.parseInt(part, 10));
}

function isAtLeast(version, floor) {
  for (let index = 0; index < floor.length; index += 1) {
    if (version[index] !== floor[index]) {
      return version[index] > floor[index];
    }
  }

  return true;
}

const running = parseVersion(process.versions.node);
if (running[0] !== expectedMajor || !isAtLeast(running, minimum)) {
  throw new Error(
    `AI Factory requires Node.js ${minimum.join(".")} through 22.x; running ${process.versions.node}.`,
  );
}

console.log(
  JSON.stringify({
    status: "ok",
    node: process.versions.node,
    minimum: minimum.join("."),
  }),
);
