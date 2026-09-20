const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.get('/:type', controller.getLookupData);
router.get('/', (req, res) => controller.getLookupData({ params: { type: 'all' } }, res));

module.exports = router;
