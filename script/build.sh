#!/bin/bash
set -e

# --- Variables ---
LUMACORE_URL=$(curl -s https://api.github.com/repos/KoriaPolis/LumaCore/releases/latest | grep browser_download_url  | grep "Release.zip" | cut -d '"' -f 4)
MILLENNIUM_URL=$(curl -s https://api.github.com/repos/SteamClientHomebrew/Millennium/releases/latest \
  | grep browser_download_url \
  | grep "windows-x86_64.zip" \
  | cut -d '"' -f 4)


echo "LumaCore URL: $LUMACORE_URL"
echo "Millennium URL: $MILLENNIUM_URL"

# --- Dossier de sortie ---
mkdir -p build/millennium/bin
mkdir -p build/millennium/lib
mkdir -p build/millennium/plugins
mkdir -p build/millennium/plugins/STEAM_MANIFEST

# --- Téléchargement LumaCore ---
echo "Téléchargement LumaCore..."
curl -L "$LUMACORE_URL" -o LumaCore.zip
unzip LumaCore.zip -d LumaCoreExtract

cp LumaCoreExtract/LumaCore.dll build/
cp LumaCoreExtract/dwmapi.dll build/

# --- Téléchargement Millennium ---
echo "Téléchargement Millennium..."
curl -L "$MILLENNIUM_URL" -o Millennium.zip
unzip Millennium.zip -d MillenniumExtract

cp MillenniumExtract/wsock32.dll build/

cp MillenniumExtract/millennium/bin/* build/millennium/bin/
cp MillenniumExtract/millennium/lib/* build/millennium/lib/

rm -rf LumaCoreExtract MillenniumExtract LumaCore.zip Millennium.zip

# --- Plugins ---
cd api
go build -o ../build/millennium/plugins/STEAM_MANIFEST/ManifestApi.exe
cd ..
echo "Copie des plugins (sans node_modules)..."
find plugins -maxdepth 1 -mindepth 1 ! -name "node_modules" -exec cp -r {} build/millennium/plugins/STEAM_MANIFEST \;


# --- Archive finale ---
cd build
if command -v zip >/dev/null 2>&1; then
    echo "zip trouvé → utilisation de zip"
    zip -r ../ValveX.zip .
else
    echo "zip non trouvé → utilisation de PowerShell"
    powershell.exe -Command "Compress-Archive -Path * -DestinationPath ../ValveX.zip"
fi
cd ..

echo "✔ Release généré : ValveX.zip"

rm -rf build