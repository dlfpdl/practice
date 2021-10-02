const express = require('express');
const router = express.Router();

// @route  GET api/user
// @desc   Test Route
// @access Public

router.get('/', (req, res) => res.send('post route'));

module.exports = router;