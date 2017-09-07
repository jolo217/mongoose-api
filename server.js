const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');

const {PORT, DATABASE_URL} = require('./config');
const {Blog} = require('./models');

const app = express();

app.use(bodyParser.json());
app.use(morgan('common'));

//mongoose.Promise = global.promise;

app.get('/posts/:id', (req, res) => {
	Blog
		.findById(req.params.id)
		.then(Blog => res.json(Blog.apiRepr()))
		.catch(err => {
			console.error(err);
			res.status(500).json({error: 'Something went wrong'});
		});
});

app.post('/posts', (req, res) => {
	const requiredFields = ["title", "author", "content"];
	for (let i=0; i<requiredFields.length; i++) {
		const field = requiredFields[i];
		if(!(field in req.body)) {
			const message = `Missing \`${field}\` in request body`
			console.error(message);
			return res.status(400).send(message);
		}
	}

Blog
	.create({
		title: req.body.title,
		content: req.body.content,
		author: req.body.author
	})
	.then(Blog => res.status(201).json(Blog.apiRepr()))
	.catch(err => {
		console.error(err);
		res.status(500).json({error: 'Something went wrong'});
	});
});

app.put('/posts/:id', (req, res) => {
	if (!(req.params.id && req.body.id && req.body.id === req.body.id)) {
		const message = (`Request path id (${req.params.id}) and request body id ` + `(${req.body.id}) must match`);
		console.error(err);
		res.status(500).json({error: 'Something went wrong'});
	}
	const toUpdate = {};
	const updateableFields = ['title', 'author', 'content'];

	updateableFields.forEach(field => {
		if (field in req.body) {
			toUpdate[field] = req.body[field];
		}
	});

	Blog
		.findByIdAndUpdate(req.params.id, {$set: toUpdate})
		.then(Blog => res.status(204).end())
		.catch(err => {
		console.error(err);
		res.status(500).json({error: 'Something went wrong'});
	});
});

app.delete('/posts/:id', (req, res) => {
	Blog
		.findByIdAndRemove(req.params.id)
		.then(Blog => res.status(204).end())
		.catch(err => {
		console.error(err);
		res.status(500).json({error: 'Something went wrong'});
	});
});

app.use('*', (req, res) => {
	res.status(404).json({message: 'Not Found'});
	});

let server;

function runServer(databaseUrl=DATABASE_URL, port=PORT) {

  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, err => {
      if (err) {
        return reject(err);
      }
      server = app.listen(port, () => {
        console.log(`Your app is listening on port ${port}`);
        resolve();
      })
      .on('error', err => {
        mongoose.disconnect();
        reject(err);
      });
    });
  });
}

function closeServer() {
  return mongoose.disconnect().then(() => {
     return new Promise((resolve, reject) => {
       console.log('Closing server');
       server.close(err => {
           if (err) {
               return reject(err);
           }
           resolve();
       });
     });
  });
}

if (require.main === module) {
  runServer().catch(err => console.error(err));
};

module.exports = {app, runServer, closeServer};