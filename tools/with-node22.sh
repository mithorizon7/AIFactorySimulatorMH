#!/usr/bin/env bash
set -euo pipefail

if [[ "$(uname -s)" != Linux ]]; then
  echo "This Replit runtime bootstrap requires Linux. Use .nvmrc locally." >&2
  exit 1
fi

project_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
version=22.23.4
case "$(uname -m)" in
  x86_64) arch=x64; checksum=1805bcd35e6815559bd2eb97db438d3fdb0eb3a5e6a977b7c1badca76337e9ce ;;
  aarch64|arm64) arch=arm64; checksum=6287aa46b6c375d816e63ae66d024fbbfd70404825aabdfdf898a970871d2f4b ;;
  *) echo "Unsupported Node runtime architecture." >&2; exit 1 ;;
esac
distribution="node-v${version}-linux-${arch}"
runtime_root="${project_root}/output/runtime"
runtime="${runtime_root}/${distribution}"
if [[ ! -x "${runtime}/bin/node" ]]; then
  mkdir -p "${runtime_root}"
  staging="$(mktemp -d "${runtime_root}/.install.XXXXXX")"
  trap 'rm -rf -- "${staging}"' EXIT
  curl --fail --silent --show-error --location --proto '=https' --tlsv1.2 \
    "https://nodejs.org/dist/v${version}/${distribution}.tar.xz" \
    --output "${staging}/node.tar.xz"
  printf '%s  %s\n' "${checksum}" "${staging}/node.tar.xz" | sha256sum --check --status
  tar -xJf "${staging}/node.tar.xz" -C "${staging}"
  mv -- "${staging}/${distribution}" "${runtime}"
  rm -rf -- "${staging}"
  trap - EXIT
fi
export PATH="${runtime}/bin:${PATH}"
[[ "$(node --version)" == "v${version}" ]] || {
  echo "Pinned Node runtime verification failed." >&2
  exit 1
}
if [[ $# -eq 0 ]]; then
  node --version
  npm --version
else
  exec "$@"
fi
