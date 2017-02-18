const EasyExport = require('utils/easy-export');
const auth = require('auth/authenticate');
const user = require('auth/user');
const winston = require('winston');
let User = user.User;

let the_export = EasyExport();
module.exports = the_export;

let bad_request = {
  'error' : 'bad request'  
};

let server_error = {
    'error' : 'internal server error'
};

let forbidden = {
    'error' : 'insufficient permission'
}

let success = {
    
};

let ALLOW_USER_MODIFY_PROPERTIES = ['name', 'email', 'personal_notes', 'personal_extra'];
let ALLOW_DOCTOR_MODIFY_PROPERTIES = ['doctors_notes', 'doctors_instructions', 'doctors_extra', 'medications'];

let add_user_routes = function(app) {
    app.all('/user/info', auth.authenticationMiddleware, function(req, res, next) {
        let id = req.user.id;
        User.findById(id, function (err, user) {
            if (!user) {
                res.status(404);
                let errorObject = {'error' : 'Object not found.'};
                res.send(JSON.stringify(errorObject));
                return next();
            }
            if (err) {
                res.status(500);
                res.send(JSON.stringify(server_error));
                return next();
            }
            res.status(200).send(JSON.stringify(user.properties));
            next();
        });
    });
    
    app.post('/user/addPatient', auth.authenticationMiddleware, function(req, res, next) {
       let patientId = req.body['patientId'] ;
       if (!patientId) {
           res.status(400).send(JSON.stringify(bad_request));
           return next();
       }
       User.findById(patientId, function(err, patient) {
          if (err || !patient) {
              winston.log('info', 'Error finding patient', err);
              res.status(500).send(JSON.stringify(server_error));
              return next();
          }
          let doctor = req.user;
          if (!patient.properties.doctorRequests) {
              patient.properties.doctorRequests = [];
          }
          if (!patient.properties.doctors) {
              patient.properties.doctors = [];
          }
          if (patient.properties.doctorRequests.indexOf(doctor.id) == -1 && patient.properties.doctors.indexOf(doctor.id) == -1) {
               patient.properties.doctorRequests.push(doctor.id);
               patient.saveToDatabase(function(err, user) {
                  if (err) {
                      winston.log('info', 'Error occurred in save', err);
                  }
              
            });
          }
          res.status(200).send(JSON.stringify(success));
       });
       next();
    });
    
    app.post('/user/addDoctor', auth.authenticationMiddleware, function(req, res, next) {
        let doctorId = req.body['doctorId'];
        if (!doctorId) {
            res.status(400).send(JSON.stringify(bad_request));
            return next();
        }
        
        User.findById(doctorId, function(err, doctor) {
            if (err || !doctor) {
                winston.log('info', 'Error finding doctor', err);
                res.status(500).send(JSON.stringify(server_error));
                return next();
            }
            let patient = req.user;
            if (!doctor.properties.patientRequests) {
                doctor.properties.patientRequests = [];
            }
            if (!doctor.properties.patients) {
                doctor.properties.patients = [];
            }
            if (doctor.properties.patientRequests.indexOf(patient.id) == -1 && doctor.properties.patients.indexOf(patient.id) == -1) {
                doctor.properties.patientRequests.push(patient.id);
                doctor.saveToDatabase(function(err, user) {
                    if (err) {
                        winston.log('info', 'Error occurred in save', err);
                    }
                });
            }
        });
        
    });
    
    app.post('/user/confirmRequest', function(req, res, next) {
       let requester = req.body['requesterId'];
       if (!requester) {
           res.status(400).send(JSON.stringify(bad_request));
           return next();
       }
       
       let currentPerson = req.user;
       
       let patientRequests = currentPerson.properties['patientRequests'];
       let doctorRequests = currentPerson.properties['doctorRequests'];
       
       for (let i = 0; patientRequests && i < patientRequests.length; i++) {
           if (patientRequests[i] == requester.id) {
               // Approve the request
               if (!currentPerson.properties.patients) {
                   currentPerson.properties.patients = [];
               }
               
               currentPerson.properties.patients.push(requester.id);
               requester.properties.doctors.push(currentPerson.id);
               patientRequests.splice(i, 1);
               break;
           }
       }
       
       for (let i = 0; doctorRequests && i < doctorRequests.length; i++) {
           if (doctorRequests[i] == requester.id) {
               // Approve the request
               if (!currentPerson.properties.doctors) {
                   currentPerson.properties.doctors = [];
               }
               
               currentPerson.properties.doctors.push(requester.id);
               requester.properties.patients.push(currentPerson.id);
               doctorRequests.splice(i, 1);
               break;
           }
       }
       currentPerson.saveToDatabase(function(err, user) {
           if (err) {
               winston.log('info', 'Error occurred on save', err);
               res.status(500).send(JSON.stringify(server_error));
               return;
           }
           res.status(200).send(JSON.stringify(success));
       });
    });
    app.post('/user/updateInfo', function(req, res, next) {
        let userId = req.body.id;
        
        User.findById(userId, function(err, user) {
            if (err) {
                res.status(400).send(JSON.stringify(bad_request));
                
            }
            let editorId = req.user.id;
        
            if (editorId == userId) {
                var allowedFields = ALLOW_USER_MODIFY_PROPERTIES;
            } else if (req.user.patients.indexOf(userId) != -1) {
                var allowedFields = ALLOW_DOCTOR_MODIFY_PROPERTIES;
            } else {
                res.status(403).send(JSON.stringify(forbidden));
                return next();
            }
        
            let replacementData = req.body.data;
        
        
            for (let field in allowedFields) {
                if (!replacementData.hasOwnProperty(field)) continue;
                if (replacementData[field] == null) {
                    delete user.properties[field];
                } else {
                    user.properties[field] = replacementData[field];
                }
            }
        });
        
    });
}
the_export.functions.push(add_user_routes);