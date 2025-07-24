const express = require('express');
const router = express.Router();
const geocodeService = require('../services/geocode');

router.get('/', geocodeService.getAddress);

module.exports = router;
