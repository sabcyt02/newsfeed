# newsfeed

This is a web-based newsfeed application using Express.Js, JavaScript, AJAX, HTML, CSS and MongoDB.

It implements a few functions, such as news lists and single news entry displaying, pages switching, news headline searching, displaying and checking comments under every news entry.

Please visit http://127.0.0.1:8081/newsfeed.html to access the application

structure of the database assignment1:

userList
{'_id': xxx, 'name': 'xxx', 'password': 'xxx', 'icon': 'images/xxx'}

newsList
{'_id': xxx, 'headline':'xxx', 'time': 'xxx', 'content': 'xxx', 'comments': [...]}

for every object in the comments array, 
{'userID': _id of the comment user, 'time': time of comment, 'comment': comment}
