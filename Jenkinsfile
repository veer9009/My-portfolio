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

        stage('Docker Push') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-credentials',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )
                ]) {
                    sh '''
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                        docker tag my-portfolio:jenkins $DOCKER_USER/my-portfolio:v1
                        docker push $DOCKER_USER/my-portfolio:v1
                        docker logout
                    '''
                }
            }
        }

        stage('Kubernetes Deploy') {
            steps {
                withCredentials([
                    string(
                        credentialsId: 'jenkins-k8s-token',
                        variable: 'KUBE_TOKEN'
                    )
                ]) {
                    sh '''
                        kubectl \
                        --server=https://172.31.27.252:6443 \
                        --token="$KUBE_TOKEN" \
                        --insecure-skip-tls-verify=true \
                        set image deployment/my-portfolio \
                        my-portfolio=aligarveeresh/my-portfolio:v1

                        kubectl \
                        --server=https://172.31.27.252:6443 \
                        --token="$KUBE_TOKEN" \
                        --insecure-skip-tls-verify=true \
                        rollout status deployment/my-portfolio
                    '''
                }
            }
        }
    }
}
