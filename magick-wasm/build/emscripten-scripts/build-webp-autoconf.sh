# #!/bin/bash
# This file is auto-generated from src/templates
source emscripten-scripts/base.sh

mkdir -p $PREFIX/src
cd $PREFIX/src
rm -rf webp
git clone https://github.com/ImageMagick/webp.git
cd webp

# autoconf
chmod a+x configure
emconfigure ./configure --prefix=$PREFIX CFLAGS="$FLAGS" \
  --disable-shared  --disable-threading --enable-static --disable-gl \
  --disable-wic --disable-gif --disable-sdl --disable-jpeg --disable-png  --disable-tiff \
  --disable-libwebpdemux --enable-libwebpdecoder --disable-libwebpextras \
   PKG_CONFIG_PATH="$PKG_CONFIG_PATH"
testExitCode "webp configure" $? 

emcmake make install CFLAGS="$CFLAGS" 
testExitCode "libtiff make install" $?