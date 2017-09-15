// Loads the library express which makes creating a server easy in a node application
var express = require('express');
var bodyParser = require('body-parser');

// Instantiate the "app" to start creating server endpoints
var app = express();
var path = require('path');

// expose all files in public/ to be accessible from the root of our website
app.use(express.static('public'));

// POST form data is "url-encoded", so decode that into JSON for us
app.use(bodyParser.urlencoded({ extended: true }));

// Set up where our application will look for client-side files (HTML, CSS, JS)
app.set('view engine', 'hbs');

// Server listens to port 3000
app.listen(3000, function () {
	console.log('Your app is listening on port 3000!');
});

// Root web app endpoint
app.get('/', function (request, response) {
	// response.send('Hello World!');
	response.render('home', {
		title: "Title from Server",
		content: "This is a sentence sent from the server."
	});
});

// Set up another endpoint at /ucla
app.get('/error', function (request, response) {
	response.send('The book is invalid.');
});

app.get('/library', function (request, response) {
	Book.all(function(err, results) {
		response.render('library', {
			books: results
		});
	});
});

/**
 * Define the route to add a book to the library. We are posted the title, author, isbn,
 * and number of copies.
 * If the inputs are valid, create a new book objects and inserts it into the database.
 * Redirect to the library (to re-render the page)
 * If the inputs are not valid, render the error page.
 */
app.post('/books/add', function(request, response) {
	let title = request.body.title;
	let author = request.body.author;
	let isbn = request.body.isbn;
	let copies = parseInt(request.body.copies);
	
	if (title.length > 0 && author.length > 0 && isbn.length > 0 && copies > 0) {
		insertBookIntoDatabase(title, author, copies, isbn);
		response.redirect('/library');
	} else {
		console.log("You tried to add an invalid book into the elibrary.");
		response.redirect('/error');
	}


});

/**
 * Delete a book by its ISBN. We defined a variable in our route, and express puts its
 * into request.params.isbn, since we named the variable `isbn` in the route path.
 * We first find the book object in the database by finding by ISBN, then we remove
 * that object in the database table and redirect to /library.
 */
app.get('/books/delete/:isbn', function(request, response) {
	Book.find({ isbn: request.params.isbn }).remove(function (err) {
		response.redirect('/library');
	});
});

//////////////////////////////////////////////////////
// Database methods 								//
//////////////////////////////////////////////////////

var orm = require('orm');

var db = orm.connect({
	debug : "true",
	protocol : "mysql",
	host     : "localhost",
	database : "mysql",
	password : ""
});

var Book;

db.on('connect', function(err) {
	if (err) throw err;

	console.log("Connection w/ MySQL database successfully formed.");

	// TODO: this could be done in a better way without convoluted 
	//       callback logic
	defineBookSchema(function() {
		var initialBooks = initBooks();
		for (var i = 0; i < initialBooks.length; i++) {
			var book = initialBooks[i];
			insertBookIntoDatabase(book["title"], book["author"], book["copies"], book["isbn"]);			
		}
	});
});

var defineBookSchema = function(callback) {
	Book = db.define('book', {
		title:  {type: 'text'},
		author: {type: 'text'},
		copies: {type: 'number'},
		isbn:   {type: 'text'}
	});

	Book.sync(function() {
		callback();
	});
};

var insertBookIntoDatabase = function(title, author, copies, isbn) {
	var newBook = {
		title : title,
		author : author,
		copies : copies,
		isbn : isbn
	};

  	Book.create(newBook, function(err, results) {
		if (err) throw err;
  	});

  	Book.sync();
};

//////////////////////////////////////////////////////
// Helper Functions:                                //
// Functions after this point have been defined     //
// for you. You can see how they work, but put      //
// all code above this point, and don't modify      //
// or play around with it during the session. You   //
// are free to do that later, though!               //
//////////////////////////////////////////////////////

function initBooks() {
	var initialBooks = [
		{ 
			title: "The Three Musketeers", 
			author: "Alexandre Dumas", 
			copies: 7, 
			isbn: "978-1-56619-909-4" 
		},
		{ title: "Ivanhoe", author: "Sir Walter Scott", copies: 2, isbn: "978-1-46110-482-3" },
		{ title: "The Count of Monte Cristo", author: "Alexandre Dumas", copies: 3, isbn: "978-1-39912-897-1" },
		{ title: "Last of the Mohicans", author: "James Fenimore Cooper", copies: 2, isbn: "978-1-87140-981-4" },
		{ title: "Moby Dick", author: "Herman Melville", copies: 8, isbn: "978-1-09713-891-7" },
		{ title: "A Tale of Two Cities", author: "Charles Dickens", copies: 14, isbn: "978-1-67819-414-4" },
		{ title: "Robin Hood", author: "Howard Pyle", copies: 1, isbn: "978-1-18904-912-4" },
		{ title: "Arabian Nights", author: "Antony Galland", copies: 6, isbn: "978-1-89231-991-4" }
	];

	return initialBooks;
}