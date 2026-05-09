pipeline {
    agent any

    tools {
        nodejs 'NodeJS'
    }

    environment {
        DOCKERHUB_USERNAME = 'yehsey'
        BACKEND_IMAGE = 'todo-backend'
        FRONTEND_IMAGE = 'todo-frontend'
        PATH = "/usr/local/bin:${env.PATH}"
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
                checkout scm
            }
        }

        stage('Install Backend') {
            steps {
                echo 'Installing backend dependencies...'
                dir('backend') {
                    sh 'npm install'
                }
            }
        }

        stage('Install Frontend') {
            steps {
                echo 'Installing frontend dependencies...'
                dir('frontend') {
                    sh 'npm install'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                echo 'Building React frontend...'
                dir('frontend') {
                    sh 'npm run build'
                }
            }
        }

        stage('Test Backend') {
            steps {
                echo 'Running backend tests...'
                dir('backend') {
                    sh 'npm test'
                }
            }
            post {
                always {
                    junit 'backend/junit.xml'
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    echo 'Building Docker images...'
                    def backendImage = docker.build(
                        "${DOCKERHUB_USERNAME}/${BACKEND_IMAGE}:latest",
                        "./backend"
                    )
                    def frontendImage = docker.build(
                        "${DOCKERHUB_USERNAME}/${FRONTEND_IMAGE}:latest",
                        "./frontend"
                    )
                    echo 'Pushing to Docker Hub...'
                    docker.withRegistry('https://registry.hub.docker.com', 'docker-hub-creds') {
                        backendImage.push('latest')
                        frontendImage.push('latest')
                    }
                }
            }
        }
    }

    post {
        success {
            echo '✅ Pipeline completed successfully!'
        }
        failure {
            echo '❌ Pipeline failed. Check the logs above.'
        }
    }
}
