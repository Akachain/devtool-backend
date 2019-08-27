const express = require('express');
const router = express.Router();
const controller = require('../controller/chaincode');
const validate = require('express-validation');
const val = require('../validations/chaincode');

router.route('/init').post(validate(val.init), controller.init);
router.route('/invoke').post(validate(val.invoke), controller.invoke);
router.route('/query').post(validate(val.query), controller.query);
router.route('/getAll').get(controller.getAll);
router.route('/getOne').get(controller.getOne);

module.exports = router;