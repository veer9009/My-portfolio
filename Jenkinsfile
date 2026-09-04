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
                sh 'sudo docker build -t my-portfolio:jenkins .'
            }
        }

    }
}
