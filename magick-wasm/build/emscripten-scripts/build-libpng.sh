#!/bin/bash
# This file is auto-generated from src/templates
source emscripten-scripts/base.sh

mkdir -p $PREFIX/src
cd $PREFIX/src

if [ ! -d "libpng" ]; then
  git clone https://github.com/cancerberosgx/png.git libpng
else
  ( cd libpng ; make clean )
fi

cd libpng

libtoolize
autoreconf 
automake --add-missing

chmod a+x ./configure
emconfigure ./configure --prefix=$PREFIX --disable-shared --enable-static \
  PKG_CONFIG_PATH="$PKG_CONFIG_PATH"
# --disable-mips-msa --disable-arm-neon --disable-powerpc-vsx --disable-shared
testExitCode "libpng configure" $?

emcmake make install  
testExitCode "libpng make install" $?
