pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Docker Build') {
            steps {
                sh 'docker build -t my-portfolio:jenkins .'
            }
        }

        stage('Kubernetes Connection Test') {
            steps {
                withCredentials([
                    string(credentialsId: 'jenkins-k8s-token', variable: 'KUBE_TOKEN')
                ]) {
                    sh '''
                        kubectl \
                        --server=https://172.31.27.252:6443 \
                        --token="$KUBE_TOKEN" \
                        --insecure-skip-tls-verify=true \
                        get nodes
                    '''
                }
            }
        }
    }
}
