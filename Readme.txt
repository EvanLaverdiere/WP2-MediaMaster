Step by step instructions on how to use MediaMaster's website

1. Initialize the docker image. Run the following in your terminal:
docker run -p 10006:3306 --name MediaMasterSqlDb -e MYSQL_ROOT_PASSWORD=pass -e MYSQL_DATABASE=mediamaster_db -d mysql:5.7

2. (Optional) Connect to database in terminal. Run the following in your terminal:
docker container exec -it MediaMasterSqlDb bash

3. Install modules. Note: no non-standard modules installed. Run the following in your terminal:
npm i

4. Run docker image and launch program.

5. Visit our home page
http://localhost:1339/home

6. Register an account by clicking the "Register" button. Enter the following and submit:
Username: NewUser
Password: WebProgrammingII

7. Once redirected to the login page, login with your credentials. Enter the following and submit:
Username: NewUser
Password: WebProgrammingII

8. (Optional) Once redirected to the User Profile page, you can change theme by clicking on the Sun/Moon icon or using the dropdown list.

9. Yoiu can add a song by clicking on "Add". Enter the following and submit:
Title: Stay With Me
Artist: Miki Matsubara
Album: (Can be empty)
Genre: Pop

10. Search for that song by clicking on "Show song". Enter the following and submit:
Title: Stay With Me
Artist: Miki Matsubara

11. Click on "My songs". You will see a table with all of your songs.

12. You can edit a song by clicking on "Edit". Enter the following and submit:
Old Title: Stay With Me
Old Artist: Miki Matsubara
New Title: Thriller
New Artist: Michael Jackson
New Album: Thriller
Genre: Pop

13. You can delete a song by clicking on "Delete". Enter the following and submit:
Title: Thriller
Artist: Michael Jackson

14. Click on "About Us" to show some nice information about our team.

15. Click on "[Your username]" (In our case it should show "NewUser") to go back to your user profile.

16. Once finished visiting the site, you can click "Logout" to log out of the application.

17. Now, if you try accessing any of the CRRUD forms, you will be prompted to login first.