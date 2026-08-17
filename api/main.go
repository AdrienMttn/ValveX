package main

import (
	"archive/zip"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
)

var Endpoint = map[string]string{
	"LumaCore" : "https://api.github.com/repos/KoriaPolis/LumaCore/releases/latest",
	"Primary" : "https://pub-5b6d3b7c03fd4ac1afb5bd3017850e20.r2.dev",
	"Secondary" : "http://167.235.229.108",
}

func main() {
	http.HandleFunc("/download", DownloadZipFile)
	http.ListenAndServe(":54321",nil)
}


func DownloadZipFile(w http.ResponseWriter, r *http.Request) {
	endpoint, zipname, filename := r.URL.Query().Get("endpoint"), r.URL.Query().Get("zipname"), r.URL.Query().Get("filename")
	if endpoint == "" || zipname == "" || filename == "" {
		http.Error(w, "Missing endpoint or filename parameter", http.StatusBadRequest)
		return
	}
	endpointURL, exists := Endpoint[endpoint]
	if !exists {
		http.Error(w, "Invalid endpoint parameter", http.StatusBadRequest)
		return
	}
	var downloadURL string
	switch endpoint {
	case "LumaCore":
		downloadURLPtr := GetLatestRelease(endpointURL)
		if downloadURLPtr == nil {
			http.Error(w, "Failed to get latest release", http.StatusInternalServerError)
			return
		}
		downloadURL = *downloadURLPtr
	case "Secondary":
		downloadURL = endpointURL + "/" + strings.Replace(zipname, ".zip", "", 1)
	default:
		downloadURL = endpointURL + "/" + zipname
	}
	res, err := http.Get(downloadURL)
	if err != nil {
		http.Error(w, "Failed to download file", http.StatusInternalServerError)
		return
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		http.Error(w, "Failed to download file", http.StatusInternalServerError)
		return
	}

	data, err := io.ReadAll(res.Body)
	if err != nil {
		http.Error(w, "Failed to read file data", http.StatusInternalServerError)
		return
	}
	destinationPath := fmt.Sprintf("./temp/%s", zipname)

	os.MkdirAll("./temp", os.ModePerm)
	os.WriteFile(destinationPath, data, 0644)

	unzipOk := UnzipFile(destinationPath, filename)
	if !unzipOk {
		http.Error(w, "Failed to unzip file", http.StatusInternalServerError)
		return
	}
	GetFile(w, strings.Replace(destinationPath, zipname, filename, 1)) 
}

func UnzipFile(source string, fileToUnzip string) bool {
	const destinationPath = "./temp"
	r, err := zip.OpenReader(source)
	if err != nil {
		fmt.Println("Failed to open zip file:", err)
		return false
	}
	for _, f := range r.File {
		if strings.Contains(f.Name, fileToUnzip) {
			rc, err := f.Open()
			if err != nil {
				fmt.Println("Failed to open file in zip:", err)
				return false
			}
			
			destFile, err := os.Create(destinationPath + "/" + f.Name)
			if err != nil {
				fmt.Println("Failed to create destination file:", err)
				return false
			}
			io.Copy(destFile, rc)
			destFile.Close()
			rc.Close()
		}
	}
	r.Close()
	err = os.Remove(source)
	if err != nil {
		fmt.Println("Failed to delete zip file:", err)
		return false
	}
	return true
}



func GetFile(w http.ResponseWriter, filePath string) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		http.Error(w, "Failed to read file", http.StatusInternalServerError)
		return
	}
	w.Write(data)
	os.Remove(filePath)
}


type lumacoreResponse struct {
	URL string `json:"url"`
	AssetsURL string `json:"assets_url"`
	UploadURL string `json:"upload_url"`
	HTMLURL string `json:"html_url"`
	ID int `json:"id"`
	Assets []struct {
		BrowserDownloadURL string `json:"browser_download_url"`
	}
}

func GetLatestRelease(endpoint string) *string {
	rep, err := http.Get("https://api.github.com/repos/KoriaPolis/LumaCore/releases/latest")
	if err != nil {
		return nil
	}
	defer rep.Body.Close()
	body, err := io.ReadAll(rep.Body)
	var data lumacoreResponse
  if err := json.Unmarshal(body, &data); err != nil {
    return nil
  }
	return &data.Assets[0].BrowserDownloadURL
}