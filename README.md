# WP2-MediaMaster

Final project of the Winter 2022 Web Programming II course, written in collaboration with [Jeremy Oroc](https://github.com/JeremyOroc) and [Julian Hernandez](https://github.com/Julian-Hernandez1). 

MediaMaster is a transactional MVC web application where users can log in to store simple data about their personal song collections on a local MySQL database stored in a docker image. The user can enter, retrieve, update or delete this information by filling out and submitting forms on various pages of the MediaMaster website. The website also makes use of cookies for various purposes.

## Command to initialize the docker image

docker run -p 10006:3306 --name MediaMasterSqlDb -e MYSQL_ROOT_PASSWORD=pass -e MYSQL_DATABASE=mediamaster_db -d mysql:5.7

## Command to run the docker image and connect to the database

docker container exec -it MediaMasterSqlDb bash
