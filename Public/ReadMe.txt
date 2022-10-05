The way I organized my code is that I have three pages (that includes a html page and a javascript):

The way each page works is that I have a main that has a bunch of event listeners. I also
toggle between section and show or hide different section based on what needs to be shown. This way
I don't have to make a bunch of html pages. I also have a clear function that removes data from the page
to make sure I don't load the same data multiple times. For example if you seach for a flight you don't want your
previous search's data to still be on the page.

The other thing about the javascript pages is that their main function is just to load the data onto the page
so it is displayed for the user. I think most of the fucntions are self explanitory based on the name.
Basically I will have one function that calls a fetch request and then another function to load the data onto the Page
so most of the uses cases have two functions associated with them.

All the uses cases either have two fucntion if they return data that needs to be loaded onto the page or
they are just html forms that have no function except for the endpoint in app.js that they call.

For example all the create use cases are just html forms and their corresponding endpoin in app.js.
All the uses cases in app.js have comments and should be fairly explanitory.

I believe that in app.js I split the endpoint into section so you can see what is used by which corresponding html
page. The only things that are used my multiple pages are /Logout and /search endpoints.


Here are my three pages explained

Page 1: The Home page (Index.html)
The home page is where you can register both statff and customer, where you can login, and where you can just search for flights

Page 2: Customer.html/customer.js
Here all the customer use cases are implemented.

Page 3: Staff.html/staff.js
Here all the staff uses casese are implemented.


Finally I have one other page which is the backend -- app.js:
In app.js are all the queries, they all have some comments so I think what their function is
is self explanitory.

Instead of just copy and pasting all the endpoints and commenting on them I just comments on the app.js page.