class InvalidInputError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InvalidInputError';
    }
}

class DatabaseError extends Error {
    constructor(message) {
        super(message);
        this.name = 'DatabaseError';
    }
}

class AuthenticationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AuthenticationError';
    }
}

class UserAlreadyExistsError extends Error {
    constructor(message) {
        super(message);
        this.name = 'UserAlreadyExistsError';
    }
}

module.exports = { InvalidInputError, DatabaseError, AuthenticationError, UserAlreadyExistsError }