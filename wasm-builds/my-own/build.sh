docker build -t magica-im emscripten-scripts/ && docker run --rm --workdir /code -v "$PWD":/code magica-im bash ./emscripten-scripts/emscripten-build1.sh