pipeline {
    agent any

    tools {
        nodejs 'NodeJS'
    }

    environment {
        DOCKERHUB_USERNAME = 'yehsey'
        BACKEND_IMAGE = 'todo-backend'
        FRONTEND_IMAGE = 'todo-frontend'
        DOCKER_HOST = 'unix:///Users/mac/.docker/run/docker.sock'
        DOCKER_CONFIG = '/Users/mac/.docker'
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
                dir('backend') {
                    sh 'npm install'
                }
            }
        }

        stage('Install Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm install'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm run build'
                }
            }
        }

        stage('Test Backend') {
            steps {
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
                    sh 'DOCKER_CONFIG=/Users/mac/.docker /usr/local/bin/docker build -t yehsey/todo-backend:latest ./backend'
                    sh 'DOCKER_CONFIG=/Users/mac/.docker /usr/local/bin/docker build -t yehsey/todo-frontend:latest ./frontend'
                    echo 'Pushing to Docker Hub...'
                    withCredentials([usernamePassword(credentialsId: 'docker-hub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh 'DOCKER_CONFIG=/Users/mac/.docker /usr/local/bin/docker login -u $DOCKER_USER -p $DOCKER_PASS'
                        sh 'DOCKER_CONFIG=/Users/mac/.docker /usr/local/bin/docker push yehsey/todo-backend:latest'
                        sh 'DOCKER_CONFIG=/Users/mac/.docker /usr/local/bin/docker push yehsey/todo-frontend:latest'
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
