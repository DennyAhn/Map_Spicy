const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/details', async (req, res) => {
    const { latitude, longitude } = req.query;
    const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

    try {
        // 먼저 주변 장소 검색
        const nearbyResponse = await axios.get(
            `https://maps.googleapis.com/maps/api/place/nearbysearch/json`,
            {
                params: {
                    location: `${latitude},${longitude}`,
                    radius: 100,
                    key: GOOGLE_API_KEY
                }
            }
        );

        if (nearbyResponse.data.status === 'OK' && nearbyResponse.data.results.length > 0) {
            const placeId = nearbyResponse.data.results[0].place_id;
            
            // Place Details 요청
            const detailsResponse = await axios.get(
                `https://maps.googleapis.com/maps/api/place/details/json`,
                {
                    params: {
                        place_id: placeId,
                        key: GOOGLE_API_KEY,
                        fields: 'name,formatted_address,geometry'
                    }
                }
            );

            res.json(detailsResponse.data);
        } else {
            res.status(404).json({ error: 'No places found' });
        }
    } catch (error) {
        console.error('Error fetching place details:', error);
        res.status(500).json({ error: 'Failed to fetch place details' });
    }
});

module.exports = router;