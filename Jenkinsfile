// Jenkinsfile — local-only CI for personal-expense-tracker.
//
// This project has no remote/cloud environment (local-only Docker hosting,
// ADR-PET-001 in the org repo) — there is nothing for a pipeline to deploy
// to. "Deploy" is the Human Owner running `docker compose up` on their own
// machine. This pipeline validates, builds, tests, and runs a local
// smoke-check on the Jenkins agent itself, then tears that check down.
//
// No dependency/container vulnerability scan stage (Snyk/SonarQube) yet —
// neither tool is configured in this environment. Add a Scan stage once
// one is set up; until then this is NOT a substitute for that check.
//
// Runs on the Jenkins built-in node: confirmed the jenkins system user is
// in the docker group on this host, so `docker`/`docker compose` work
// directly without a separate labeled agent.
//
// UNKNOWN / not yet confirmed on this Jenkins instance:
//   - how `.env` (DB credentials) reaches the agent — see "Prepare env" below

pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  stages {
    stage('Prepare env') {
      steps {
        // .env is gitignored and never committed (DB credentials). This repo
        // ships .env.example as a placeholder template. A real Jenkins setup
        // should instead inject real values via Credentials Binding
        // (withCredentials) — not configured yet, so this falls back to the
        // placeholder template, which is fine for Test/local-verify but is
        // NOT a real secret and must not be relied on for anything else.
        sh 'cp -n .env.example .env || true'
      }
    }

    stage('Validate') {
      steps {
        sh 'docker compose config'
      }
    }

    stage('Build') {
      steps {
        sh 'docker compose build'
      }
    }

    stage('Test') {
      steps {
        sh 'docker run --rm personal-expense-tracker-app:dev python -m pytest -v'
      }
    }

    stage('Local verification (not a deployment)') {
      steps {
        sh 'docker compose up -d db'
        sh '''
          timeout 60 bash -c 'until docker compose ps db --format "{{.Health}}" | grep -q healthy; do sleep 2; done'
        '''
        sh 'docker compose run --rm -e FLASK_APP=wsgi.py -v "$(pwd)/backend/migrations:/app/migrations" app flask db upgrade'
        sh 'docker compose up -d'
        sh '''
          sleep 5
          curl -sf http://127.0.0.1:8081/health || (docker compose logs && exit 1)
        '''
      }
      post {
        always {
          sh 'docker compose down'
        }
      }
    }
  }

  post {
    failure {
      echo 'Pipeline failed before any real deployment occurred (this project has no remote environment to deploy to). See .ai-team/project/DEVOPS/INFRASTRUCTURE-ENG-PET-013.md for the local rollback/recovery runbook the Human Owner follows on their own machine.'
    }
  }
}
