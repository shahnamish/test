package main

import (
    "fmt"
    "log"
    "net/http"

    "github.com/example/monorepo/apps/backend/go/auditlog-service/internal/config"
)

func main() {
    cfg := config.Load()

    http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
        w.WriteHeader(http.StatusOK)
        fmt.Fprintf(w, "OK")
    })

    log.Printf("Audit log service starting on :%s", cfg.Port)
    if err := http.ListenAndServe(":"+cfg.Port, nil); err != nil {
        log.Fatal(err)
    }
}
