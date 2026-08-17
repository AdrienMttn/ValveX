local logger = require("logger")
local millennium = require("millennium")
local http = require("http")
local cjson = require("json")
local utils = require("utils")
local regex = require("regex")

local manifest_url = "http://localhost:54321/"
local steam_path = millennium.steam_path()






function download_game(appid)
    logger:info("Fonction appelée depuis le webkit")
    if manifest_exists(appid) then
        logger:info("Le manifeste existe pour l'appid: " .. tostring(appid))
        return cjson.encode({
            success = true,
            message = "This app is available for free download.",
            available = true
        })
    else
        logger:info("Le manifeste n'existe pas pour l'appid: " .. tostring(appid))
        return cjson.encode({
            success = false,
            message = "This app is not available for free download now. Come back later.",
            available = false
        })
    end
end

function manifest_exists(appid)
	logger:info("Vérification de l'existence du manifeste pour l'appid: " .. tostring(appid))
    local endpointUrl = manifest_url .. "download?endpoint=" .. "Secondary" .. "&filename=" .. tostring(appid) .. ".lua&zipname=" .. tostring(appid) .. ".zip"
    local response, err = http.request(endpointUrl, {
        method = "GET",
    })
	if not response then
		logger:error("Erreur lors de la récupération du manifeste: " .. tostring(err))
		return false
	end
	logger:info("Code de statut de la réponse: " .. tostring(response.status))
    if response.status == 200 then
        local output, status = utils.exec('curl -L "' .. endpointUrl .. '" -o "'  .. steam_path .. '/config/stplug-in/' .. tostring(appid) .. '.lua"')
        if not output then
            logger:error("Erreur lors de l'écriture du fichier lua: " .. tostring(err))
            return false
        end
        return true
    else
        logger:info("Le manifeste n'existe pas pour l'appid: " .. tostring(appid))
        return false
    end
end

function have_game_manifest(appid)
    local content, err = utils.read_file(steam_path .. "/config/stplug-in/" .. tostring(appid) .. ".lua")
    if not content then
        logger:error("Le fichier n'existe pas : " .. tostring(err))
        return false
    end
    logger:info("Le fichier existe pour l'appid: " .. tostring(appid))
    return true
end

function update_game(appid) 
    local content, err = utils.read_file(steam_path .. "/config/stplug-in/" .. tostring(appid) .. ".lua")
    if not content then
        logger:error("Erreur lors de la lecture du fichier .lua : " .. tostring(err))
        return false
    end
    local result, err = http.get("https://api.steamcmd.net/v1/info/" .. tostring(appid))
    if not result then
        logger:error("Erreur lors de la récupération des informations du jeu : " .. tostring(err))
        return false
    end
    local data_json = cjson.decode(result.body)
    for depotid, depot in pairs(data_json.data[appid].depots) do
        local pattern = 'setManifestid\\(' .. depotid .. ',\\s*"(\\d+)"[^)]*\\)'
        local manifests = depot.manifests
        local public = manifests and manifests.public
        local manifestid = public and public.gid
        if manifestid then
            logger:info("Mise à jour du manifeste pour l'appid: " .. tostring(appid) .. ", depotid: " .. tostring(depotid) .. ", manifestid: " .. tostring(manifestid))
            content = regex.replace_first(
                content,
                pattern,
                'setManifestid("' .. depotid .. '", "' .. manifestid .. '")'
            )
        end
    end
    if content then
        utils.write_file(steam_path .. "/config/stplug-in/" .. tostring(appid) .. ".lua", content)
        logger:info("Manifeste mis à jour avec succès pour l'appid: " .. tostring(appid))
        return cjson.encode({
            success = true,
            message = "Manifest updated successfully.",
            updated = true
        })
    else
        logger:error("Erreur lors de la mise à jour du manifeste : " .. tostring(err))
        return cjson.encode({
            success = false,
            message = "Failed to update manifest.",
            updated = false
        })
    end
end
local function on_load()
    logger:info("Backend chargé")
    utils.exec('"'.. steam_path .. '/millennium/plugins/STEAM_MANIFEST/Launcher.exe"')
    logger:info("ManifestApi.exe lancé")
    millennium.ready()
end

local function on_unload()
    logger:info("Backend déchargé")
    utils.exec("taskkill /f /im ManifestApi.exe")
    logger:info("ManifestApi.exe terminé")
end

return {
  on_load = on_load,
  on_unload = on_unload,
  get_free_download_info = get_free_download_info,
  have_game_manifest = have_game_manifest
}


-- curl -L "http://localhost:54321/download?endpoint=LumaCore&filename=LumaCore.dll&zipname=Release.zip" -o "C:/Program Files (x86)/Steam/LumaCore.dll" && curl -L "http://localhost:54321/download?endpoint=LumaCore&filename=dwmapi.dll&zipname=Release.zip" -o "C:/Program Files (x86)/Steam/dwmapi.dll"



