const { AuthenticationError } = require('apollo-server-express');
const { User } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        me: async (parent, args, context ) => {
            if (context.user) {
                const userData = await User
                    .findOne({ _id: context.user._id})
                    .select('-__v -password')
                    .populate('books');
                
                return userData;
            }
            throw new AuthenticationError('You are not logged in.');

        },
    },

    Mutation: {
        //login: Accepts an email and password as parameters; returns an Auth type.

        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });

            if (!user) {
                throw new AuthenticationError('Login credentials are incorrect.');
            };

            const correctPw = await user.isCorrectPassword(password);

            if(!correctPw) {
                throw new AuthenticationError('Login credentials are incorrect.');
            };

            const token = signToken(user);
            return { token, user };

        },
        //addUser: Accepts a username, email, and password as parameters; returns an Auth type.
        
        addUser: async (parent, args) => {
            const user = await User.create(args);
            const token = signToken(user);

            return { token, user };
        },
        //saveBook: Accepts a book author's array, description, title, bookId, image, and link as parameters; returns a User type.
        saveBook: async (parent, { bookData }, context) => {
            if (context.user) {
                const updatedUser = await User
                .findOneAndUpdate(
                    { _id: context.user._id },
                    { $addToSet: { savedBooks: bookData }},
                    { new: true },
                    
                ).populate('books');
                return updatedUser;
            }
            throw new AuthenticationError('Please log in to save books.');
        },
        //removeBook: Accepts a book's bookId as a parameter; returns a User type.
        removeBook: async (parent, { bookId }, context) => {
            if (context.user) {
                const updatedUser = await User
                .findOneAndUpdate(
                    { _id: context.user._id },
                    { $pull: { savedBooks: { bookId } }},
                    { new: true },
                );
                return updatedUser;
            }
            throw new AuthenticationError('Please log in to delete books');
        }
    },
};

module.exports = resolvers;