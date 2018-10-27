let chai = require('chai');
let chaiHttp = require('chai-http');
const expect = require('chai').expect;

chai.use(chaiHttp);
const url= '0.0.0.0:8000';
//const url= '18.221.246.131:8000';
//const url= 'qrvey.aquehorajuega.co:8000';



describe('Unit test',()=>{
    const random = Math.floor(Math.random() * (99999 - 10000) + 10000);
    const email = 'qrvey' + random + '@gmail.com';
    const password = 'qrvey_pass' + random;
    let api_id = "";
    let task_id = "";
    let manual_task_id = "";
    let project_id = "";

    it('Create a user', (done) => {
        chai.request(url)
            .post('/users')
            .send({email: email, password: password})
            .end( function(err,res){
                api_id = res.body.api_id;
                expect(res).to.have.status(200);
                done();
            });
    });

    it('Create user with error', (done) => {
        chai.request(url)
            .post('/users')
            .send({email: "luisoto92mail.com", password: password})
            .end( function(err,res){
                expect(res).to.have.status(400);
                done();
            });
    });

    it('Login', (done) => {
        chai.request(url)
            .get('/users?api_id=' + api_id +'&email=' + email + '&password=' + password)
            .end( function(err,res){
                expect(res).to.have.status(200);
                done();
            });
    });

    it('Create a manual task', (done) => {
        chai.request(url)
            .post('/tasks')
            .send({api_id: api_id, duration: 1000, name: "prueba_qrvey"})
            .end( function(err,res){
                manual_task_id = res.body._id;
                expect(res).to.have.status(200);
                done();
            });
    });

    it('Create a task', (done) => {
        chai.request(url)
            .post('/tasks')
            .send({api_id: api_id, name: "prueba_qrvey"})
            .end( function(err,res){
                task_id = res.body._id;
                expect(res).to.have.status(200);
                done();
            });
    });

    it('Get tasks list', (done) => {
        chai.request(url)
            .get('/tasks?api_id=' + api_id)
            .end( function(err,res){
                expect(res).to.have.status(200);
                done();
            });
    });


    it('Pause task', (done) => {
        chai.request(url)
            .put('/tasks')
            .send({api_id: api_id, _id: task_id, status: "Paused"})
            .end( function(err,res){
                expect(res).to.have.status(200);
                done();
            });
    });

    it('Resume task', (done) => {
        chai.request(url)
            .put('/tasks')
            .send({api_id: api_id, _id: task_id, status: "Running"})
            .end( function(err,res){
                expect(res).to.have.status(200);
                done();
            });
    });

    it('Finish task', (done) => {
        chai.request(url)
            .put('/tasks')
            .send({api_id: api_id, _id: task_id, status: "Finished"})
            .end( function(err,res){
                expect(res).to.have.status(200);
                done();
            });
    });

    it('Delete a task', (done) => {
        chai.request(url)
            .delete('/tasks')
            .send({api_id: api_id, _id: task_id})
            .end( function(err,res){
                expect(res).to.have.status(200);
                done();
            });
    });

    it('Create project', (done) => {
        chai.request(url)
            .post('/projects')
            .send({api_id: api_id, name: "Test project"})
            .end( function(err, res){
                project_id = res.body._id;
                expect(res).to.have.status(200);
                done();
            });
    });

    it('Get project list', (done) => {
        chai.request(url)
            .get('/projects?api_id=' + api_id)
            .end( function(err,res){
                expect(res).to.have.status(200);
                done();
            });
    });


    it('Update project', (done) => {
        chai.request(url)
            .put('/projects')
            .send({api_id: api_id, _id: project_id, name: "New name"})
            .end( function(err,res){
                expect(res).to.have.status(200);
                done();
            });
    });

    it('Delete project', (done) => {
        chai.request(url)
            .delete('/projects')
            .send({api_id: api_id, _id: project_id})
            .end( function(err,res){
                expect(res).to.have.status(200);
                done();
            });
    });

    it('Delete user', (done) => {
        chai.request(url)
            .delete('/users')
            .send({api_id: api_id})
            .end( function(err,res){
                expect(res).to.have.status(200);
                done();
            });
    });


});

