const express = require('express');
const router = express.Router();
const controller = require('../controller/network');

router.route('/create').post(controller.create);
router.route('/remove').get(controller.remove);
router.route('/getAll').get(controller.getAll);
router.route('/getOne').get(controller.getOne);

module.exports = router;