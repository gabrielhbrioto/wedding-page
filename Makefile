.PHONY: build-api build-web compose-up compose-down push-gcloud-run

build-api:
	docker build -t wedding-invite-api -f apps/api/Dockerfile .

build-web:
	docker build -t wedding-invite-web -f apps/web/Dockerfile apps/web

compose-up:
	docker-compose up --build

compose-down:
	docker-compose down --volumes

push-gcloud-run:
	@echo "Use gcloud to build/push and deploy to Cloud Run. See docs/deploy.md"
