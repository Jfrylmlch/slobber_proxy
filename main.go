package main

import (
	"embed"
	"encoding/json"
	"io"
	"io/fs"
	"log"
	"net/http"
	"regexp"
	"strings"
	"time"
)

//go:embed webpage
var webpage embed.FS

var redirectedQuery *Query

type DictEntry struct {
	DictLabel string `json:"dictLabel"`
	Label     string `json:"label"`
	Url       string `json:"url"`
}

func ParseDictJson(result []byte) (*[]DictEntry, error) {
	var data []DictEntry
	e := json.Unmarshal([]byte(result), &data)
	if e != nil {
		return nil, e
	}
	return &data, e
}

const keyServerAddr = "word"

func GetQueryResult(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	query := strings.TrimPrefix(r.URL.Path, "/find/")
	result, err := MakeQuery(query)
	if err != nil {
		log.Fatalln(err)
	}
	w.Header().Set("Content-Type", "application/json")
	jsonObj, _ := ParseDictJson(result)
	json.NewEncoder(w).Encode(jsonObj)
}

func MakeQuery(query string) ([]byte, error) {
	whiteSpacesRe := regexp.MustCompile(`\s+`)
	query = whiteSpacesRe.ReplaceAllString(strings.TrimSpace(query), "+")
	if len(query) <= 0 {
		return []byte{}, nil
	}
	resp, err := http.Get("http://127.0.0.1:8013/find/?key=" + query)
	if err != nil {
		log.Fatalf("slobber is not running properly. make sure slobber is listening at 127.0.0.1:8013: %s\n", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)

	if err != nil {
		return []byte{}, err
	}
	return body, err
}

func ServeEmbeddedFiles(embeddedFiles embed.FS, dir string) http.Handler {
	fsys := fs.FS(embeddedFiles)
	html, err := fs.Sub(fsys, dir)
	if err != nil {
		log.Fatalln(err)
	}
	return http.FileServer(http.FS(html))
}

type Query struct {
	Query string
}

func RedirectQuery(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Content-Type", "application/json")
	decoder := json.NewDecoder(r.Body)
	var t Query
	decoder.Decode(&t)
	if len(strings.TrimSpace(t.Query)) > 0 {
		redirectedQuery = &Query{
			Query: strings.TrimSpace(t.Query),
		}
	}
	// fmt.Println(redirectedQuery.Query)
}

func ServeRedirectedQuery(w http.ResponseWriter, r *http.Request) {
	// use `fetch("http://127.0.0.1:3333/auto-find/", { method: "POST", body: JSON.stringify({ query: "bobs" }), headers: { "Content-type": "application/json; charset=UTF-8" } });`

	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")

	// long polling to avoid excessive requests
	for i := 0; i < 100; i++ {
		if redirectedQuery != nil {
			if _, err := io.WriteString(w, redirectedQuery.Query); err != nil {
				log.Println("failed to redirect query, try fetching again ...")
			}
			redirectedQuery = nil
			break
		}
		time.Sleep(100 * time.Millisecond)

	}
}

func main() {
	mux := http.NewServeMux()

	mux.HandleFunc("/find/", GetQueryResult)
	mux.HandleFunc("/auto-find/", RedirectQuery)
	mux.HandleFunc("/redirected-query/", ServeRedirectedQuery)
	mux.Handle("/", ServeEmbeddedFiles(webpage, "webpage"))

	e := http.ListenAndServe(":3333", mux)
	if e != nil {
		panic(e)
	}
}
