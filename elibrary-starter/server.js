// Loads the library express which makes creating a server easy in a node application
var express = require('express');
var bodyParser = require('body-parser');

// Instantiate the "app" to start creating server endpoints
var app = express();
var books = initBooks();

// expose all files in public/ to be accessible from the root of our website
app.use(express.static('public'));

// POST form data is "url-encoded", so decode that into JSON for us
app.use(bodyParser.urlencoded({ extended: true }));

// Set up where our application will look for client-side files (HTML, CSS, JS)
app.set('view engine', 'hbs');

// Import Sequelize and configure it
const Sequelize = require('sequelize');
const sequelize = new Sequelize('mysql', 'root', 'my-secret-pw', {
	host: 'localhost',
	dialect: 'mysql'
});

// Create MySQL database connection between server and the database
sequelize
	.authenticate()
	.then(function() {
		console.log('Connection has been established successfully.');
	})
	.catch(function(err) {
		console.error('Unable to connect to the database:', err);
	});

// Define database schema/data structure format
const Book = sequelize.define('book', {
	title: { type: Sequelize.STRING },
	author: { type: Sequelize.STRING },
	copies: { type: Sequelize.INTEGER },
	isbn: { type: Sequelize.STRING }
});

// Create database table for Book
Book.sync({ force: true }).then(function() {
	var initialBooks = initBooks();
	return Book.bulkCreate(initialBooks);
}).then(function(books) {
	for(var i = 0; i < books.length; i++) {
		console.log(books[i].title);
	}
})

// Server listens to port 3000
app.listen(3000, function () {
	console.log('Your app is listening on port 3000!');
});

// Root web app endpoint
app.get('/', function (request, response) {
	response.render('home', {
		title: "Title from Server",
		content: "This is a sentence sent from the server."
	});
});

// Set up another endpoint at /ucla
app.get('/error', function (request, response) {
	response.send('The book is invalid.');
});

// Make database call to find all books and pass them to handlebars view
app.get('/library', function (request, response) {
	Book.findAll().then(function(results) {
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
	let inputTitle = request.body.title;
	let inputAuthor = request.body.author;
	let inputIsbn = request.body.isbn;
	let inputCopies = parseInt(request.body.copies);
	
	if (inputTitle.length > 0 && inputAuthor.length > 0 && inputIsbn.length > 0 && inputCopies > 0) {
		Book.create({
			title: inputTitle,
			author: inputAuthor,
			copies: inputCopies,
			isbn: inputIsbn
		}).then(function() {
			response.redirect('/library');
		})
	} else {
		console.log("You tried to add an invalid book into the elibrary.");
		response.redirect('/error');
	}
});

// 3) TODO: Replace looping over array variable to find and remove book from array into 
//          querying the database and deleting it from the database
/**
 * Delete a book by its ISBN. We defined a variable in our route, and express puts its
 * into request.params.isbn, since we named the variable `isbn` in the route path.
 * We loop through the list of books to find the index of the one with an ISBN of the
 * give one, and once we do, we remove it (see Array.splice, MDN), and stop checking, 
 * to immediately refresh the library.
 */
app.get('/books/delete/:isbn', function(request, response) {
	var isbn = request.params.isbn;
	for (var i = 0; i < books.length; i++) {
		if (books[i].isbn === isbn) {
			books.splice(i, 1);
			break;
		}
	}

	response.redirect('/library');
});

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