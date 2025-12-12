pipeline {
    agent any

    environment {
        DOCKER_HUB_CREDENTIALS = credentials('docker-hub-cred')
        DOCKER_HUB_USERNAME = 'uttamhamsaraj24'
        BACKEND_IMAGE = "${DOCKER_HUB_USERNAME}/doctor-appointment-backend:latest"
        FRONTEND_IMAGE = "${DOCKER_HUB_USERNAME}/doctor-appointment-frontend:latest"
        REGISTRY = 'docker.io'
    }

    stages {
        stage('Step 1 : Git Clone') {
            steps {
                script {
                    echo " Step 1 : Git Clone "
                    checkout scm
                    sh 'git log -1 --oneline'
                }
            }
        }

        stage(' Step 2 : Install Requirements') {
            steps {
                script {
                    echo "Setup Backend Stage "
                    sh 'cd backend && npm install'
                    echo "Backend dependencies installed successfully"
                }
            }
        }

        stage(' Step 3 : Test Backend') {
            steps {
                script {
                    echo "Test Backend Stage"
                    catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
                        sh 'cd backend && npm test'
                    }
                    echo "Backend tests completed"
                }
            }
        }
        // }

        stage(' Step 4 : Build and Push Backend Docker Image') {
            steps {
                script {
                    echo " Build and Push Backend Docker Image Stage "         
                    // Login to Docker Hub
                    sh '''
                        echo $DOCKER_HUB_CREDENTIALS_PSW | docker login -u $DOCKER_HUB_CREDENTIALS_USR --password-stdin
                    '''              
                    // Build Backend Image
                    sh '''
                        cd backend
                        docker build -t ${BACKEND_IMAGE} .
                        echo "Backend Docker image built successfully"
                    '''
                    // Push Backend Image
                    sh '''
                        docker push ${BACKEND_IMAGE}
                        echo "Backend Docker image pushed to Docker Hub"
                    '''
                }
            }
        }

        stage(' Step 5 : Build and Push Frontend Docker Image') {
            steps {
                script {
                    echo "Build and Push Frontend Docker Image Stage"
                    // Build Frontend Image
                    sh '''
                        cd frontend
                        docker build -t ${FRONTEND_IMAGE} .
                        echo "Frontend Docker image built successfully"
                    '''
                    // Push Frontend Image
                    sh '''
                        docker push ${FRONTEND_IMAGE}
                        echo "Frontend Docker image pushed to Docker Hub"
                    '''
                }
            }
        }

        stage(' Step 6 : Clean Docker Images') {
            steps {
                script {
                    echo "Clean Docker Images Stage"
                    sh '''
                        echo "Removing unused Docker containers..."
                        docker container prune -f || true
                        echo "Docker containers pruned"
                        
                        echo "Removing unused Docker images..."
                        docker image prune -f || true
                        echo "Docker images pruned"
                    '''
                }
            }
        }

        stage(' Step 7 : Ansible Deployment') {
            steps {
                script {
                    echo " Ansible Deployment Stage"
                    echo "Triggering Ansible Playbook for Kubernetes Deployment"
                    // Execute Ansible Playbook using Ansible Plugin
                    ansiblePlaybook(
                        inventory: 'Deployment/inventory',
                        playbook: 'Deployment/deploy.yml',
                        verbosity: 1,
                        colorized: true,
                        disableHostKeyChecking: true,
                        extras: '-e ansible_python_interpreter=/usr/bin/python3'
                    )
                    echo "Ansible playbook executed successfully"
                }
            }
        }
    }

    post {
        always {
            script {
                echo "Pipeline Execution Completed"
                
                // Cleanup Docker login
                sh '''
                    docker logout || true
                '''
            }
        }

        success {
            script {
                echo "Pipeline Succeeded"
                echo "Doctor Appointment Application deployed successfully!"
            }
        }

        failure {
            script {
                echo "Pipeline Failed"
                echo "Please check the logs above for more details"
            }
        }
    }
}
