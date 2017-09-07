const mongoose = require('mongoose');

const blogSchema = mongoose.Schema({
	title: String,
	author: {
		firstName: String,
		lastName: String
	},
	content: String
});

blogSchema.methods.apiRepr = function() {
  return {
    id: this._id,
    title: this.title,
    author: this.author.firstName + " " + this.author.lastName,
   	content: this.content,
  };
}

const Blog = mongoose.model('Blog', blogSchema);

module.exports = { Blog };