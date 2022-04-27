# WP2-MediaMaster

## Command to initialize the docker image

docker run -p 10006:3306 --name MediaMasterSqlDb -e MYSQL_ROOT_PASSWORD=pass -e MYSQL_DATABASE=mediamaster_db -d mysql:5.7

## Command to run the docker image and connect to the database

docker container exec -it MediaMasterSqlDb bash