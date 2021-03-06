const expect = require('expect');
const request = require('supertest');
const mongoose = require('mongoose');

const { app } = require('./../server');
const { Todo } = require('./../model/todo');
const { ObjectID } = require('mongodb');

const todos = [{
    _id: new ObjectID(),
    text: 'First test todo'
}, {
    _id: new ObjectID(),
    text: 'Second test todo',
    completed: true
}];

beforeEach((done) => {
    Todo.remove({}).then(() => {
        return Todo.insertMany(todos);
    }).then(() => done()); // Clears the document before starting the test run
});

describe('POST /todos', () => {

    it('should create new todo', (done) => {
        var text = 'test todo text';

        request(app)
            .post('/todos') // Route
            .send({ text }) // Data sent with Post request
            .expect(200)    // response status code
            .expect((res) => {  // Verify that the response contains the text that was sent with request
                expect(res.body.text).toBe(text);
            })
            .end((err, res) => {
                if (err) {
                    return done(err); // If error, return with error
                }

                // Verify that the todo actually got saved in database
                Todo.find({ text }).then((todos) => {
                    expect(todos.length).toBe(1);
                    expect(todos[0].text).toBe(text);
                    done();
                }).catch((e) => done(e));
            });

    }); // First it ends

    it('should not create a todo with invalid data', () => {
        request(app)
            .post('/todos')
            .send({})
            .expect(400)
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                Todo.find().then((todos) => {
                    expect(todos.length).toBe(2);
                }).catch((e) => done(e));
            });
    });  // Second it ends
}); // Describe ends


describe('GET /todos', () => {

    it('it should get all todos', (done) => {
        request(app)
            .get('/todos')
            .expect(200)
            .expect((res) => {
                expect(res.body.todos.length).toBe(2);
            })
            .end(done);
    });
});

describe('GET /todos/:id', () => {
    it('should return todo doc', (done) => {
        request(app)
            .get(`/todos/${todos[0]._id.toHexString()}`)
            .expect(200)
            .expect((res) => {
                expect(res.body.todo.text).toBe(todos[0].text)
            })
            .end(done);
    });

    it('should return 404 if todo not found', (done) => {

        var hexId = new ObjectID().toHexString();

        request(app)
            .get(`/todos/${hexId}`)
            .expect(404)
            .end(done);
    });

    // it('should return 404 for non-object IDs', (done) => {

    //     var invalidId = mongoose.Types.ObjectId('123789456asl13h56fh3ixbe');

    //         //mongoose.mongo.BSONPure.ObjectID.fromHexString("123abc");

    //     request(app)
    //         .get(`/todos/${invalidId}`)
    //         .expect(404)
    //         .end(done);
    // });
});

describe('DELETE /todos/:id', () => {

    it('should remove a todo', (done) => {
        var hexId = todos[0]._id.toHexString();

        request(app)
            .delete(`/todos/${hexId}`)
            .expect(200)
            .expect((res) => {
                //console.log(res.body._id);
                expect(res.body._id).toBe(hexId);
            })
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                Todo.findById(hexId).then((todo) => {
                    expect(todo).toBeFalsy();
                    done();
                }).catch((e) => done(e));
        });
    });

    it('should return 404 if todo not found', (done) => {

        var hexId = new ObjectID().toHexString();

        request(app)
            .delete(`/todos/${hexId}`)
            .expect(404)
            .end(done);
    });

    it('should return 404 if id is invalid', (done) => {
        
        request(app)
            .delete('/todos/test123')
            .expect(400)
            .end(done);
    });
});

describe('PATCH todos/:id', () => {
    
    it('should update todo', (done) =>{

    // Get the id
    // update text, set completed true
    // 200
    // text is changed, completed is true, completedAt is a number

        var hexId = todos[0]._id.toHexString();
        var text = 'This should be new text';

        request(app)
            .patch(`/todos/${hexId}`)
            .send({
                text,
                completed: true
            })
            .expect(200)
            .expect((res) => {
                expect(res.body.todo.text).toBe(text);
                expect(res.body.todo.completed).toBe(true);
                expect(typeof res.body.todo.completedAt).toBe('number');
            })
            .end(done);
    });
    
    it('should clear completedAt when completed is not true', (done) => {

        var hexId = todos[0]._id.toHexString();
        var text = 'This is new text';

        request(app)
            .patch(`/todos/${hexId}`)
            .send({
                text,
                completed: false
            })
            .expect(200)
            .expect((res) => {
                expect(res.body.todo.text).toBe(text);
                expect(res.body.todo.completed).toBe(false);
                expect(res.body.todo.completedAt).toBe(null);
            })
            .end(done);
    });
});










