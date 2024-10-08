'use strict';

let async = require('async');
let invalid =  /(^|\/)(form)($|\/)/;

/**
 * Update 2.3.2
 *
 * @param db
 * @param config
 * @param tools
 * @param done
 *
 * Update all forms to have the required fields.
 */
module.exports = function(db, config, tools, done) {
  let forms = db.collection('forms');
  let projPaths = {};

  let makeUnique = function(form, cb) {
    let iter = 2;
    let comparison = form.path.toString() + iter.toString();
    while (form.path.match(invalid) || projPaths[form.project.toString()].indexOf(comparison) !== -1) {
      comparison = form.path.toString() + (++iter).toString();
    }

    forms.updateOne({_id: form._id}, {$set: {path: comparison.toLowerCase()}})
    .then(() => {
      projPaths[form.project.toString()].push(comparison);
      cb();
    })
    .catch(err => cb(err));
  };

  let verifyUniquePaths = function() {
    projPaths = {};
    forms.find({}).toArray()
    .then(docs => {
      async.eachSeries(docs, function(form, cb) {
        projPaths[form.project.toString()] = projPaths[form.project.toString()] || [];

        if (form.path.match(invalid) || projPaths[form.project.toString()].indexOf(form.path) !== -1) {
          makeUnique(form, cb);
        }
        else {
          projPaths[form.project.toString()].push(form.path);
          cb();
        }
      }, function(err) {
        if (err) {
          return done(err);
        }

        done();
      })

    });
  };

  forms.find({$or: [{path: {$eq: ''}}, {path: {$eq: null}}, {path: {$regex: /(^|\/)(form)($|\/)/}}]})
    .toArray()
    .then(docs => {
      async.eachSeries(docs, function(form, cb) {
        forms.updateOne({_id: form._id}, {$set: {path: form.name.toLowerCase()}})
        .then(() => cb())
        .catch(err => cb(err));
      }, function(err) {
        if (err) {
          return done(err);
        }

        verifyUniquePaths();
      });
    });
};
