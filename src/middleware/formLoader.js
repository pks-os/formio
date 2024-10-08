'use strict';
const _ = require('lodash');

/**
 * Middleware to load a full form if needed.
 *
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
module.exports = function(router) {
  const hook = require('../util/hook')(router.formio);
  return async function formLoader(req, res, next) {
    if (
      req.method !== 'GET' ||
      Array.isArray(res.resource.item) ||
      (_.get(req, '__rMethod', 'get') !== 'get')
    ) {
      return next();
    }

    let shouldLoadSubForms = true;
    // Only process on GET request, and if they provide full query.
    if (
      !req.full ||
      !res.resource ||
      !res.resource.item
    ) {
      shouldLoadSubForms = false;
    }

    // Allow modules to hook into the form loader middleware.
    await hook.alter('formResponse', res.resource.item, req);
    // Load all subforms recursively.
    if (shouldLoadSubForms) {
      await router.formio.cache.loadSubForms(res.resource.item, req);
      return next();
    }
    else {
      return next();
    }
  };
};
