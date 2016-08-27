import deasync from "deasync";

exports.waitForPromise = deasync((promise, cb) => promise.asCallback(cb));
