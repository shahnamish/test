.PHONY: build test run clean deps

build:
	go build -o bin/odds-ingest ./cmd/odds-ingest

test:
	go test -v -race ./...

test-cover:
	go test -v -race -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html

run:
	go run ./cmd/odds-ingest

clean:
	rm -rf bin/
	rm -f coverage.out coverage.html

deps:
	go mod download
	go mod tidy

lint:
	golangci-lint run ./...

docker-build:
	docker build -t odds-ingest:latest .

docker-run:
	docker run --rm --env-file .env odds-ingest:latest
