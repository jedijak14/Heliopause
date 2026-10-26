#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p Artifacts
python3 -m unittest discover -s Tests -p '*_test.py' -v
python3 Tools/asset_manifest.py --check
node --test Tests/voice.test.js
"${CXX:-g++}" -std=c++17 -Wall -Wextra -Werror -pedantic -fsanitize=address,undefined -fno-omit-frame-pointer -g -I Source/Heliopause/Public Tests/simulation_test.cpp -o Artifacts/simulation_test
Artifacts/simulation_test Content/Audio/ambient_hum.wav
python3 Tools/generate_sector.py --check
python3 Tools/generate_science.py --check
python3 Tools/generate_story.py --check
"${CXX:-g++}" -std=c++17 -Wall -Wextra -Werror -pedantic -fsanitize=address,undefined -fno-omit-frame-pointer -g -I Source/Heliopause/Public Tests/exploration_test.cpp -o Artifacts/exploration_test
Artifacts/exploration_test

node Tests/flight-parity.mjs

for suite in habitat planetary; do
 "${CXX:-g++}" -std=c++17 -Wall -Wextra -Werror -pedantic -fsanitize=address,undefined -fno-omit-frame-pointer -I Source/Heliopause/Public "Tests/${suite}_test.cpp" -o "Artifacts/${suite}_test"
 "Artifacts/${suite}_test"
done
